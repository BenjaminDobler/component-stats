# Quick Start Guide

## Installation

```bash
npm install angular-component-stats
```

## Quickest Way to Use

### Command Line

```bash
npx angular-component-stats /path/to/your/angular/project
```

### In Your Code

```typescript
import { analyzeComponents } from 'angular-component-stats';

const stats = await analyzeComponents({
  projectPath: '/path/to/your/angular/project'
});

console.log(stats);
```

## What You Get

An array of objects with this structure:

```typescript
{
  componentClass: "ButtonComponent",      // The component's class name
  usedIn: ["HomeComponent", "AboutComponent"],  // Which components use it
  count: 7,                               // How many times it's used
  source: "src/app/shared/button.component.ts"  // Where it's defined
}
```

## Common Tasks

### Find Unused Components

```typescript
import { analyzeComponents, getUnusedComponents } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: '.' });
const unused = getUnusedComponents(stats);
console.log('Unused:', unused.map(c => c.componentClass));
```

### Find Most Used Components

```typescript
import { analyzeComponents, getTopComponents } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: '.' });
const top5 = getTopComponents(stats, 5);
console.log('Top 5:', top5);
```

### Generate a Report

```typescript
import { analyzeComponents, generateReport } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: '.' });
console.log(generateReport(stats));
```

## Requirements

- Angular 19 project
- Node.js 18+
- Valid `tsconfig.json` in your project

## Troubleshooting

**Error: tsconfig.json not found**
- Make sure you're pointing to the root of your Angular project
- Or specify the tsconfig path: `analyzeComponents({ projectPath: '.', tsconfigPath: './tsconfig.app.json' })`

**No components found**
- Ensure your project has been built at least once
- Check that your components use the `@Component` decorator
- Verify the tsconfig includes your component files

**Template parsing issues**
- Currently only supports standard HTML-style selectors like `<my-component>`
- Attribute selectors like `[myDirective]` are not yet supported

## Next Steps

- See [USAGE.md](./USAGE.md) for more examples
- See [README.md](./README.md) for complete API documentation
