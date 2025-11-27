import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { ComponentStats, AnalyzerOptions, TranslatePipeUsage } from './types';
import { parseTemplate } from '@angular/compiler';
import { NgtscProgram } from '@angular/compiler-cli';
import { readConfiguration } from '@angular/compiler-cli';
import { 
  readTranslationFiles, 
  validateTranslationCoverage, 
  TranslationValidationResult 
} from './translation-validator';

interface ComponentInfo {
  className: string;
  selector: string;
  filePath: string;
  isStandalone: boolean;
  templateContent?: string;
}

interface TemplateUsage {
  componentClass: string;
  usedComponent: ComponentInfo | null;
  usedSelector: string;
}

export class AngularComponentAnalyzer {
  private ngProgram: NgtscProgram;
  private components: Map<string, ComponentInfo> = new Map();
  private selectorToComponent: Map<string, ComponentInfo> = new Map();
  private templateUsages: TemplateUsage[] = [];
  private translatePipeUsages: TranslatePipeUsage[] = [];
  private projectPath: string;

  constructor(private options: AnalyzerOptions) {
    this.projectPath = path.resolve(options.projectPath);
    const tsconfigPath = options.tsconfigPath || this.findTsConfig();
    
    console.log(`Using tsconfig: ${tsconfigPath}`);
    
    // Use Angular's readConfiguration to properly parse tsconfig
    const config = readConfiguration(tsconfigPath);
    
    // Create Angular compiler program which has semantic analysis
    this.ngProgram = new NgtscProgram(
      config.rootNames,
      config.options,
      ts.createCompilerHost(config.options),
      undefined
    );
    
    console.log('Created Angular compiler program with full semantic analysis');
  }

  private findTsConfig(): string {
    const candidates = [
      'tsconfig.app.json',
      'tsconfig.json',
      'tsconfig.lib.json',
    ];

    for (const candidate of candidates) {
      const tsconfigPath = path.join(this.projectPath, candidate);
      if (fs.existsSync(tsconfigPath)) {
        const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
        const parsed = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(tsconfigPath)
        );
        
        if (parsed.fileNames.length > 0) {
          return tsconfigPath;
        }
      }
    }
    
    throw new Error('No valid tsconfig.json found in project path');
  }

  async analyze(): Promise<ComponentStats[]> {
    // Step 1: Let Angular compiler analyze the program
    console.log('Running Angular compilation analysis...');
    const diagnostics = this.ngProgram.compiler.getDiagnostics();
    
    // Step 2: Get all analyzed components from Angular compiler
    await this.discoverComponentsFromCompiler();
    
    // Step 3: Parse templates to find usage
    await this.parseTemplates();
    
    // Step 4: Aggregate results
    return this.aggregateResults();
  }

  private async discoverComponentsFromCompiler(): Promise<void> {
    console.log('Extracting component metadata from Angular compiler...');
    
    const program = this.ngProgram.getTsProgram();
    const sourceFiles = program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && sf.fileName.includes(this.projectPath));

    // Get the component metadata from Angular's compiler
    // The compiler has already analyzed all components and their scopes
    for (const sourceFile of sourceFiles) {
      this.visitSourceFile(sourceFile);
    }
    
    console.log(`Found ${this.components.size} components`);
  }

  private visitSourceFile(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const decorators = ts.getDecorators?.(node) || (node as any).decorators;
        
        if (decorators) {
          for (const decorator of decorators) {
            if (ts.isCallExpression(decorator.expression)) {
              const expression = decorator.expression;
              const decoratorName = expression.expression.getText();
              
              if (decoratorName === 'Component') {
                this.processComponent(node, expression, sourceFile);
              }
            }
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
  }

  private processComponent(
    node: ts.ClassDeclaration,
    decoratorExpression: ts.CallExpression,
    sourceFile: ts.SourceFile
  ): void {
    const className = node.name!.getText();
    let selector = '';
    let isStandalone = false;

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
            }
          }
        }
      }
    }

    if (selector) {
      const componentInfo: ComponentInfo = {
        className,
        selector,
        filePath: sourceFile.fileName,
        isStandalone
      };
      
      this.components.set(className, componentInfo);
      this.selectorToComponent.set(selector, componentInfo);
    }
  }

  private async parseTemplates(): Promise<void> {
    console.log('Analyzing templates...');
    
    for (const [className, component] of this.components) {
      // Only parse templates for project components (not node_modules)
      if (!component.filePath.includes('node_modules')) {
        const template = await this.getComponentTemplate(component);
        if (template) {
          this.analyzeTemplate(component, template);
        }
      }
    }
  }

  private async getComponentTemplate(component: ComponentInfo): Promise<string | null> {
    const program = this.ngProgram.getTsProgram();
    const sourceFile = program.getSourceFile(component.filePath);
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
                      
                      if (name === 'template') {
                        if (ts.isStringLiteral(property.initializer)) {
                          template = property.initializer.text;
                        } else if (ts.isNoSubstitutionTemplateLiteral(property.initializer)) {
                          template = property.initializer.text;
                        }
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

  private analyzeTemplate(component: ComponentInfo, template: string): void {
    try {
      // Use Angular's template parser
      const parseResult = parseTemplate(template, component.filePath, {
        preserveWhitespaces: false,
        leadingTriviaChars: [],
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        console.warn(`Template errors in ${component.className}:`, parseResult.errors.map(e => e.msg).join(', '));
      }

      // Walk the AST and find element nodes
      this.walkTemplateNodes(parseResult.nodes, component);
      
    } catch (error) {
      console.warn(`Error parsing template for ${component.className}:`, error);
    }
  }

  private walkTemplateNodes(nodes: any[], component: ComponentInfo): void {
    for (const node of nodes) {
      if (node.name && typeof node.name === 'string') {
        // Found an element - check if it's a component selector
        const usedComponent = this.selectorToComponent.get(node.name);
        
        this.templateUsages.push({
          componentClass: component.className,
          usedComponent: usedComponent || null,
          usedSelector: node.name
        });
      }

      // Check for translate pipe in bound properties
      this.detectTranslatePipeInNode(node, component);

      // Recursively process children
      if (node.children && Array.isArray(node.children)) {
        this.walkTemplateNodes(node.children, component);
      }
    }
  }

  private detectTranslatePipeInNode(node: any, component: ComponentInfo): void {
    // Check if node has value.ast (BoundText - interpolation)
    if (node.value && node.value.ast) {
      this.detectTranslatePipeInExpression(node.value.ast, component);
    }

    // Check bound properties ([property]="expr | translate")
    if (node.inputs && Array.isArray(node.inputs)) {
      for (const input of node.inputs) {
        if (input.value && input.value.ast) {
          this.detectTranslatePipeInExpression(input.value.ast, component);
        }
      }
    }

    // Check attributes that might have translate pipe
    if (node.attributes && Array.isArray(node.attributes)) {
      for (const attr of node.attributes) {
        if (attr.value && typeof attr.value === 'string' && attr.value.includes('translate')) {
          // Parse string value for translate pipes
          const translateMatches = attr.value.matchAll(/['"]([^'"]+)['"]\s*\|\s*translate/g);
          for (const match of translateMatches) {
            this.translatePipeUsages.push({
              componentClass: component.className,
              translationKey: match[1],
              filePath: component.filePath
            });
          }
        }
      }
    }
  }

  private detectTranslatePipeInExpression(ast: any, component: ComponentInfo): void {
    if (!ast) return;

    // Check if this is a BindingPipe (pipe expression)
    if (ast.name === 'translate') {
      // Try to extract the translation key from the expression
      if (ast.exp) {
        // Check if exp has a direct value (LiteralPrimitive)
        if (ast.exp.value !== undefined) {
          this.translatePipeUsages.push({
            componentClass: component.className,
            translationKey: String(ast.exp.value),
            filePath: component.filePath
          });
        }
        // Check property access
        else if (ast.exp.key && ast.exp.key.value) {
          this.translatePipeUsages.push({
            componentClass: component.className,
            translationKey: String(ast.exp.key.value),
            filePath: component.filePath
          });
        }
        // Recursively check the exp itself
        else {
          this.detectTranslatePipeInExpression(ast.exp, component);
        }
      }
    }

    // Recursively check nested expressions in interpolations
    if (ast.expressions && Array.isArray(ast.expressions)) {
      for (const expr of ast.expressions) {
        this.detectTranslatePipeInExpression(expr, component);
      }
    }

    // Recursively check the exp property
    if (ast.exp && ast.name !== 'translate') {
      this.detectTranslatePipeInExpression(ast.exp, component);
    }

    // Recursively check pipe arguments
    if (ast.args && Array.isArray(ast.args)) {
      for (const arg of ast.args) {
        this.detectTranslatePipeInExpression(arg, component);
      }
    }
  }

  private aggregateResults(): ComponentStats[] {
    const statsMap = new Map<string, ComponentStats>();

    // Initialize all discovered components
    for (const [className, component] of this.components) {
      statsMap.set(className, {
        componentClass: className,
        usedIn: [],
        count: 0,
        source: this.determineSource(component.filePath),
        external: this.isExternal(component.filePath)
      });
    }

    // Process template usages
    for (const usage of this.templateUsages) {
      if (usage.usedComponent) {
        // Found a known component
        const stats = statsMap.get(usage.usedComponent.className);
        if (stats) {
          stats.count++;
          if (!stats.usedIn.includes(usage.componentClass)) {
            stats.usedIn.push(usage.componentClass);
          }
        }
      } else {
        // Unknown component (from library) - create entry using selector
        const selector = usage.usedSelector;
        
        // Skip standard HTML elements
        if (!selector.includes('-') && !this.isAngularBuiltin(selector)) {
          continue;
        }
        
        if (!statsMap.has(selector)) {
          statsMap.set(selector, {
            componentClass: selector,
            usedIn: [usage.componentClass],
            count: 1,
            source: this.guessLibrarySource(selector),
            external: true
          });
        } else {
          const stats = statsMap.get(selector)!;
          stats.count++;
          if (!stats.usedIn.includes(usage.componentClass)) {
            stats.usedIn.push(usage.componentClass);
          }
        }
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }

  private isAngularBuiltin(selector: string): boolean {
    const builtins = ['ng-container', 'ng-content', 'ng-template', 'router-outlet'];
    return builtins.includes(selector);
  }

  private isExternal(filePath: string): boolean {
    return filePath.includes('node_modules');
  }

  private guessLibrarySource(selector: string): string {
    // Try to guess library from selector prefix
    if (selector.startsWith('p-')) return 'primeng';
    if (selector.startsWith('mat-')) return '@angular/material';
    if (selector.startsWith('ngb-')) return '@ng-bootstrap/ng-bootstrap';
    if (selector.startsWith('nz-')) return 'ng-zorro-antd';
    if (selector.includes('router')) return '@angular/router';
    return `library (selector: ${selector})`;
  }

  private determineSource(filePath: string): string {
    if (filePath.includes('node_modules')) {
      const match = filePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
      return match ? match[1] : 'unknown-library';
    }
    
    return path.relative(this.projectPath, filePath);
  }

  public getTranslatePipeUsages(): TranslatePipeUsage[] {
    return this.translatePipeUsages;
  }
}

export async function analyzeComponents(options: AnalyzerOptions): Promise<ComponentStats[]> {
  const analyzer = new AngularComponentAnalyzer(options);
  return await analyzer.analyze();
}

export async function analyzeTranslatePipes(options: AnalyzerOptions): Promise<TranslatePipeUsage[]> {
  const analyzer = new AngularComponentAnalyzer(options);
  await analyzer.analyze();
  return analyzer.getTranslatePipeUsages();
}

export interface ValidateTranslationsOptions extends AnalyzerOptions {
  translationsPath: string;
}

export async function validateTranslations(
  options: ValidateTranslationsOptions
): Promise<TranslationValidationResult> {
  // Get all translation keys used in the project
  const usages = await analyzeTranslatePipes(options);
  const usedKeys = Array.from(new Set(usages.map(u => u.translationKey)));
  
  // Read translation files
  const translationFiles = readTranslationFiles(options.translationsPath);
  
  // Validate coverage
  return validateTranslationCoverage(usedKeys, translationFiles);
}
