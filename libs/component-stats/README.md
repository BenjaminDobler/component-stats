# Angular Component Stats

A Node.js library that parses Angular projects and provides detailed statistics about component usage in templates using the Angular compiler and TypeScript.

## Features

- 📊 Analyzes component usage across your Angular project
- 🔍 Identifies which components are used in which templates
- 📈 Counts how many times each component is used
- 📦 Distinguishes between local components and library components
- 🌍 Detects translate pipe usage for internationalization
- 🚀 Uses TypeScript compiler and Angular Language Service for accurate parsing
- ✨ Supports Angular 19 (latest stable version)

## Installation

```bash
npm install angular-component-stats
```

## Usage

### Basic Usage - Component Analysis

```typescript
import { analyzeComponents } from 'angular-component-stats';

const stats = await analyzeComponents({
  projectPath: '/path/to/your/angular/project'
});

console.log(stats);
```

### Translate Pipe Analysis

```typescript
import { analyzeTranslatePipes } from 'angular-component-stats';

const translateUsages = await analyzeTranslatePipes({
  projectPath: '/path/to/your/angular/project'
});

console.log(translateUsages);
```

### Output Format

#### Component Stats

The library returns an array of `ComponentStats` objects:

```typescript
interface ComponentStats {
  componentClass: string;  // Class name of the component
  usedIn: string[];        // Array of component class names that use this component
  count: number;           // Total number of times the component is used
  source: string;          // Library name (if from node_modules) or relative path
  external: boolean;       // true if from library, false if from project
}
```

#### Translate Pipe Usage

```typescript
interface TranslatePipeUsage {
  componentClass: string;  // Class name of the component
  translationKey: string;  // Translation key used
  filePath: string;        // Path to the component file
}
```

### Example Output

#### Component Analysis

```javascript
[
  {
    componentClass: 'ButtonComponent',
    usedIn: ['HomeComponent', 'ProfileComponent', 'SettingsComponent'],
    count: 5,
    source: 'src/app/shared/button/button.component.ts',
    external: false
  },
  {
    componentClass: 'MatButton',
    usedIn: ['LoginComponent', 'RegisterComponent'],
    count: 3,
    source: '@angular/material/button',
    external: true
  },
  {
    componentClass: 'HeaderComponent',
    usedIn: ['AppComponent'],
    count: 1,
    source: 'src/app/layout/header/header.component.ts',
    external: false
  }
]
```

#### Translate Pipe Analysis

```javascript
[
  {
    componentClass: 'HomeComponent',
    translationKey: 'home.welcome',
    filePath: '/project/src/app/home/home.component.ts'
  },
  {
    componentClass: 'HomeComponent',
    translationKey: 'home.subtitle',
    filePath: '/project/src/app/home/home.component.ts'
  },
  {
    componentClass: 'LoginComponent',
    translationKey: 'login.button',
    filePath: '/project/src/app/login/login.component.ts'
  }
]
```

### Advanced Usage

```typescript
import { analyzeComponents, analyzeTranslatePipes } from 'angular-component-stats';
import * as path from 'path';

async function analyzeMyProject() {
  // Component analysis
  const stats = await analyzeComponents({
    projectPath: '/path/to/angular/project',
    // Optional: specify custom tsconfig
    tsconfigPath: '/path/to/angular/project/tsconfig.app.json'
  });

  // Find most used components
  const topComponents = stats
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  console.log('Top 10 most used components:', topComponents);

  // Find unused components
  const unused = stats.filter(c => c.count === 0);
  console.log('Unused components:', unused);

  // Find library components
  const fromLibraries = stats.filter(c => 
    c.source.includes('node_modules') || c.source.startsWith('@')
  );
  console.log('Components from libraries:', fromLibraries);
}
```

## API

### `analyzeComponents(options: AnalyzerOptions): Promise<ComponentStats[]>`

Analyzes an Angular project and returns component usage statistics.

#### Parameters

- `options.projectPath` (required): Absolute path to your Angular project
- `options.tsconfigPath` (optional): Path to tsconfig.json (defaults to `projectPath/tsconfig.json`)

#### Returns

Promise that resolves to an array of `ComponentStats` objects.

### `analyzeTranslatePipes(options: AnalyzerOptions): Promise<TranslatePipeUsage[]>`

Analyzes an Angular project and returns all usage of the translate pipe.

#### Parameters

- `options.projectPath` (required): Absolute path to your Angular project
- `options.tsconfigPath` (optional): Path to tsconfig.json (defaults to `projectPath/tsconfig.json`)

#### Returns

Promise that resolves to an array of `TranslatePipeUsage` objects containing:
- `componentClass`: The component where the translation is used
- `translationKey`: The translation key string
- `filePath`: Path to the component file

### Utility Functions

The library includes helpful utility functions for filtering and analyzing results:

- `filterByMinUsage(stats, minCount)` - Filter components by minimum usage count
- `getUnusedComponents(stats)` - Get only unused components
- `getLibraryComponents(stats)` - Get components from external libraries
- `getLocalComponents(stats)` - Get local project components
- `groupBySource(stats)` - Group components by their source
- `getTopComponents(stats, limit)` - Get top N most used components
- `findUsedBy(stats, componentClass)` - Find components used by a specific component
- `generateReport(stats)` - Generate a formatted text report
- `toCSV(stats)` - Export statistics to CSV format

See [USAGE.md](./USAGE.md) for detailed examples.

## How It Works

This library leverages the Angular compiler infrastructure and TypeScript's powerful type system:

1. **TypeScript Program Creation**: Creates a TypeScript program using your project's `tsconfig.json`, giving us full type information
2. **Component Discovery**: Traverses the TypeScript AST (Abstract Syntax Tree) to find all classes decorated with `@Component`
3. **Metadata Extraction**: Extracts component metadata including:
   - Class name
   - Selector (used in templates)
   - File path
   - Standalone status
   - Imports (for standalone components)
4. **Template Parsing**: Retrieves templates from both inline `template` properties and external `templateUrl` files
5. **Usage Detection**: Parses templates to find HTML tags matching component selectors
6. **Source Identification**: Determines if components are from external libraries (node_modules) or local files
7. **Statistics Aggregation**: Compiles comprehensive usage data including:
   - Which components use which other components
   - Usage frequency counts
   - Complete dependency mapping

The implementation uses Angular's official compiler packages (`@angular/compiler`, `@angular/compiler-cli`) ensuring compatibility with Angular 19 and accurate parsing of Angular-specific syntax.

## Requirements

- Node.js 18 or higher
- Angular 19 project
- TypeScript 5.6 or higher

## Example Script

Run the included example:

```bash
npm run build
node dist/example.js /path/to/your/angular/project
```

## Use Cases

- 📊 **Component Usage Analysis**: Understand which components are most/least used
- 🧹 **Dead Code Detection**: Find unused components that can be removed
- 📦 **Library Auditing**: See which library components are actually being used
- 🔍 **Dependency Mapping**: Understand component dependencies across your project
- 📈 **Refactoring Insights**: Identify candidates for component consolidation
- 🌍 **Translation Auditing**: Find all translation keys used across your components

## Command Line Interface

The library includes a CLI tool for quick analysis:

```bash
# Analyze component usage
angular-component-stats /path/to/project

# Output as JSON
angular-component-stats /path/to/project --json > stats.json

# Analyze translate pipe usage
angular-component-stats /path/to/project --translate

# Analyze translate pipe usage as JSON
angular-component-stats /path/to/project --translate --json > translations.json

# Use custom tsconfig
angular-component-stats /path/to/project --tsconfig ./tsconfig.app.json
```

### CLI Options

- `--json` - Output results as JSON
- `--translate` - Analyze translate pipe usage instead of component stats
- `--tsconfig <path>` - Specify custom tsconfig path
- `--help, -h` - Show help message

## Limitations

- Currently supports standard HTML-style component selectors (e.g., `<my-component>`)
- Does not analyze attribute selectors or class selectors
- Requires a valid TypeScript configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
