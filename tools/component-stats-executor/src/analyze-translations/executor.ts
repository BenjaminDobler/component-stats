import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeTranslatePipes } from '@component-stats/component-stats';

export interface AnalyzeTranslationsExecutorSchema {
  projectPath: string;
  outputFile: string;
  tsconfigPath?: string;
}

export default async function runExecutor(
  options: AnalyzeTranslationsExecutorSchema,
  context: ExecutorContext
) {
  const workspaceRoot = context.root;
  
  console.log('🌍 Analyzing translate pipe usage...');
  console.log(`📁 Project: ${options.projectPath}`);
  
  try {
    const absoluteProjectPath = path.resolve(workspaceRoot, options.projectPath);
    const absoluteOutputFile = path.resolve(workspaceRoot, options.outputFile);
    
    // Build analyzer options
    const analyzerOptions: { projectPath: string; tsconfigPath?: string } = {
      projectPath: absoluteProjectPath,
    };
    
    if (options.tsconfigPath) {
      analyzerOptions.tsconfigPath = path.resolve(
        workspaceRoot,
        options.tsconfigPath
      );
    }
    
    // Run the analysis
    const translations = await analyzeTranslatePipes(analyzerOptions);
    
    // Ensure output directory exists
    const outputDir = path.dirname(absoluteOutputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write results to file
    fs.writeFileSync(
      absoluteOutputFile,
      JSON.stringify(translations, null, 2),
      'utf-8'
    );
    
    console.log(`✅ Analysis complete!`);
    console.log(`🔤 Found ${translations.length} translation keys`);
    console.log(`💾 Results saved to: ${options.outputFile}`);
    
    return {
      success: true,
      stats: {
        totalTranslations: translations.length,
        outputFile: options.outputFile
      }
    };
  } catch (error) {
    console.error('❌ Error analyzing translations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
