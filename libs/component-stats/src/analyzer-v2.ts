import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { ComponentStats, AnalyzerOptions } from './types';
import { parseTemplate } from '@angular/compiler';
import { NgtscProgram } from '@angular/compiler-cli';

interface ComponentInfo {
  className: string;
  selector: string;
  filePath: string;
  isStandalone: boolean;
  imports?: string[];
  templateContent?: string;
  availableComponents?: Map<string, string>; // selector -> component class name
}

interface TemplateUsage {
  componentClass: string;
  usedSelector: string;
  filePath: string;
}

// Helper to recursively walk template nodes and find component usage
function walkTemplateNodes(
  nodes: any[],
  componentClass: string,
  templateUsages: TemplateUsage[],
  allSelectors: Set<string>
): void {
  for (const node of nodes) {
    // Check if this is an element node with a name
    if (node.name && typeof node.name === 'string') {
      // Record any custom element (non-standard HTML)
      if (node.name.includes('-') || allSelectors.has(node.name)) {
        templateUsages.push({
          componentClass,
          usedSelector: node.name,
          filePath: '' // Will be resolved later
        });
      }
    }

    // Recursively walk children
    if (node.children && Array.isArray(node.children)) {
      walkTemplateNodes(node.children, componentClass, templateUsages, allSelectors);
    }
  }
}

export class AngularComponentAnalyzer {
  private program: ts.Program;
  private ngProgram: NgtscProgram | null = null;
  private typeChecker: ts.TypeChecker;
  private components: Map<string, ComponentInfo> = new Map();
  private selectorToComponent: Map<string, ComponentInfo> = new Map();
  private templateUsages: TemplateUsage[] = [];
  private projectPath: string;
  private allKnownSelectors: Set<string> = new Set();

  constructor(private options: AnalyzerOptions) {
    this.projectPath = path.resolve(options.projectPath);
    const tsconfigPath = options.tsconfigPath || this.findTsConfig();
    
    console.log(`Using tsconfig: ${tsconfigPath}`);
    
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(tsconfigPath)
    );
    
    // Create Angular compiler program
    try {
      this.ngProgram = new NgtscProgram(
        parsedConfig.fileNames,
        parsedConfig.options,
        ts.createCompilerHost(parsedConfig.options),
        this.ngProgram as any
      );
      this.program = this.ngProgram.getTsProgram();
    } catch (error) {
      this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
    }
    
    this.typeChecker = this.program.getTypeChecker();
  }

  private findTsConfig(): string {
    // Try common Angular/Nx tsconfig file names in order of preference
    const candidates = [
      'tsconfig.app.json',  // Angular/Nx app-specific config
      'tsconfig.json',      // Standard config
      'tsconfig.lib.json',  // Angular/Nx library config
    ];

    for (const candidate of candidates) {
      const tsconfigPath = path.join(this.projectPath, candidate);
      if (fs.existsSync(tsconfigPath)) {
        // Check if this config actually includes files
        const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
        const parsed = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(tsconfigPath)
        );
        
        // If this config has files, use it
        if (parsed.fileNames.length > 0) {
          return tsconfigPath;
        }
      }
    }
    
    throw new Error('No valid tsconfig.json found in project path. Tried: ' + candidates.join(', '));
  }

  async analyze(): Promise<ComponentStats[]> {
    // Step 1: Find all components in the project
    await this.discoverComponents();
    
    // Step 2: Discover all selectors (including from libraries) using Angular compiler
    await this.discoverAllSelectors();
    
    // Step 3: Parse templates and find component usage
    await this.parseTemplates();
    
    // Step 4: Aggregate results
    return this.aggregateResults();
  }

  private async discoverComponents(): Promise<void> {
    const sourceFiles = this.program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && sf.fileName.includes(this.projectPath));

    for (const sourceFile of sourceFiles) {
      this.visitNode(sourceFile);
    }
  }

  private async discoverAllSelectors(): Promise<void> {
    console.log('Analyzing imports to discover library components...');
    
    // For each project component, resolve its imports to find available components
    for (const [className, component] of this.components) {
      if (component.imports && component.imports.length > 0 && !component.filePath.includes('node_modules')) {
        component.availableComponents = new Map();
        await this.resolveComponentImports(component);
      }
    }
    
    console.log(`Resolved imports for ${this.components.size} components`);
  }

  private async resolveComponentImports(component: ComponentInfo): Promise<void> {
    const sourceFile = this.program.getSourceFile(component.filePath);
    if (!sourceFile) return;

    console.log(`\nResolving imports for ${component.className}:`);

    // Find all import declarations in the component file
    sourceFile.forEachChild(node => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        
        // Get the imported names
        const namedBindings = node.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const element of namedBindings.elements) {
            const importedName = element.name.text;
            
            // Check if this imported name is used in the component's imports array
            if (component.imports?.some(imp => imp.includes(importedName))) {
              console.log(`  Found import: ${importedName} from ${moduleSpecifier}`);
              // Resolve this import to find components/directives it provides
              this.resolveModuleComponents(moduleSpecifier, importedName, component, sourceFile);
            }
          }
        }
      }
    });
  }

  private resolveModuleComponents(
    moduleSpecifier: string,
    importedName: string,
    component: ComponentInfo,
    sourceFile: ts.SourceFile
  ): void {
    // Try to resolve the module
    const resolvedModule = ts.resolveModuleName(
      moduleSpecifier,
      sourceFile.fileName,
      this.program.getCompilerOptions(),
      ts.sys
    );

    if (resolvedModule.resolvedModule) {
      const resolvedFile = this.program.getSourceFile(resolvedModule.resolvedModule.resolvedFileName);
      if (resolvedFile) {
        // Scan this file for component/directive exports
        this.extractComponentsFromModule(resolvedFile, component, importedName);
      }
    }
  }

  private extractComponentsFromModule(
    moduleFile: ts.SourceFile,
    component: ComponentInfo,
    moduleName: string
  ): void {
    const visit = (node: ts.Node) => {
      // Look for @Component or @Directive decorators
      if (ts.isClassDeclaration(node) && node.name) {
        const decorators = ts.getDecorators?.(node) || (node as any).decorators;
        
        if (decorators) {
          for (const decorator of decorators) {
            if (ts.isCallExpression(decorator.expression)) {
              const expression = decorator.expression;
              const decoratorName = expression.expression.getText();
              
              if (decoratorName === 'Component' || decoratorName === 'Directive') {
                const selector = this.extractSelector(expression);
                if (selector) {
                  const className = node.name.getText();
                  
                  // Register this component as available to the importing component
                  if (!component.availableComponents) {
                    component.availableComponents = new Map();
                  }
                  component.availableComponents.set(selector, className);
                  
                  // Also register globally if not already present
                  if (!this.selectorToComponent.has(selector)) {
                    const libComponent: ComponentInfo = {
                      className,
                      selector,
                      filePath: moduleFile.fileName,
                      isStandalone: false,
                      imports: []
                    };
                    this.components.set(className, libComponent);
                    this.selectorToComponent.set(selector, libComponent);
                  }
                }
              }
            }
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(moduleFile);
  }

  private extractSelector(decoratorExpression: ts.CallExpression): string | null {
    if (decoratorExpression.arguments.length > 0) {
      const arg = decoratorExpression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        for (const property of arg.properties) {
          if (ts.isPropertyAssignment(property)) {
            const name = property.name.getText();
            if (name === 'selector' && ts.isStringLiteral(property.initializer)) {
              // Handle different selector formats
              let selector = property.initializer.text;
              // Remove attribute selector brackets if present: [myDirective] -> myDirective
              selector = selector.replace(/^\[|\]$/g, '');
              // Remove class selector dots if present: .myClass -> myClass
              selector = selector.replace(/^\./g, '');
              return selector;
            }
          }
        }
      }
    }
    return null;
  }

  private visitNode(node: ts.Node): void {
    if (ts.isClassDeclaration(node) && node.name) {
      const decorators = ts.getDecorators?.(node) || (node as any).decorators;
      
      if (decorators) {
        for (const decorator of decorators) {
          if (ts.isCallExpression(decorator.expression)) {
            const expression = decorator.expression;
            const decoratorName = expression.expression.getText();
            
            if (decoratorName === 'Component') {
              this.processComponent(node, expression);
            }
          }
        }
      }
    }

    ts.forEachChild(node, (child) => this.visitNode(child));
  }

  private processComponent(node: ts.ClassDeclaration, decoratorExpression: ts.CallExpression): void {
    const className = node.name!.getText();
    const sourceFile = node.getSourceFile();
    const filePath = sourceFile.fileName;

    let selector = '';
    let isStandalone = false;
    let imports: string[] = [];

    if (decoratorExpression.arguments.length > 0) {
      const arg = decoratorExpression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        for (const property of arg.properties) {
          if (ts.isPropertyAssignment(property)) {
            const name = property.name.getText();
            
            if (name === 'selector' && ts.isStringLiteral(property.initializer)) {
              selector = property.initializer.text;
            } else if (name === 'standalone') {
              if (property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                isStandalone = true;
              }
            } else if (name === 'imports' && ts.isArrayLiteralExpression(property.initializer)) {
              imports = property.initializer.elements
                .map(el => el.getText())
                .filter(Boolean);
            }
          }
        }
      }
    }

    if (selector) {
      const componentInfo: ComponentInfo = {
        className,
        selector,
        filePath,
        isStandalone,
        imports
      };
      
      this.components.set(className, componentInfo);
      this.selectorToComponent.set(selector, componentInfo);
      this.allKnownSelectors.add(selector);
    }
  }

  private async parseTemplates(): Promise<void> {
    for (const [className, component] of this.components) {
      // Only parse templates for project components
      if (!component.filePath.includes('node_modules')) {
        const template = await this.getComponentTemplate(component);
        if (template) {
          this.analyzeTemplate(className, template, component.filePath);
        }
      }
    }
  }

  private async getComponentTemplate(component: ComponentInfo): Promise<string | null> {
    const sourceFile = this.program.getSourceFile(component.filePath);
    if (!sourceFile) return null;

    let template: string | null = null;

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name?.getText() === component.className) {
        const decorators = ts.getDecorators?.(node) || (node as any).decorators;
        
        if (decorators) {
          for (const decorator of decorators) {
            if (ts.isCallExpression(decorator.expression)) {
              const expression = decorator.expression;
              if (expression.expression.getText() === 'Component' && expression.arguments.length > 0) {
                const arg = expression.arguments[0];
                if (ts.isObjectLiteralExpression(arg)) {
                  for (const property of arg.properties) {
                    if (ts.isPropertyAssignment(property)) {
                      const name = property.name.getText();
                      
                      if (name === 'template' && ts.isStringLiteral(property.initializer)) {
                        template = property.initializer.text;
                      } else if (name === 'templateUrl' && ts.isStringLiteral(property.initializer)) {
                        const templatePath = path.join(
                          path.dirname(component.filePath),
                          property.initializer.text
                        );
                        if (fs.existsSync(templatePath)) {
                          template = fs.readFileSync(templatePath, 'utf-8');
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return template;
  }

  private analyzeTemplate(componentClass: string, template: string, filePath: string): void {
    try {
      // Use Angular's template parser for accurate parsing
      const parseResult = parseTemplate(template, filePath, {
        preserveWhitespaces: false,
        leadingTriviaChars: [],
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        console.warn(`Template parsing errors in ${componentClass}:`, parseResult.errors.map(e => e.msg).join(', '));
      }

      // Walk the parsed template AST to find component usage
      walkTemplateNodes(parseResult.nodes, componentClass, this.templateUsages, this.allKnownSelectors);
      
    } catch (error) {
      console.warn(`Error parsing template for ${componentClass}:`, error);
    }
  }

  private aggregateResults(): ComponentStats[] {
    const statsMap = new Map<string, ComponentStats>();

    // Initialize all components (including library ones we discovered)
    for (const [className, component] of this.components) {
      statsMap.set(className, {
        componentClass: className,
        usedIn: [],
        count: 0,
        source: this.determineSource(component.filePath),
        external: component.filePath.includes('node_modules')
      });
    }

    // Also create entries for selectors we found in templates but don't have component info for
    for (const usage of this.templateUsages) {
      const selector = usage.usedSelector;
      const usedComponent = this.selectorToComponent.get(selector);
      
      if (usedComponent) {
        const stats = statsMap.get(usedComponent.className);
        if (stats) {
          stats.count++;
          if (!stats.usedIn.includes(usage.componentClass)) {
            stats.usedIn.push(usage.componentClass);
          }
        }
      } else {
        // Component not found - create a placeholder entry
        // The selector is what we found in the template
        const componentName = `${selector}`;
        const source = `library component (selector: ${selector})`;
        
        if (!statsMap.has(componentName)) {
          statsMap.set(componentName, {
            componentClass: componentName,
            usedIn: [usage.componentClass],
            count: 1,
            source: source,
            external: true
          });
        } else {
          const stats = statsMap.get(componentName)!;
          stats.count++;
          if (!stats.usedIn.includes(usage.componentClass)) {
            stats.usedIn.push(usage.componentClass);
          }
        }
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }

  private determineSource(filePath: string): string {
    // If file is in node_modules, extract library name
    if (filePath.includes('node_modules')) {
      const match = filePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
      return match ? match[1] : 'unknown-library';
    }
    
    // Otherwise, return relative path from project root
    return path.relative(this.projectPath, filePath);
  }
}

export async function analyzeComponents(options: AnalyzerOptions): Promise<ComponentStats[]> {
  const analyzer = new AngularComponentAnalyzer(options);
  return await analyzer.analyze();
}
