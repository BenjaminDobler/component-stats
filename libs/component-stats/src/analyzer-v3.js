"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularComponentAnalyzer = void 0;
exports.analyzeComponents = analyzeComponents;
exports.analyzeTranslatePipes = analyzeTranslatePipes;
const ts = __importStar(require("typescript"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const compiler_1 = require("@angular/compiler");
const compiler_cli_1 = require("@angular/compiler-cli");
const compiler_cli_2 = require("@angular/compiler-cli");
class AngularComponentAnalyzer {
    options;
    ngProgram;
    components = new Map();
    selectorToComponent = new Map();
    templateUsages = [];
    translatePipeUsages = [];
    projectPath;
    constructor(options) {
        this.options = options;
        this.projectPath = path.resolve(options.projectPath);
        const tsconfigPath = options.tsconfigPath || this.findTsConfig();
        console.log(`Using tsconfig: ${tsconfigPath}`);
        // Use Angular's readConfiguration to properly parse tsconfig
        const config = (0, compiler_cli_2.readConfiguration)(tsconfigPath);
        // Create Angular compiler program which has semantic analysis
        this.ngProgram = new compiler_cli_1.NgtscProgram(config.rootNames, config.options, ts.createCompilerHost(config.options), undefined);
        console.log('Created Angular compiler program with full semantic analysis');
    }
    findTsConfig() {
        const candidates = [
            'tsconfig.app.json',
            'tsconfig.json',
            'tsconfig.lib.json',
        ];
        for (const candidate of candidates) {
            const tsconfigPath = path.join(this.projectPath, candidate);
            if (fs.existsSync(tsconfigPath)) {
                const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
                const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath));
                if (parsed.fileNames.length > 0) {
                    return tsconfigPath;
                }
            }
        }
        throw new Error('No valid tsconfig.json found in project path');
    }
    async analyze() {
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
    async discoverComponentsFromCompiler() {
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
    visitSourceFile(sourceFile) {
        const visit = (node) => {
            if (ts.isClassDeclaration(node) && node.name) {
                const decorators = ts.getDecorators?.(node) || node.decorators;
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
    processComponent(node, decoratorExpression, sourceFile) {
        const className = node.name.getText();
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
                        }
                        else if (name === 'standalone') {
                            if (property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                                isStandalone = true;
                            }
                        }
                    }
                }
            }
        }
        if (selector) {
            const componentInfo = {
                className,
                selector,
                filePath: sourceFile.fileName,
                isStandalone
            };
            this.components.set(className, componentInfo);
            this.selectorToComponent.set(selector, componentInfo);
        }
    }
    async parseTemplates() {
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
    async getComponentTemplate(component) {
        const program = this.ngProgram.getTsProgram();
        const sourceFile = program.getSourceFile(component.filePath);
        if (!sourceFile)
            return null;
        let template = null;
        const visit = (node) => {
            if (ts.isClassDeclaration(node) && node.name?.getText() === component.className) {
                const decorators = ts.getDecorators?.(node) || node.decorators;
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
                                                }
                                                else if (ts.isNoSubstitutionTemplateLiteral(property.initializer)) {
                                                    template = property.initializer.text;
                                                }
                                            }
                                            else if (name === 'templateUrl' && ts.isStringLiteral(property.initializer)) {
                                                const templatePath = path.join(path.dirname(component.filePath), property.initializer.text);
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
    analyzeTemplate(component, template) {
        try {
            // Use Angular's template parser
            const parseResult = (0, compiler_1.parseTemplate)(template, component.filePath, {
                preserveWhitespaces: false,
                leadingTriviaChars: [],
            });
            if (parseResult.errors && parseResult.errors.length > 0) {
                console.warn(`Template errors in ${component.className}:`, parseResult.errors.map(e => e.msg).join(', '));
            }
            // Walk the AST and find element nodes
            this.walkTemplateNodes(parseResult.nodes, component);
        }
        catch (error) {
            console.warn(`Error parsing template for ${component.className}:`, error);
        }
    }
    walkTemplateNodes(nodes, component) {
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
    detectTranslatePipeInNode(node, component) {
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
    detectTranslatePipeInExpression(ast, component) {
        if (!ast)
            return;
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
    aggregateResults() {
        const statsMap = new Map();
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
            }
            else {
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
                }
                else {
                    const stats = statsMap.get(selector);
                    stats.count++;
                    if (!stats.usedIn.includes(usage.componentClass)) {
                        stats.usedIn.push(usage.componentClass);
                    }
                }
            }
        }
        return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
    }
    isAngularBuiltin(selector) {
        const builtins = ['ng-container', 'ng-content', 'ng-template', 'router-outlet'];
        return builtins.includes(selector);
    }
    isExternal(filePath) {
        return filePath.includes('node_modules');
    }
    guessLibrarySource(selector) {
        // Try to guess library from selector prefix
        if (selector.startsWith('p-'))
            return 'primeng';
        if (selector.startsWith('mat-'))
            return '@angular/material';
        if (selector.startsWith('ngb-'))
            return '@ng-bootstrap/ng-bootstrap';
        if (selector.startsWith('nz-'))
            return 'ng-zorro-antd';
        if (selector.includes('router'))
            return '@angular/router';
        return `library (selector: ${selector})`;
    }
    determineSource(filePath) {
        if (filePath.includes('node_modules')) {
            const match = filePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            return match ? match[1] : 'unknown-library';
        }
        return path.relative(this.projectPath, filePath);
    }
    getTranslatePipeUsages() {
        return this.translatePipeUsages;
    }
}
exports.AngularComponentAnalyzer = AngularComponentAnalyzer;
async function analyzeComponents(options) {
    const analyzer = new AngularComponentAnalyzer(options);
    return await analyzer.analyze();
}
async function analyzeTranslatePipes(options) {
    const analyzer = new AngularComponentAnalyzer(options);
    await analyzer.analyze();
    return analyzer.getTranslatePipeUsages();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl6ZXItdjMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhbmFseXplci12My50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxY0EsOENBR0M7QUFFRCxzREFJQztBQTljRCwrQ0FBaUM7QUFDakMsMkNBQTZCO0FBQzdCLHVDQUF5QjtBQUV6QixnREFBa0Q7QUFDbEQsd0RBQXFEO0FBQ3JELHdEQUEwRDtBQWdCMUQsTUFBYSx3QkFBd0I7SUFRZjtJQVBaLFNBQVMsQ0FBZTtJQUN4QixVQUFVLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7SUFDbkQsbUJBQW1CLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7SUFDNUQsY0FBYyxHQUFvQixFQUFFLENBQUM7SUFDckMsbUJBQW1CLEdBQXlCLEVBQUUsQ0FBQztJQUMvQyxXQUFXLENBQVM7SUFFNUIsWUFBb0IsT0FBd0I7UUFBeEIsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7UUFDMUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNyRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVqRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBRS9DLDZEQUE2RDtRQUM3RCxNQUFNLE1BQU0sR0FBRyxJQUFBLGdDQUFpQixFQUFDLFlBQVksQ0FBQyxDQUFDO1FBRS9DLDhEQUE4RDtRQUM5RCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksMkJBQVksQ0FDL0IsTUFBTSxDQUFDLFNBQVMsRUFDaEIsTUFBTSxDQUFDLE9BQU8sRUFDZCxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUNyQyxTQUFTLENBQ1YsQ0FBQztRQUVGLE9BQU8s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LEdBQUcsQ0FBQztJQUMzQyxDQUFDO0lBRU8sZUFBZSxDQUFDLFFBQWdCO1FBQ3RDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztZQUNwRSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztRQUM5QyxDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVNLHNCQUFzQjtRQUMzQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztJQUNsQyxDQUFDO0NBQ0Y7QUE3YUQsNERBNmFDO0FBRU0sS0FBSyxVQUFVLGlCQUFpQixDQUFDLE9BQXdCO0lBQzlELE1BQU0sUUFBUSxHQUFHLElBQUksd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsT0FBTyxNQUFNLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNsQyxDQUFDO0FBRU0sS0FBSyxVQUFVLHFCQUFxQixDQUFDLE9BQXdCO0lBQ2xFLE1BQU0sUUFBUSxHQUFHLElBQUksd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDekIsT0FBTyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgQ29tcG9uZW50U3RhdHMsIEFuYWx5emVyT3B0aW9ucywgVHJhbnNsYXRlUGlwZVVzYWdlIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBwYXJzZVRlbXBsYXRlIH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHsgTmd0c2NQcm9ncmFtIH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcbmltcG9ydCB7IHJlYWRDb25maWd1cmF0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXItY2xpJztcblxuaW50ZXJmYWNlIENvbXBvbmVudEluZm8ge1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgaXNTdGFuZGFsb25lOiBib29sZWFuO1xuICB0ZW1wbGF0ZUNvbnRlbnQ/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUZW1wbGF0ZVVzYWdlIHtcbiAgY29tcG9uZW50Q2xhc3M6IHN0cmluZztcbiAgdXNlZENvbXBvbmVudDogQ29tcG9uZW50SW5mbyB8IG51bGw7XG4gIHVzZWRTZWxlY3Rvcjogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQW5ndWxhckNvbXBvbmVudEFuYWx5emVyIHtcbiAgcHJpdmF0ZSBuZ1Byb2dyYW06IE5ndHNjUHJvZ3JhbTtcbiAgcHJpdmF0ZSBjb21wb25lbnRzOiBNYXA8c3RyaW5nLCBDb21wb25lbnRJbmZvPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzZWxlY3RvclRvQ29tcG9uZW50OiBNYXA8c3RyaW5nLCBDb21wb25lbnRJbmZvPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSB0ZW1wbGF0ZVVzYWdlczogVGVtcGxhdGVVc2FnZVtdID0gW107XG4gIHByaXZhdGUgdHJhbnNsYXRlUGlwZVVzYWdlczogVHJhbnNsYXRlUGlwZVVzYWdlW10gPSBbXTtcbiAgcHJpdmF0ZSBwcm9qZWN0UGF0aDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgb3B0aW9uczogQW5hbHl6ZXJPcHRpb25zKSB7XG4gICAgdGhpcy5wcm9qZWN0UGF0aCA9IHBhdGgucmVzb2x2ZShvcHRpb25zLnByb2plY3RQYXRoKTtcbiAgICBjb25zdCB0c2NvbmZpZ1BhdGggPSBvcHRpb25zLnRzY29uZmlnUGF0aCB8fCB0aGlzLmZpbmRUc0NvbmZpZygpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGBVc2luZyB0c2NvbmZpZzogJHt0c2NvbmZpZ1BhdGh9YCk7XG4gICAgXG4gICAgLy8gVXNlIEFuZ3VsYXIncyByZWFkQ29uZmlndXJhdGlvbiB0byBwcm9wZXJseSBwYXJzZSB0c2NvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZyA9IHJlYWRDb25maWd1cmF0aW9uKHRzY29uZmlnUGF0aCk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIEFuZ3VsYXIgY29tcGlsZXIgcHJvZ3JhbSB3aGljaCBoYXMgc2VtYW50aWMgYW5hbHlzaXNcbiAgICB0aGlzLm5nUHJvZ3JhbSA9IG5ldyBOZ3RzY1Byb2dyYW0oXG4gICAgICBjb25maWcucm9vdE5hbWVzLFxuICAgICAgY29uZmlnLm9wdGlvbnMsXG4gICAgICB0cy5jcmVhdGVDb21waWxlckhvc3QoY29uZmlnLm9wdGlvbnMpLFxuICAgICAgdW5kZWZpbmVkXG4gICAgKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnQ3JlYXRlZCBBbmd1bGFyIGNvbXBpbGVyIHByb2dyYW0gd2l0aCBmdWxsIHNlbWFudGljIGFuYWx5c2lzJyk7XG4gIH1cblxuICBwcml2YXRlIGZpbmRUc0NvbmZpZygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgICAndHNjb25maWcuYXBwLmpzb24nLFxuICAgICAgJ3RzY29uZmlnLmpzb24nLFxuICAgICAgJ3RzY29uZmlnLmxpYi5qc29uJyxcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgICAgY29uc3QgdHNjb25maWdQYXRoID0gcGF0aC5qb2luKHRoaXMucHJvamVjdFBhdGgsIGNhbmRpZGF0ZSk7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyh0c2NvbmZpZ1BhdGgpKSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ0ZpbGUgPSB0cy5yZWFkQ29uZmlnRmlsZSh0c2NvbmZpZ1BhdGgsIHRzLnN5cy5yZWFkRmlsZSk7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IHRzLnBhcnNlSnNvbkNvbmZpZ0ZpbGVDb250ZW50KFxuICAgICAgICAgIGNvbmZpZ0ZpbGUuY29uZmlnLFxuICAgICAgICAgIHRzLnN5cyxcbiAgICAgICAgICBwYXRoLmRpcm5hbWUodHNjb25maWdQYXRoKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgaWYgKHBhcnNlZC5maWxlTmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiB0c2NvbmZpZ1BhdGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyB2YWxpZCB0c2NvbmZpZy5qc29uIGZvdW5kIGluIHByb2plY3QgcGF0aCcpO1xuICB9XG5cbiAgYXN5bmMgYW5hbHl6ZSgpOiBQcm9taXNlPENvbXBvbmVudFN0YXRzW10+IHtcbiAgICAvLyBTdGVwIDE6IExldCBBbmd1bGFyIGNvbXBpbGVyIGFuYWx5emUgdGhlIHByb2dyYW1cbiAgICBjb25zb2xlLmxvZygnUnVubmluZyBBbmd1bGFyIGNvbXBpbGF0aW9uIGFuYWx5c2lzLi4uJyk7XG4gICAgY29uc3QgZGlhZ25vc3RpY3MgPSB0aGlzLm5nUHJvZ3JhbS5jb21waWxlci5nZXREaWFnbm9zdGljcygpO1xuICAgIFxuICAgIC8vIFN0ZXAgMjogR2V0IGFsbCBhbmFseXplZCBjb21wb25lbnRzIGZyb20gQW5ndWxhciBjb21waWxlclxuICAgIGF3YWl0IHRoaXMuZGlzY292ZXJDb21wb25lbnRzRnJvbUNvbXBpbGVyKCk7XG4gICAgXG4gICAgLy8gU3RlcCAzOiBQYXJzZSB0ZW1wbGF0ZXMgdG8gZmluZCB1c2FnZVxuICAgIGF3YWl0IHRoaXMucGFyc2VUZW1wbGF0ZXMoKTtcbiAgICBcbiAgICAvLyBTdGVwIDQ6IEFnZ3JlZ2F0ZSByZXN1bHRzXG4gICAgcmV0dXJuIHRoaXMuYWdncmVnYXRlUmVzdWx0cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkaXNjb3ZlckNvbXBvbmVudHNGcm9tQ29tcGlsZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ0V4dHJhY3RpbmcgY29tcG9uZW50IG1ldGFkYXRhIGZyb20gQW5ndWxhciBjb21waWxlci4uLicpO1xuICAgIFxuICAgIGNvbnN0IHByb2dyYW0gPSB0aGlzLm5nUHJvZ3JhbS5nZXRUc1Byb2dyYW0oKTtcbiAgICBjb25zdCBzb3VyY2VGaWxlcyA9IHByb2dyYW0uZ2V0U291cmNlRmlsZXMoKVxuICAgICAgLmZpbHRlcihzZiA9PiAhc2YuaXNEZWNsYXJhdGlvbkZpbGUgJiYgc2YuZmlsZU5hbWUuaW5jbHVkZXModGhpcy5wcm9qZWN0UGF0aCkpO1xuXG4gICAgLy8gR2V0IHRoZSBjb21wb25lbnQgbWV0YWRhdGEgZnJvbSBBbmd1bGFyJ3MgY29tcGlsZXJcbiAgICAvLyBUaGUgY29tcGlsZXIgaGFzIGFscmVhZHkgYW5hbHl6ZWQgYWxsIGNvbXBvbmVudHMgYW5kIHRoZWlyIHNjb3Blc1xuICAgIGZvciAoY29uc3Qgc291cmNlRmlsZSBvZiBzb3VyY2VGaWxlcykge1xuICAgICAgdGhpcy52aXNpdFNvdXJjZUZpbGUoc291cmNlRmlsZSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke3RoaXMuY29tcG9uZW50cy5zaXplfSBjb21wb25lbnRzYCk7XG4gIH1cblxuICBwcml2YXRlIHZpc2l0U291cmNlRmlsZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdm9pZCB7XG4gICAgY29uc3QgdmlzaXQgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLm5hbWUpIHtcbiAgICAgICAgY29uc3QgZGVjb3JhdG9ycyA9IHRzLmdldERlY29yYXRvcnM/Lihub2RlKSB8fCAobm9kZSBhcyBhbnkpLmRlY29yYXRvcnM7XG4gICAgICAgIFxuICAgICAgICBpZiAoZGVjb3JhdG9ycykge1xuICAgICAgICAgIGZvciAoY29uc3QgZGVjb3JhdG9yIG9mIGRlY29yYXRvcnMpIHtcbiAgICAgICAgICAgIGlmICh0cy5pc0NhbGxFeHByZXNzaW9uKGRlY29yYXRvci5leHByZXNzaW9uKSkge1xuICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9uID0gZGVjb3JhdG9yLmV4cHJlc3Npb247XG4gICAgICAgICAgICAgIGNvbnN0IGRlY29yYXRvck5hbWUgPSBleHByZXNzaW9uLmV4cHJlc3Npb24uZ2V0VGV4dCgpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgaWYgKGRlY29yYXRvck5hbWUgPT09ICdDb21wb25lbnQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQ29tcG9uZW50KG5vZGUsIGV4cHJlc3Npb24sIHNvdXJjZUZpbGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCB2aXNpdCk7XG4gICAgfTtcbiAgICBcbiAgICB2aXNpdChzb3VyY2VGaWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgcHJvY2Vzc0NvbXBvbmVudChcbiAgICBub2RlOiB0cy5DbGFzc0RlY2xhcmF0aW9uLFxuICAgIGRlY29yYXRvckV4cHJlc3Npb246IHRzLkNhbGxFeHByZXNzaW9uLFxuICAgIHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGVcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgY2xhc3NOYW1lID0gbm9kZS5uYW1lIS5nZXRUZXh0KCk7XG4gICAgbGV0IHNlbGVjdG9yID0gJyc7XG4gICAgbGV0IGlzU3RhbmRhbG9uZSA9IGZhbHNlO1xuXG4gICAgaWYgKGRlY29yYXRvckV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGFyZyA9IGRlY29yYXRvckV4cHJlc3Npb24uYXJndW1lbnRzWzBdO1xuICAgICAgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oYXJnKSkge1xuICAgICAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIGFyZy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgaWYgKHRzLmlzUHJvcGVydHlBc3NpZ25tZW50KHByb3BlcnR5KSkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHByb3BlcnR5Lm5hbWUuZ2V0VGV4dCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ3NlbGVjdG9yJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWwocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgICAgICAgIHNlbGVjdG9yID0gcHJvcGVydHkuaW5pdGlhbGl6ZXIudGV4dDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gJ3N0YW5kYWxvbmUnKSB7XG4gICAgICAgICAgICAgIGlmIChwcm9wZXJ0eS5pbml0aWFsaXplci5raW5kID09PSB0cy5TeW50YXhLaW5kLlRydWVLZXl3b3JkKSB7XG4gICAgICAgICAgICAgICAgaXNTdGFuZGFsb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzZWxlY3Rvcikge1xuICAgICAgY29uc3QgY29tcG9uZW50SW5mbzogQ29tcG9uZW50SW5mbyA9IHtcbiAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICBzZWxlY3RvcixcbiAgICAgICAgZmlsZVBhdGg6IHNvdXJjZUZpbGUuZmlsZU5hbWUsXG4gICAgICAgIGlzU3RhbmRhbG9uZVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgdGhpcy5jb21wb25lbnRzLnNldChjbGFzc05hbWUsIGNvbXBvbmVudEluZm8pO1xuICAgICAgdGhpcy5zZWxlY3RvclRvQ29tcG9uZW50LnNldChzZWxlY3RvciwgY29tcG9uZW50SW5mbyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZVRlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zb2xlLmxvZygnQW5hbHl6aW5nIHRlbXBsYXRlcy4uLicpO1xuICAgIFxuICAgIGZvciAoY29uc3QgW2NsYXNzTmFtZSwgY29tcG9uZW50XSBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgIC8vIE9ubHkgcGFyc2UgdGVtcGxhdGVzIGZvciBwcm9qZWN0IGNvbXBvbmVudHMgKG5vdCBub2RlX21vZHVsZXMpXG4gICAgICBpZiAoIWNvbXBvbmVudC5maWxlUGF0aC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBhd2FpdCB0aGlzLmdldENvbXBvbmVudFRlbXBsYXRlKGNvbXBvbmVudCk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgICAgIHRoaXMuYW5hbHl6ZVRlbXBsYXRlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRDb21wb25lbnRUZW1wbGF0ZShjb21wb25lbnQ6IENvbXBvbmVudEluZm8pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5uZ1Byb2dyYW0uZ2V0VHNQcm9ncmFtKCk7XG4gICAgY29uc3Qgc291cmNlRmlsZSA9IHByb2dyYW0uZ2V0U291cmNlRmlsZShjb21wb25lbnQuZmlsZVBhdGgpO1xuICAgIGlmICghc291cmNlRmlsZSkgcmV0dXJuIG51bGw7XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3QgdmlzaXQgPSAobm9kZTogdHMuTm9kZSkgPT4ge1xuICAgICAgaWYgKHRzLmlzQ2xhc3NEZWNsYXJhdGlvbihub2RlKSAmJiBub2RlLm5hbWU/LmdldFRleHQoKSA9PT0gY29tcG9uZW50LmNsYXNzTmFtZSkge1xuICAgICAgICBjb25zdCBkZWNvcmF0b3JzID0gdHMuZ2V0RGVjb3JhdG9ycz8uKG5vZGUpIHx8IChub2RlIGFzIGFueSkuZGVjb3JhdG9ycztcbiAgICAgICAgXG4gICAgICAgIGlmIChkZWNvcmF0b3JzKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBkZWNvcmF0b3Igb2YgZGVjb3JhdG9ycykge1xuICAgICAgICAgICAgaWYgKHRzLmlzQ2FsbEV4cHJlc3Npb24oZGVjb3JhdG9yLmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBkZWNvcmF0b3IuZXhwcmVzc2lvbjtcbiAgICAgICAgICAgICAgaWYgKGV4cHJlc3Npb24uZXhwcmVzc2lvbi5nZXRUZXh0KCkgPT09ICdDb21wb25lbnQnICYmIGV4cHJlc3Npb24uYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcmcgPSBleHByZXNzaW9uLmFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgICAgICBpZiAodHMuaXNPYmplY3RMaXRlcmFsRXhwcmVzc2lvbihhcmcpKSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BlcnR5IG9mIGFyZy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0cy5pc1Byb3BlcnR5QXNzaWdubWVudChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gcHJvcGVydHkubmFtZS5nZXRUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWUgPT09ICd0ZW1wbGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWwocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlID0gcHJvcGVydHkuaW5pdGlhbGl6ZXIudGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHMuaXNOb1N1YnN0aXR1dGlvblRlbXBsYXRlTGl0ZXJhbChwcm9wZXJ0eS5pbml0aWFsaXplcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUgPSBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gJ3RlbXBsYXRlVXJsJyAmJiB0cy5pc1N0cmluZ0xpdGVyYWwocHJvcGVydHkuaW5pdGlhbGl6ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZShjb21wb25lbnQuZmlsZVBhdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eS5pbml0aWFsaXplci50ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmModGVtcGxhdGVQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZSA9IGZzLnJlYWRGaWxlU3luYyh0ZW1wbGF0ZVBhdGgsICd1dGYtOCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIHZpc2l0KTtcbiAgICB9O1xuXG4gICAgdmlzaXQoc291cmNlRmlsZSk7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG5cbiAgcHJpdmF0ZSBhbmFseXplVGVtcGxhdGUoY29tcG9uZW50OiBDb21wb25lbnRJbmZvLCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFVzZSBBbmd1bGFyJ3MgdGVtcGxhdGUgcGFyc2VyXG4gICAgICBjb25zdCBwYXJzZVJlc3VsdCA9IHBhcnNlVGVtcGxhdGUodGVtcGxhdGUsIGNvbXBvbmVudC5maWxlUGF0aCwge1xuICAgICAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBmYWxzZSxcbiAgICAgICAgbGVhZGluZ1RyaXZpYUNoYXJzOiBbXSxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAocGFyc2VSZXN1bHQuZXJyb3JzICYmIHBhcnNlUmVzdWx0LmVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgVGVtcGxhdGUgZXJyb3JzIGluICR7Y29tcG9uZW50LmNsYXNzTmFtZX06YCwgcGFyc2VSZXN1bHQuZXJyb3JzLm1hcChlID0+IGUubXNnKS5qb2luKCcsICcpKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2FsayB0aGUgQVNUIGFuZCBmaW5kIGVsZW1lbnQgbm9kZXNcbiAgICAgIHRoaXMud2Fsa1RlbXBsYXRlTm9kZXMocGFyc2VSZXN1bHQubm9kZXMsIGNvbXBvbmVudCk7XG4gICAgICBcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKGBFcnJvciBwYXJzaW5nIHRlbXBsYXRlIGZvciAke2NvbXBvbmVudC5jbGFzc05hbWV9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHdhbGtUZW1wbGF0ZU5vZGVzKG5vZGVzOiBhbnlbXSwgY29tcG9uZW50OiBDb21wb25lbnRJbmZvKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgICBpZiAobm9kZS5uYW1lICYmIHR5cGVvZiBub2RlLm5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIEZvdW5kIGFuIGVsZW1lbnQgLSBjaGVjayBpZiBpdCdzIGEgY29tcG9uZW50IHNlbGVjdG9yXG4gICAgICAgIGNvbnN0IHVzZWRDb21wb25lbnQgPSB0aGlzLnNlbGVjdG9yVG9Db21wb25lbnQuZ2V0KG5vZGUubmFtZSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnRlbXBsYXRlVXNhZ2VzLnB1c2goe1xuICAgICAgICAgIGNvbXBvbmVudENsYXNzOiBjb21wb25lbnQuY2xhc3NOYW1lLFxuICAgICAgICAgIHVzZWRDb21wb25lbnQ6IHVzZWRDb21wb25lbnQgfHwgbnVsbCxcbiAgICAgICAgICB1c2VkU2VsZWN0b3I6IG5vZGUubmFtZVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIHRyYW5zbGF0ZSBwaXBlIGluIGJvdW5kIHByb3BlcnRpZXNcbiAgICAgIHRoaXMuZGV0ZWN0VHJhbnNsYXRlUGlwZUluTm9kZShub2RlLCBjb21wb25lbnQpO1xuXG4gICAgICAvLyBSZWN1cnNpdmVseSBwcm9jZXNzIGNoaWxkcmVuXG4gICAgICBpZiAobm9kZS5jaGlsZHJlbiAmJiBBcnJheS5pc0FycmF5KG5vZGUuY2hpbGRyZW4pKSB7XG4gICAgICAgIHRoaXMud2Fsa1RlbXBsYXRlTm9kZXMobm9kZS5jaGlsZHJlbiwgY29tcG9uZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRldGVjdFRyYW5zbGF0ZVBpcGVJbk5vZGUobm9kZTogYW55LCBjb21wb25lbnQ6IENvbXBvbmVudEluZm8pOiB2b2lkIHtcbiAgICAvLyBDaGVjayBpZiBub2RlIGhhcyB2YWx1ZS5hc3QgKEJvdW5kVGV4dCAtIGludGVycG9sYXRpb24pXG4gICAgaWYgKG5vZGUudmFsdWUgJiYgbm9kZS52YWx1ZS5hc3QpIHtcbiAgICAgIHRoaXMuZGV0ZWN0VHJhbnNsYXRlUGlwZUluRXhwcmVzc2lvbihub2RlLnZhbHVlLmFzdCwgY29tcG9uZW50KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBib3VuZCBwcm9wZXJ0aWVzIChbcHJvcGVydHldPVwiZXhwciB8IHRyYW5zbGF0ZVwiKVxuICAgIGlmIChub2RlLmlucHV0cyAmJiBBcnJheS5pc0FycmF5KG5vZGUuaW5wdXRzKSkge1xuICAgICAgZm9yIChjb25zdCBpbnB1dCBvZiBub2RlLmlucHV0cykge1xuICAgICAgICBpZiAoaW5wdXQudmFsdWUgJiYgaW5wdXQudmFsdWUuYXN0KSB7XG4gICAgICAgICAgdGhpcy5kZXRlY3RUcmFuc2xhdGVQaXBlSW5FeHByZXNzaW9uKGlucHV0LnZhbHVlLmFzdCwgY29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGF0dHJpYnV0ZXMgdGhhdCBtaWdodCBoYXZlIHRyYW5zbGF0ZSBwaXBlXG4gICAgaWYgKG5vZGUuYXR0cmlidXRlcyAmJiBBcnJheS5pc0FycmF5KG5vZGUuYXR0cmlidXRlcykpIHtcbiAgICAgIGZvciAoY29uc3QgYXR0ciBvZiBub2RlLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgaWYgKGF0dHIudmFsdWUgJiYgdHlwZW9mIGF0dHIudmFsdWUgPT09ICdzdHJpbmcnICYmIGF0dHIudmFsdWUuaW5jbHVkZXMoJ3RyYW5zbGF0ZScpKSB7XG4gICAgICAgICAgLy8gUGFyc2Ugc3RyaW5nIHZhbHVlIGZvciB0cmFuc2xhdGUgcGlwZXNcbiAgICAgICAgICBjb25zdCB0cmFuc2xhdGVNYXRjaGVzID0gYXR0ci52YWx1ZS5tYXRjaEFsbCgvWydcIl0oW14nXCJdKylbJ1wiXVxccypcXHxcXHMqdHJhbnNsYXRlL2cpO1xuICAgICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgdHJhbnNsYXRlTWF0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGVQaXBlVXNhZ2VzLnB1c2goe1xuICAgICAgICAgICAgICBjb21wb25lbnRDbGFzczogY29tcG9uZW50LmNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgdHJhbnNsYXRpb25LZXk6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICBmaWxlUGF0aDogY29tcG9uZW50LmZpbGVQYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRldGVjdFRyYW5zbGF0ZVBpcGVJbkV4cHJlc3Npb24oYXN0OiBhbnksIGNvbXBvbmVudDogQ29tcG9uZW50SW5mbyk6IHZvaWQge1xuICAgIGlmICghYXN0KSByZXR1cm47XG5cbiAgICAvLyBDaGVjayBpZiB0aGlzIGlzIGEgQmluZGluZ1BpcGUgKHBpcGUgZXhwcmVzc2lvbilcbiAgICBpZiAoYXN0Lm5hbWUgPT09ICd0cmFuc2xhdGUnKSB7XG4gICAgICAvLyBUcnkgdG8gZXh0cmFjdCB0aGUgdHJhbnNsYXRpb24ga2V5IGZyb20gdGhlIGV4cHJlc3Npb25cbiAgICAgIGlmIChhc3QuZXhwKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGV4cCBoYXMgYSBkaXJlY3QgdmFsdWUgKExpdGVyYWxQcmltaXRpdmUpXG4gICAgICAgIGlmIChhc3QuZXhwLnZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLnRyYW5zbGF0ZVBpcGVVc2FnZXMucHVzaCh7XG4gICAgICAgICAgICBjb21wb25lbnRDbGFzczogY29tcG9uZW50LmNsYXNzTmFtZSxcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uS2V5OiBTdHJpbmcoYXN0LmV4cC52YWx1ZSksXG4gICAgICAgICAgICBmaWxlUGF0aDogY29tcG9uZW50LmZpbGVQYXRoXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2hlY2sgcHJvcGVydHkgYWNjZXNzXG4gICAgICAgIGVsc2UgaWYgKGFzdC5leHAua2V5ICYmIGFzdC5leHAua2V5LnZhbHVlKSB7XG4gICAgICAgICAgdGhpcy50cmFuc2xhdGVQaXBlVXNhZ2VzLnB1c2goe1xuICAgICAgICAgICAgY29tcG9uZW50Q2xhc3M6IGNvbXBvbmVudC5jbGFzc05hbWUsXG4gICAgICAgICAgICB0cmFuc2xhdGlvbktleTogU3RyaW5nKGFzdC5leHAua2V5LnZhbHVlKSxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBjb21wb25lbnQuZmlsZVBhdGhcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZWN1cnNpdmVseSBjaGVjayB0aGUgZXhwIGl0c2VsZlxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGlzLmRldGVjdFRyYW5zbGF0ZVBpcGVJbkV4cHJlc3Npb24oYXN0LmV4cCwgY29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNoZWNrIG5lc3RlZCBleHByZXNzaW9ucyBpbiBpbnRlcnBvbGF0aW9uc1xuICAgIGlmIChhc3QuZXhwcmVzc2lvbnMgJiYgQXJyYXkuaXNBcnJheShhc3QuZXhwcmVzc2lvbnMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGV4cHIgb2YgYXN0LmV4cHJlc3Npb25zKSB7XG4gICAgICAgIHRoaXMuZGV0ZWN0VHJhbnNsYXRlUGlwZUluRXhwcmVzc2lvbihleHByLCBjb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNoZWNrIHRoZSBleHAgcHJvcGVydHlcbiAgICBpZiAoYXN0LmV4cCAmJiBhc3QubmFtZSAhPT0gJ3RyYW5zbGF0ZScpIHtcbiAgICAgIHRoaXMuZGV0ZWN0VHJhbnNsYXRlUGlwZUluRXhwcmVzc2lvbihhc3QuZXhwLCBjb21wb25lbnQpO1xuICAgIH1cblxuICAgIC8vIFJlY3Vyc2l2ZWx5IGNoZWNrIHBpcGUgYXJndW1lbnRzXG4gICAgaWYgKGFzdC5hcmdzICYmIEFycmF5LmlzQXJyYXkoYXN0LmFyZ3MpKSB7XG4gICAgICBmb3IgKGNvbnN0IGFyZyBvZiBhc3QuYXJncykge1xuICAgICAgICB0aGlzLmRldGVjdFRyYW5zbGF0ZVBpcGVJbkV4cHJlc3Npb24oYXJnLCBjb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWdncmVnYXRlUmVzdWx0cygpOiBDb21wb25lbnRTdGF0c1tdIHtcbiAgICBjb25zdCBzdGF0c01hcCA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb25lbnRTdGF0cz4oKTtcblxuICAgIC8vIEluaXRpYWxpemUgYWxsIGRpc2NvdmVyZWQgY29tcG9uZW50c1xuICAgIGZvciAoY29uc3QgW2NsYXNzTmFtZSwgY29tcG9uZW50XSBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgIHN0YXRzTWFwLnNldChjbGFzc05hbWUsIHtcbiAgICAgICAgY29tcG9uZW50Q2xhc3M6IGNsYXNzTmFtZSxcbiAgICAgICAgdXNlZEluOiBbXSxcbiAgICAgICAgY291bnQ6IDAsXG4gICAgICAgIHNvdXJjZTogdGhpcy5kZXRlcm1pbmVTb3VyY2UoY29tcG9uZW50LmZpbGVQYXRoKSxcbiAgICAgICAgZXh0ZXJuYWw6IHRoaXMuaXNFeHRlcm5hbChjb21wb25lbnQuZmlsZVBhdGgpXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIHRlbXBsYXRlIHVzYWdlc1xuICAgIGZvciAoY29uc3QgdXNhZ2Ugb2YgdGhpcy50ZW1wbGF0ZVVzYWdlcykge1xuICAgICAgaWYgKHVzYWdlLnVzZWRDb21wb25lbnQpIHtcbiAgICAgICAgLy8gRm91bmQgYSBrbm93biBjb21wb25lbnRcbiAgICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0c01hcC5nZXQodXNhZ2UudXNlZENvbXBvbmVudC5jbGFzc05hbWUpO1xuICAgICAgICBpZiAoc3RhdHMpIHtcbiAgICAgICAgICBzdGF0cy5jb3VudCsrO1xuICAgICAgICAgIGlmICghc3RhdHMudXNlZEluLmluY2x1ZGVzKHVzYWdlLmNvbXBvbmVudENsYXNzKSkge1xuICAgICAgICAgICAgc3RhdHMudXNlZEluLnB1c2godXNhZ2UuY29tcG9uZW50Q2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVW5rbm93biBjb21wb25lbnQgKGZyb20gbGlicmFyeSkgLSBjcmVhdGUgZW50cnkgdXNpbmcgc2VsZWN0b3JcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB1c2FnZS51c2VkU2VsZWN0b3I7XG4gICAgICAgIFxuICAgICAgICAvLyBTa2lwIHN0YW5kYXJkIEhUTUwgZWxlbWVudHNcbiAgICAgICAgaWYgKCFzZWxlY3Rvci5pbmNsdWRlcygnLScpICYmICF0aGlzLmlzQW5ndWxhckJ1aWx0aW4oc2VsZWN0b3IpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghc3RhdHNNYXAuaGFzKHNlbGVjdG9yKSkge1xuICAgICAgICAgIHN0YXRzTWFwLnNldChzZWxlY3Rvciwge1xuICAgICAgICAgICAgY29tcG9uZW50Q2xhc3M6IHNlbGVjdG9yLFxuICAgICAgICAgICAgdXNlZEluOiBbdXNhZ2UuY29tcG9uZW50Q2xhc3NdLFxuICAgICAgICAgICAgY291bnQ6IDEsXG4gICAgICAgICAgICBzb3VyY2U6IHRoaXMuZ3Vlc3NMaWJyYXJ5U291cmNlKHNlbGVjdG9yKSxcbiAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0c01hcC5nZXQoc2VsZWN0b3IpITtcbiAgICAgICAgICBzdGF0cy5jb3VudCsrO1xuICAgICAgICAgIGlmICghc3RhdHMudXNlZEluLmluY2x1ZGVzKHVzYWdlLmNvbXBvbmVudENsYXNzKSkge1xuICAgICAgICAgICAgc3RhdHMudXNlZEluLnB1c2godXNhZ2UuY29tcG9uZW50Q2xhc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKHN0YXRzTWFwLnZhbHVlcygpKS5zb3J0KChhLCBiKSA9PiBiLmNvdW50IC0gYS5jb3VudCk7XG4gIH1cblxuICBwcml2YXRlIGlzQW5ndWxhckJ1aWx0aW4oc2VsZWN0b3I6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGJ1aWx0aW5zID0gWyduZy1jb250YWluZXInLCAnbmctY29udGVudCcsICduZy10ZW1wbGF0ZScsICdyb3V0ZXItb3V0bGV0J107XG4gICAgcmV0dXJuIGJ1aWx0aW5zLmluY2x1ZGVzKHNlbGVjdG9yKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNFeHRlcm5hbChmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZpbGVQYXRoLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKTtcbiAgfVxuXG4gIHByaXZhdGUgZ3Vlc3NMaWJyYXJ5U291cmNlKHNlbGVjdG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIFRyeSB0byBndWVzcyBsaWJyYXJ5IGZyb20gc2VsZWN0b3IgcHJlZml4XG4gICAgaWYgKHNlbGVjdG9yLnN0YXJ0c1dpdGgoJ3AtJykpIHJldHVybiAncHJpbWVuZyc7XG4gICAgaWYgKHNlbGVjdG9yLnN0YXJ0c1dpdGgoJ21hdC0nKSkgcmV0dXJuICdAYW5ndWxhci9tYXRlcmlhbCc7XG4gICAgaWYgKHNlbGVjdG9yLnN0YXJ0c1dpdGgoJ25nYi0nKSkgcmV0dXJuICdAbmctYm9vdHN0cmFwL25nLWJvb3RzdHJhcCc7XG4gICAgaWYgKHNlbGVjdG9yLnN0YXJ0c1dpdGgoJ256LScpKSByZXR1cm4gJ25nLXpvcnJvLWFudGQnO1xuICAgIGlmIChzZWxlY3Rvci5pbmNsdWRlcygncm91dGVyJykpIHJldHVybiAnQGFuZ3VsYXIvcm91dGVyJztcbiAgICByZXR1cm4gYGxpYnJhcnkgKHNlbGVjdG9yOiAke3NlbGVjdG9yfSlgO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXRlcm1pbmVTb3VyY2UoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGZpbGVQYXRoLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBmaWxlUGF0aC5tYXRjaCgvbm9kZV9tb2R1bGVzXFwvKEBbXi9dK1xcL1teL10rfFteL10rKS8pO1xuICAgICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiAndW5rbm93bi1saWJyYXJ5JztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHBhdGgucmVsYXRpdmUodGhpcy5wcm9qZWN0UGF0aCwgZmlsZVBhdGgpO1xuICB9XG5cbiAgcHVibGljIGdldFRyYW5zbGF0ZVBpcGVVc2FnZXMoKTogVHJhbnNsYXRlUGlwZVVzYWdlW10ge1xuICAgIHJldHVybiB0aGlzLnRyYW5zbGF0ZVBpcGVVc2FnZXM7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFuYWx5emVDb21wb25lbnRzKG9wdGlvbnM6IEFuYWx5emVyT3B0aW9ucyk6IFByb21pc2U8Q29tcG9uZW50U3RhdHNbXT4ge1xuICBjb25zdCBhbmFseXplciA9IG5ldyBBbmd1bGFyQ29tcG9uZW50QW5hbHl6ZXIob3B0aW9ucyk7XG4gIHJldHVybiBhd2FpdCBhbmFseXplci5hbmFseXplKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhbmFseXplVHJhbnNsYXRlUGlwZXMob3B0aW9uczogQW5hbHl6ZXJPcHRpb25zKTogUHJvbWlzZTxUcmFuc2xhdGVQaXBlVXNhZ2VbXT4ge1xuICBjb25zdCBhbmFseXplciA9IG5ldyBBbmd1bGFyQ29tcG9uZW50QW5hbHl6ZXIob3B0aW9ucyk7XG4gIGF3YWl0IGFuYWx5emVyLmFuYWx5emUoKTtcbiAgcmV0dXJuIGFuYWx5emVyLmdldFRyYW5zbGF0ZVBpcGVVc2FnZXMoKTtcbn1cbiJdfQ==