# Component Stats

An Nx monorepo workspace for Angular component analysis tools.

## Quick Start

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Build all projects
npm run build:all
```

## Projects

### Libraries

- **[@component-stats/component-stats](./libs/component-stats)** - Main library for analyzing Angular component usage in templates

### Applications

- **[demo](./apps/demo)** - Angular 20 demo application showcasing translate pipe functionality with multi-language support

## Documentation

- **[Workspace Guide](./WORKSPACE.md)** - Detailed workspace documentation and Nx commands
- **[Migration Guide](./MIGRATION.md)** - Details about the Nx workspace migration
- **[Publishing Guide](./PUBLISHING.md)** - How to publish the library to npm
- **[Library Documentation](./libs/component-stats/README.md)** - Component stats library full documentation
- **[Usage Examples](./libs/component-stats/USAGE.md)** - Detailed usage examples
- **[Quick Start](./libs/component-stats/QUICKSTART.md)** - Get started quickly
- **[Development Guide](./libs/component-stats/DEVELOPMENT.md)** - Development instructions

## Features

- 📊 Analyzes component usage across Angular projects
- 🔍 Identifies which components are used in which templates
- 📈 Counts component usage
- 📦 Distinguishes between local and library components
- 🌍 Detects translate pipe usage for i18n
- 🚀 Uses Angular Language Service for accurate parsing
- ✨ Supports Angular 19

## Nx Workspace

This is an [Nx](https://nx.dev) monorepo workspace.

### Common Commands

```bash
# Build a specific library
nx build component-stats

# Run all build targets
nx run-many --target=build --all

# View dependency graph
nx graph

# Run affected builds
nx affected:build
```

## Learn More

- [Nx Documentation](https://nx.dev)
- [Component Stats Library](./libs/component-stats/README.md)
