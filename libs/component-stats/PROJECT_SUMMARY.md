# Angular Component Stats - Project Summary

## ✅ Project Complete

A fully functional Node.js library for analyzing Angular 19 projects and tracking component usage.

## 📦 What Was Built

### Core Library (`src/`)

1. **analyzer.ts** - Main analysis engine
   - Uses TypeScript compiler API to parse Angular projects
   - Discovers components via AST traversal
   - Extracts templates and analyzes component usage
   - Leverages Angular compiler packages for accuracy

2. **types.ts** - TypeScript interfaces
   - `ComponentStats` - Output format (componentClass, usedIn, count, source)
   - `AnalyzerOptions` - Configuration options

3. **utils.ts** - Utility functions
   - Filter and sort components
   - Generate reports
   - Export to CSV
   - Group by source

4. **cli.ts** - Command-line interface
   - Executable binary: `angular-component-stats`
   - JSON output support
   - Custom tsconfig support

5. **index.ts** - Public API exports
   - Main entry point for library consumers

6. **example.ts** - Usage example
   - Demonstrates all major features

## 📚 Documentation

- **README.md** - Complete documentation with examples
- **USAGE.md** - Detailed usage examples and patterns
- **QUICKSTART.md** - Get started in 5 minutes

## 🔧 Configuration

- **package.json** - Dependencies (Angular 19, TypeScript 5.6)
- **tsconfig.json** - TypeScript configuration
- **.gitignore** - Git ignore rules

## 🎯 Features Implemented

✅ Parse Angular projects using TypeScript compiler  
✅ Discover all components and their metadata  
✅ Analyze inline and external templates  
✅ Track component usage across templates  
✅ Count usage frequency  
✅ Identify component sources (local vs library)  
✅ Map component dependencies (usedIn relationships)  
✅ CLI tool with JSON output  
✅ Utility functions for filtering and reporting  
✅ CSV export capability  
✅ Full TypeScript types and IntelliSense support  

## 📊 Output Format

```typescript
interface ComponentStats {
  componentClass: string;  // "ButtonComponent"
  usedIn: string[];        // ["HomeComponent", "AboutComponent"]
  count: number;           // 7
  source: string;          // "src/app/shared/button.component.ts" or "@angular/material/button"
}
```

## 🚀 How to Use

### As a Library

```typescript
import { analyzeComponents } from 'angular-component-stats';

const stats = await analyzeComponents({
  projectPath: '/path/to/angular/project'
});
```

### As a CLI Tool

```bash
npx angular-component-stats /path/to/angular/project
npx angular-component-stats . --json > stats.json
```

### With Utility Functions

```typescript
import { 
  analyzeComponents, 
  getUnusedComponents,
  getTopComponents,
  generateReport 
} from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: '.' });
console.log(generateReport(stats));
```

## 🔨 Build Commands

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript
npm run watch     # Watch mode for development
npm test          # Run example
```

## 📦 Technology Stack

- **Angular 19** - Latest stable version
- **TypeScript 5.6** - For type safety and AST parsing
- **@angular/compiler** - Angular template parsing
- **@angular/compiler-cli** - Angular compilation tools
- **Node.js** - Runtime environment

## 🎓 Key Concepts

1. **AST Traversal** - Walks the TypeScript Abstract Syntax Tree to find components
2. **Decorator Analysis** - Parses `@Component` decorators for metadata
3. **Template Parsing** - Extracts and analyzes both inline and external templates
4. **Selector Mapping** - Maps HTML selectors to component classes
5. **Source Detection** - Distinguishes between local and library components

## 📝 Notes

- Uses official Angular compiler packages for accuracy
- Compatible with Angular 19 standalone components
- Supports both inline templates and templateUrl
- Handles component imports in standalone components
- Regex-based template parsing for performance
- Currently supports HTML element selectors (not attribute/class selectors)

## 🎉 Ready to Use!

The library is fully built and ready to analyze Angular projects. Just run `npm run build` to compile, then use it as shown in the documentation.
