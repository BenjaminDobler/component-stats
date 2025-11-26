# Component Stats Workspace

An Nx monorepo workspace for Angular component analysis tools.

## Structure

```
component-stats/
├── libs/
│   └── component-stats/     # Main library for component analysis
│       ├── src/             # Source code
│       ├── README.md        # Library documentation
│       ├── USAGE.md         # Usage examples
│       ├── QUICKSTART.md    # Quick start guide
│       └── DEVELOPMENT.md   # Development guide
└── ...
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Build the Library

```bash
nx build component-stats
```

Or use the npm script:

```bash
npm run build
```

### Build All Projects

```bash
nx run-many --target=build --all
```

Or:

```bash
npm run build:all
```

## Library: component-stats

The main library provides tools for analyzing Angular component usage in templates.

### Features

- 📊 Analyzes component usage across your Angular project
- 🔍 Identifies which components are used in which templates
- 📈 Counts how many times each component is used
- 📦 Distinguishes between local components and library components
- 🌍 Detects translate pipe usage for internationalization
- 🚀 Uses Angular Language Service for accurate parsing
- ✨ Supports Angular 19 (latest stable version)

### Documentation

See [libs/component-stats/README.md](./libs/component-stats/README.md) for full documentation.

## Nx Commands

### Run a target for a specific project

```bash
nx <target> <project>
```

Examples:
```bash
nx build component-stats
nx test component-stats
nx lint component-stats
```

### Run a target for all projects

```bash
nx run-many --target=<target> --all
```

### View project graph

```bash
nx graph
```

## Learn More

- [Nx Documentation](https://nx.dev)
- [Component Stats Library](./libs/component-stats/README.md)
