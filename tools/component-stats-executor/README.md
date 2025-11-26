# Component Stats Nx Executor

This directory contains the Nx executor plugin for analyzing Angular component usage and translations.

## Installation

The executor is automatically linked in the workspace via symlink:
```bash
node_modules/@component-stats/executor -> tools/component-stats-executor
```

## Usage

Add tasks to your `project.json`:

```json
{
  "targets": {
    "analyze-components": {
      "executor": "@component-stats/executor:analyze",
      "options": {
        "projectPath": "apps/your-app",
        "outputFile": "dist/stats/components.json",
        "includeUnused": true,
        "minUsage": 1,
        "tsconfigPath": "apps/your-app/tsconfig.app.json"
      }
    },
    "analyze-translations": {
      "executor": "@component-stats/executor:analyze-translations",
      "options": {
        "projectPath": "apps/your-app",
        "outputFile": "dist/stats/translations.json",
        "tsconfigPath": "apps/your-app/tsconfig.app.json"
      }
    }
  }
}
```

## Run

```bash
# Analyze components
nx analyze-components your-app

# Analyze translations
nx analyze-translations your-app
```

## Available Executors

### `analyze`
Analyzes Angular component usage in a project.

**Options:**
- `projectPath` (required): Path to the Angular project
- `outputFile` (required): Path where results will be saved as JSON
- `tsconfigPath` (optional): Custom tsconfig path
- `minUsage` (optional): Filter components with minimum usage count
- `includeUnused` (optional): Include unused components in results

### `analyze-translations`
Analyzes translate pipe usage in an Angular project.

**Options:**
- `projectPath` (required): Path to the Angular project
- `outputFile` (required): Path where results will be saved as JSON
- `tsconfigPath` (optional): Custom tsconfig path

## Development

After making changes to the executor:

```bash
# Compile TypeScript
npx tsc --project tools/component-stats-executor/tsconfig.json

# Test
nx analyze-components demo
nx analyze-translations demo
```
