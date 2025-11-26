# Development Notes

## Architecture Overview

### Core Components

1. **AngularComponentAnalyzer** (analyzer.ts)
   - Main class that orchestrates the analysis
   - Creates a TypeScript Program from the project's tsconfig
   - Uses TypeScript's compiler API to traverse the AST
   - Maintains internal maps of components and their relationships

2. **Component Discovery**
   - Visits every TypeScript node in the project
   - Identifies classes with `@Component` decorator
   - Extracts metadata: className, selector, filePath, standalone, imports

3. **Template Analysis**
   - Retrieves templates from `template` or `templateUrl`
   - Uses regex to find HTML tags matching component selectors
   - Tracks which component uses which selector

4. **Result Aggregation**
   - Builds ComponentStats objects
   - Counts usages and builds usedIn arrays
   - Determines source (library vs local path)

## Key Design Decisions

### Why TypeScript Compiler API?
- Provides accurate parsing of TypeScript/Angular code
- Access to full type information
- Handles complex decorator syntax correctly
- Official Angular approach

### Why Regex for Template Parsing?
- Performance: Much faster than full HTML parsing
- Sufficient for element selectors (most common case)
- Simple and maintainable
- Can be extended to use Angular's template parser if needed

### Component Selector Format
- Currently supports: `<my-component>` (element selectors)
- Pattern: `<([a-z][a-z0-9]*(?:-[a-z0-9]+)*)`
- Matches kebab-case HTML elements
- Does NOT match:
  - Attribute selectors: `[myDirective]`
  - Class selectors: `.myClass`
  - Complex selectors with commas

## Data Flow

```
1. Read tsconfig.json
2. Create TypeScript Program
3. Get all source files
4. For each source file:
   - Visit all nodes
   - Find @Component decorators
   - Extract component metadata
   - Store in components Map
   - Map selector to component
5. For each component:
   - Get template (inline or file)
   - Parse template for tags
   - Match tags to selectors
   - Record usage
6. Aggregate results:
   - Count usages per component
   - Build usedIn arrays
   - Determine sources
7. Return ComponentStats[]
```

## Extension Points

### Adding New Selector Types

To support attribute selectors, modify `analyzeTemplate()`:

```typescript
// Add to analyzer.ts
const attrRegex = /\[([a-z][a-zA-Z]*)\]/g;
while ((match = attrRegex.exec(template)) !== null) {
  const attrName = match[1];
  // Check against attribute selectors
}
```

### Using Angular's Template Parser

For more accurate parsing, replace regex with Angular's parser:

```typescript
import { parseTemplate } from '@angular/compiler';

const parsed = parseTemplate(template, component.filePath);
// Walk the parsed AST instead of using regex
```

### Adding Support for Directives

Similar to components, but find `@Directive` decorators:

```typescript
if (decoratorName === 'Directive') {
  this.processDirective(node, expression);
}
```

## Performance Considerations

- **AST Traversal**: O(n) where n = number of nodes in all files
- **Template Parsing**: O(m) where m = template length (regex is fast)
- **Memory**: Stores all components in memory (typically < 1MB for large projects)
- **TypeScript Program**: Cached after first creation

For very large projects (1000+ components):
- Consider streaming results
- Add progress callbacks
- Implement caching mechanism

## Testing Strategy

To test with a real Angular project:

```typescript
import { analyzeComponents } from './index';

const stats = await analyzeComponents({
  projectPath: '/path/to/test/angular/project'
});

// Verify expected components are found
// Check usage counts match manual inspection
// Ensure sources are correctly identified
```

## Known Limitations

1. **Selector Types**: Only element selectors supported
2. **Dynamic Templates**: Cannot analyze templates created at runtime
3. **Template Syntax**: Uses regex, not full Angular parser
4. **Lazy Loading**: All modules must be in TypeScript program
5. **ViewChild/ContentChild**: Does not track programmatic component usage

## Future Enhancements

- [ ] Support attribute and class selectors
- [ ] Detect unused templates
- [ ] Track directive usage
- [ ] Analyze lazy-loaded modules separately
- [ ] Generate dependency graphs
- [ ] Integration with Angular Language Service for hover information
- [ ] Support for Angular versions 15-18 (currently optimized for 19)
- [ ] Watch mode for continuous analysis
- [ ] IDE extensions (VS Code, WebStorm)

## Angular Language Service Note

While this library uses Angular's compiler packages, it doesn't directly use the Language Service API. The Language Service is primarily designed for IDE integration (autocomplete, diagnostics, etc.) rather than static analysis. However, we leverage the same underlying compiler infrastructure that the Language Service uses.

## Debugging Tips

Enable verbose logging:

```typescript
// Add to analyzer.ts
private debug = true;

private log(...args: any[]) {
  if (this.debug) console.log('[Analyzer]', ...args);
}
```

Inspect the TypeScript Program:

```typescript
const sourceFiles = this.program.getSourceFiles();
console.log('Source files:', sourceFiles.map(sf => sf.fileName));
```

Check decorator parsing:

```typescript
console.log('Found decorator:', decoratorName);
console.log('Selector:', selector);
```
