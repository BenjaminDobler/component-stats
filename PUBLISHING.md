# Publishing Guide

This document describes how to publish the `@component-stats/component-stats` library to npm.

## Prerequisites

1. Ensure you have npm publishing rights
2. Update the version in `libs/component-stats/package-dist.json`
3. Ensure all tests pass and the build is successful

## Publishing Steps

### 1. Build the Library

```bash
npm run build
```

This will compile the TypeScript and copy all necessary files to `dist/libs/component-stats/`.

### 2. Verify the Build

Check the contents of the dist folder:

```bash
ls -la dist/libs/component-stats/
```

You should see:
- `src/` - Compiled JavaScript and TypeScript declaration files
- `package-dist.json` - The package.json for distribution
- All markdown documentation files

### 3. Test Locally (Optional)

You can test the package locally before publishing:

```bash
cd dist/libs/component-stats
npm link
```

Then in another Angular project:

```bash
npm link angular-component-stats
```

### 4. Prepare for Publishing

Run the prepare script which copies the distribution package.json:

```bash
npm run publish:prepare
```

### 5. Publish to npm

```bash
npm run publish:npm
```

Or manually:

```bash
cd dist/libs/component-stats
npm publish
```

## Version Management

Before publishing, update the version in `libs/component-stats/package-dist.json`:

```json
{
  "name": "angular-component-stats",
  "version": "1.0.1",  // Update this
  ...
}
```

Follow semantic versioning:
- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality additions
- **PATCH** version for backward-compatible bug fixes

## Post-Publishing

1. Tag the release in git:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. Update the CHANGELOG.md (if exists)

3. Verify the package on npm:
   ```bash
   npm view angular-component-stats
   ```

## Package Structure

The published package includes:

```
angular-component-stats/
├── src/
│   ├── index.js & index.d.ts    # Main exports
│   ├── cli.js & cli.d.ts        # CLI tool
│   ├── analyzer-v3.js & .d.ts   # Main analyzer
│   ├── types.js & .d.ts         # Type definitions
│   └── utils.js & .d.ts         # Utility functions
├── package.json                  # Package metadata
├── README.md                     # Documentation
├── USAGE.md                      # Usage examples
└── *.md                          # Other documentation
```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf dist
nx build component-stats
```

### Publishing Permission Issues

Ensure you're logged in to npm:

```bash
npm login
npm whoami
```

### Package Name Already Exists

If `angular-component-stats` is taken, update the name in `package-dist.json` to use a scope:

```json
{
  "name": "@your-username/angular-component-stats",
  ...
}
```
