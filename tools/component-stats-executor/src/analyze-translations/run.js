#!/usr/bin/env node

const path = require('path');

// Get workspace root - navigate up from tools/component-stats-executor/src/analyze-translations
const workspaceRoot = path.resolve(__dirname, '../../../../');

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath = args[0] || 'apps/demo';
const outputFile = args[1] || 'dist/stats/demo-translations.json';

console.log('🌍 Running translation analysis...');
console.log(`📁 Project: ${projectPath}`);
console.log(`💾 Output: ${outputFile}`);

try {
  // Import and run the executor
  const executor = require('./executor');
  
  const options = {
    projectPath,
    outputFile
  };
  
  const context = {
    root: workspaceRoot,
    projectName: 'demo',
    targetName: 'analyze-translations',
    configurationName: undefined
  };
  
  executor.default(options, context).then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      console.error('Analysis failed:', result.error);
      process.exit(1);
    }
  }).catch(error => {
    console.error('Analysis error:', error);
    process.exit(1);
  });
} catch (error) {
  console.error('Failed to run analysis:', error);
  process.exit(1);
}
