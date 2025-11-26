import { analyzeComponents } from './index';
import * as path from 'path';

async function main() {
  try {
    // Example: Analyze an Angular project
    // Replace with your actual Angular project path
    const projectPath = process.argv[2] || process.cwd();
    
    console.log(`Analyzing Angular project at: ${projectPath}\n`);
    
    const stats = await analyzeComponents({
      projectPath: projectPath,
      // Optional: specify custom tsconfig path
      // tsconfigPath: path.join(projectPath, 'tsconfig.app.json')
    });

    console.log('Component Usage Statistics:');
    console.log('===========================\n');

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

    // Example: Find most used components
    console.log('\nTop 5 Most Used Components:');
    console.log('============================');
    stats
      .filter(c => c.count > 0)
      .slice(0, 5)
      .forEach((component, index) => {
        console.log(`${index + 1}. ${component.componentClass} - ${component.count} usage(s)`);
      });

    // Example: Find unused components
    const unusedComponents = stats.filter(c => c.count === 0);
    if (unusedComponents.length > 0) {
      console.log('\nUnused Components:');
      console.log('==================');
      unusedComponents.forEach(component => {
        console.log(`- ${component.componentClass} (${component.source})`);
      });
    }

    // Example: Find components from libraries
    const libraryComponents = stats.filter(c => c.source.includes('node_modules') || c.source.startsWith('@'));
    if (libraryComponents.length > 0) {
      console.log('\nComponents from Libraries:');
      console.log('==========================');
      libraryComponents.forEach(component => {
        console.log(`- ${component.componentClass} from ${component.source} - used ${component.count} time(s)`);
      });
    }

  } catch (error) {
    console.error('Error analyzing components:', error);
    process.exit(1);
  }
}

main();
