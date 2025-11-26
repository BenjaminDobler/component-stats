# Usage Examples

## Basic Usage

### Analyze a project

```typescript
import { analyzeComponents } from 'angular-component-stats';

const stats = await analyzeComponents({
  projectPath: '/path/to/angular/project'
});

console.log(stats);
```

## Using Utility Functions

### Find unused components

```typescript
import { analyzeComponents, getUnusedComponents } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const unused = getUnusedComponents(stats);

console.log('Unused components:', unused);
```

### Get top used components

```typescript
import { analyzeComponents, getTopComponents } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const top10 = getTopComponents(stats, 10);

console.log('Top 10 components:', top10);
```

### Filter by usage count

```typescript
import { analyzeComponents, filterByMinUsage } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const frequentlyUsed = filterByMinUsage(stats, 5); // Used 5+ times

console.log('Frequently used components:', frequentlyUsed);
```

### Generate a report

```typescript
import { analyzeComponents, generateReport } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const report = generateReport(stats);

console.log(report);
```

### Export to CSV

```typescript
import { analyzeComponents, toCSV } from 'angular-component-stats';
import * as fs from 'fs';

const stats = await analyzeComponents({ projectPath: './my-app' });
const csv = toCSV(stats);

fs.writeFileSync('component-stats.csv', csv);
```

### Group by source

```typescript
import { analyzeComponents, groupBySource } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const grouped = groupBySource(stats);

for (const [source, components] of grouped) {
  console.log(`${source}: ${components.length} components`);
}
```

### Find library components

```typescript
import { analyzeComponents, getLibraryComponents } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const fromLibraries = getLibraryComponents(stats);

console.log('Components from libraries:', fromLibraries);
```

### Find what a component uses

```typescript
import { analyzeComponents, findUsedBy } from 'angular-component-stats';

const stats = await analyzeComponents({ projectPath: './my-app' });
const usedByHome = findUsedBy(stats, 'HomeComponent');

console.log('Components used by HomeComponent:', usedByHome);
```

## Command Line Usage

### Basic analysis

```bash
npx angular-component-stats /path/to/angular/project
```

### Custom tsconfig

```bash
npx angular-component-stats . --tsconfig ./tsconfig.app.json
```

### JSON output

```bash
npx angular-component-stats . --json > stats.json
```

### Get help

```bash
npx angular-component-stats --help
```

## Advanced Example: CI/CD Integration

```typescript
import { analyzeComponents, getUnusedComponents } from 'angular-component-stats';

async function checkForUnusedComponents() {
  const stats = await analyzeComponents({ projectPath: process.cwd() });
  const unused = getUnusedComponents(stats);
  
  if (unused.length > 0) {
    console.log('⚠️  Warning: Found unused components:');
    unused.forEach(c => console.log(`  - ${c.componentClass}`));
    
    // Optionally fail the build
    if (process.env.CI === 'true') {
      process.exit(1);
    }
  } else {
    console.log('✅ All components are being used!');
  }
}

checkForUnusedComponents();
```

## Integration with Build Tools

### npm script

Add to your `package.json`:

```json
{
  "scripts": {
    "analyze": "angular-component-stats .",
    "analyze:json": "angular-component-stats . --json > component-stats.json"
  }
}
```

Then run:

```bash
npm run analyze
```
