#!/usr/bin/env node

import { analyzeComponents, analyzeTranslatePipes } from './index';
import * as path from 'path';
import * as fs from 'fs';

const args = process.argv.slice(2);

function printUsage() {
  console.log(`
Angular Component Stats - Analyze component usage in your Angular project

Usage:
  angular-component-stats [project-path] [options]

Options:
  --tsconfig <path>    Path to tsconfig.json (default: <project-path>/tsconfig.json)
  --json               Output results as JSON
  --translate          Analyze translate pipe usage instead of component stats
  --help, -h           Show this help message

Examples:
  angular-component-stats /path/to/angular/project
  angular-component-stats . --json > stats.json
  angular-component-stats /path/to/project --tsconfig ./tsconfig.app.json
  angular-component-stats . --translate --json > translations.json
`);
}

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const projectPath = args[0] || process.cwd();
  const resolvedPath = path.resolve(projectPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Project path does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  const tsconfigIndex = args.indexOf('--tsconfig');
  const tsconfigPath = tsconfigIndex >= 0 ? args[tsconfigIndex + 1] : undefined;
  const jsonOutput = args.includes('--json');
  const analyzeTranslate = args.includes('--translate');

  try {
    if (!jsonOutput) {
      console.log(`Analyzing Angular project at: ${resolvedPath}\n`);
    }

    if (analyzeTranslate) {
      // Analyze translate pipe usage
      const translateUsages = await analyzeTranslatePipes({
        projectPath: resolvedPath,
        tsconfigPath: tsconfigPath ? path.resolve(tsconfigPath) : undefined
      });

      if (jsonOutput) {
        console.log(JSON.stringify(translateUsages, null, 2));
      } else {
        console.log('Translate Pipe Usage:');
        console.log('====================\n');

        if (translateUsages.length === 0) {
          console.log('No translate pipe usages found in the project.');
          process.exit(0);
        }

        // Group by component
        const byComponent = translateUsages.reduce((acc, usage) => {
          if (!acc[usage.componentClass]) {
            acc[usage.componentClass] = [];
          }
          acc[usage.componentClass].push(usage);
          return acc;
        }, {} as Record<string, typeof translateUsages>);

        Object.entries(byComponent).forEach(([componentClass, usages]) => {
          console.log(`${componentClass}:`);
          usages.forEach(usage => {
            console.log(`  - "${usage.translationKey}"`);
          });
          console.log('');
        });

        console.log(`\n=== Summary ===`);
        console.log(`Total translation keys used: ${translateUsages.length}`);
        console.log(`Unique translation keys: ${new Set(translateUsages.map(u => u.translationKey)).size}`);
        console.log(`Components using translations: ${Object.keys(byComponent).length}`);
      }
    } else {
      // Original component stats analysis
      const stats = await analyzeComponents({
        projectPath: resolvedPath,
        tsconfigPath: tsconfigPath ? path.resolve(tsconfigPath) : undefined
      });

      if (jsonOutput) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log('Component Usage Statistics:');
        console.log('===========================\n');

        if (stats.length === 0) {
          console.log('No components found in the project.');
          process.exit(0);
        }

        stats.forEach((component, index) => {
          console.log(`${index + 1}. ${component.componentClass}`);
          console.log(`   Source: ${component.source}`);
          console.log(`   Used ${component.count} time(s)`);
          if (component.usedIn.length > 0) {
            console.log(`   Used in: ${component.usedIn.join(', ')}`);
          } else {
            console.log(`   Used in: (none - might be a root component or unused)`);
          }
          console.log('');
        });

        // Summary statistics
        const totalComponents = stats.length;
        const usedComponents = stats.filter(c => c.count > 0).length;
        const unusedComponents = stats.filter(c => c.count === 0).length;
        const totalUsages = stats.reduce((sum, c) => sum + c.count, 0);

        console.log('\n=== Summary ===');
        console.log(`Total components: ${totalComponents}`);
        console.log(`Used components: ${usedComponents}`);
        console.log(`Unused components: ${unusedComponents}`);
        console.log(`Total component usages: ${totalUsages}`);
      }
    }

  } catch (error) {
    if (!jsonOutput) {
      console.error('Error analyzing components:');
      console.error(error instanceof Error ? error.message : error);
    } else {
      console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
    process.exit(1);
  }
}

main();
