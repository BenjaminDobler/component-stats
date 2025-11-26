import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { ComponentStats, AnalyzerOptions } from './types';
import { parseTemplate } from '@angular/compiler';

interface ComponentInfo {
  className: string;
  selector: string;
  filePath: string;
  isStandalone: boolean;
  imports?: string[];
}

interface TemplateUsage {
  componentClass: string;
  usedSelector: string;
  filePath: string;
}

// Helper to recursively walk template nodes and find component usage
function walkTemplateNodes(
  nodes: any[],
  selectorToComponent: Map<string, ComponentInfo>,
  componentClass: string,
  templateUsages: TemplateUsage[]
): void {
  for (const node of nodes) {
    console.log(`Node type: ${node.constructor.name}, name: ${node.name}`);
    
    // Check if this is an element node with a name
    if (node.name && typeof node.name === 'string') {
      const usedComponent = selectorToComponent.get(node.name);
      if (usedComponent) {
        console.log(`  ✓ Found component usage: ${node.name} -> ${usedComponent.className}`);
        templateUsages.push({
          componentClass,
          usedSelector: node.name,
          filePath: usedComponent.filePath
        });
      } else {
        console.log(`  - Tag ${node.name} is not a known component`);
      }
    }

    // Recursively walk children
    if (node.children && Array.isArray(node.children)) {
      walkTemplateNodes(node.children, selectorToComponent, componentClass, templateUsages);
    }
  }
}



export class AngularComponentAnalyzer {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;
  private components: Map<string, ComponentInfo> = new Map();
  private selectorToComponent: Map<string, ComponentInfo> = new Map();
  private templateUsages: TemplateUsage[] = [];
  private projectPath: string;

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

    console.log(`Found ${parsedConfig.fileNames.length} files to analyze`);
    
    this.program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
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
    // Step 1: Find all component files in the project
    await this.discoverComponents();
    
    // Step 2: Discover library components from imports
    await this.discoverLibraryComponents();
    
    // Step 3: Parse templates and find component usage
    await this.parseTemplates();
    
    // Step 4: Aggregate results
    return this.aggregateResults();
  }

  private async discoverComponents(): Promise<void> {
    const sourceFiles = this.program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && sf.fileName.includes(this.projectPath));

    console.log(`Analyzing ${sourceFiles.length} source files...`);

    for (const sourceFile of sourceFiles) {
      this.visitNode(sourceFile);
    }
    
    console.log(`Discovered ${this.components.size} components`);
  }

  private async discoverLibraryComponents(): Promise<void> {
    console.log('\nDiscovering library components from imports...');
    
    // Collect all imports from components
    const allImports = new Set<string>();
    for (const component of this.components.values()) {
      if (component.imports) {
        component.imports.forEach(imp => {
          console.log(`  Import: ${imp}`);
          allImports.add(imp);
        });
      }
    }

    console.log(`Found ${allImports.size} unique imports to analyze`);

    // Try to resolve each import and find components/modules
    for (const importName of allImports) {
      await this.resolveImport(importName);
    }

    console.log(`Total components registered: ${this.components.size}`);
    console.log(`Total selectors mapped: ${this.selectorToComponent.size}`);
  }

  private async resolveImport(importName: string): Promise<void> {
    // Common patterns for library components
    // Examples: ButtonModule, MatButton, CommonModule, etc.
    
    // For now, we'll analyze all TypeScript declaration files from node_modules
    // that match the import name to find component selectors
    
    // This is a simplified approach - we look for the import in the program's source files
    const allSourceFiles = this.program.getSourceFiles();
    
    for (const sourceFile of allSourceFiles) {
      // Check if this file might be related to the import
      const fileName = sourceFile.fileName;
      
      // Only check node_modules files
      if (!fileName.includes('node_modules')) continue;
      
      // Check if the file path contains the import name
      const simplifiedImportName = importName.replace(/Module$/, '').replace(/Component$/, '');
      if (!fileName.includes(simplifiedImportName.toLowerCase())) continue;
      
      // Analyze this source file for components
      this.visitNodeForLibraryComponents(sourceFile, fileName);
    }
  }

  private visitNodeForLibraryComponents(node: ts.Node, sourceFilePath: string): void {
    if (ts.isClassDeclaration(node) && node.name) {
      const decorators = ts.getDecorators?.(node) || (node as any).decorators;
      
      if (decorators) {
        for (const decorator of decorators) {
          if (ts.isCallExpression(decorator.expression)) {
            const expression = decorator.expression;
            const decoratorName = expression.expression.getText();
            
            if (decoratorName === 'Component') {
              // Extract selector for library component
              const className = node.name.getText();
              let selector = '';
              
              if (expression.arguments.length > 0) {
                const arg = expression.arguments[0];
                if (ts.isObjectLiteralExpression(arg)) {
                  for (const property of arg.properties) {
                    if (ts.isPropertyAssignment(property)) {
                      const name = property.name.getText();
                      if (name === 'selector' && ts.isStringLiteral(property.initializer)) {
                        selector = property.initializer.text;
                      }
                    }
                  }
                }
              }
              
              if (selector && !this.selectorToComponent.has(selector)) {
                const componentInfo: ComponentInfo = {
                  className,
                  selector,
                  filePath: sourceFilePath,
                  isStandalone: false,
                  imports: []
                };
                
                console.log(`  Found library component: ${className} (selector: ${selector}) from ${this.getLibraryName(sourceFilePath)}`);
                
                this.components.set(className, componentInfo);
                this.selectorToComponent.set(selector, componentInfo);
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, (child) => this.visitNodeForLibraryComponents(child, sourceFilePath));
  }

  private getLibraryName(filePath: string): string {
    const match = filePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
    return match ? match[1] : 'unknown-library';
  }

  private visitNode(node: ts.Node): void {
    if (ts.isClassDeclaration(node) && node.name) {
      // Handle both old and new decorator APIs
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
      
      console.log(`Found component: ${className} (selector: ${selector})`);
      
      this.components.set(className, componentInfo);
      this.selectorToComponent.set(selector, componentInfo);
    }
  }

  private async parseTemplates(): Promise<void> {
    console.log(`\nParsing templates for ${this.components.size} components...`);
    for (const [className, component] of this.components) {
      const template = await this.getComponentTemplate(component);
      if (template) {
        console.log(`\nAnalyzing template for ${className}:`);
        console.log(`Template length: ${template.length} chars`);
        console.log(`First 100 chars: ${template.substring(0, 100)}...`);
        this.analyzeTemplate(className, template, component.filePath);
      } else {
        console.log(`No template found for ${className}`);
      }
    }
  }

  private async getComponentTemplate(component: ComponentInfo): Promise<string | null> {
    const sourceFile = this.program.getSourceFile(component.filePath);
    if (!sourceFile) return null;

    let template: string | null = null;

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name?.getText() === component.className) {
        // Handle both old and new decorator APIs
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
      walkTemplateNodes(parseResult.nodes, this.selectorToComponent, componentClass, this.templateUsages);
      
    } catch (error) {
      console.warn(`Error parsing template for ${componentClass}:`, error);
      // Fallback to regex-based parsing
      this.analyzeTemplateWithRegex(componentClass, template, filePath);
    }
  }

  private analyzeTemplateWithRegex(componentClass: string, template: string, filePath: string): void {
    // Fallback: Match HTML tags that could be Angular components
    const tagRegex = /<([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/gi;
    let match;

    while ((match = tagRegex.exec(template)) !== null) {
      const tagName = match[1];
      
      // Check if this tag corresponds to a known component selector
      const usedComponent = this.selectorToComponent.get(tagName);
      if (usedComponent) {
        this.templateUsages.push({
          componentClass,
          usedSelector: tagName,
          filePath
        });
      }
    }
  }

  private aggregateResults(): ComponentStats[] {
    const statsMap = new Map<string, ComponentStats>();

    // Initialize all components
    for (const [className, component] of this.components) {
      statsMap.set(className, {
        componentClass: className,
        usedIn: [],
        count: 0,
        source: this.determineSource(component.filePath),
        external: component.filePath.includes('node_modules')
      });
    }

    // Count usages
    for (const usage of this.templateUsages) {
      const usedComponent = this.selectorToComponent.get(usage.usedSelector);
      if (usedComponent) {
        const stats = statsMap.get(usedComponent.className);
        if (stats) {
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
