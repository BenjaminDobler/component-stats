# Component Stats VS Code Extension

Angular component usage analysis and translation validation directly in VS Code.

## Features

- **Validate Translations**: Check for missing and unused translation keys across multiple languages
- **Analyze Components**: Find component usage patterns and identify unused components
- **Real-time Feedback**: Get instant validation results in the Output panel

## Commands

- `Component Stats: Validate Translations` - Run translation validation
- `Component Stats: Analyze Component Usage` - Analyze component usage across the project
- `Component Stats: Show Results` - Display analysis results

## Configuration

- `componentStats.translationsPath` - Path to translation files (default: `src/assets/i18n`)
- `componentStats.autoRunOnSave` - Auto-run validation when translation files are saved
- `componentStats.languages` - Expected language codes (auto-detected if empty)

## Usage

1. Open an Angular workspace
2. Run `Component Stats: Validate Translations` from the command palette
3. View results in the Output panel

## Requirements

- VS Code 1.95.0 or higher
- Angular project with TypeScript

## Development

This extension is built using the component-stats library for Angular static analysis.
