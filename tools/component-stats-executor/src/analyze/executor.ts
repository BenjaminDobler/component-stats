import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { 
  analyzeComponents, 
  filterByMinUsage,
  type ComponentStats 
} from '@component-stats/component-stats';

export interface AnalyzeExecutorSchema {
  projectPath: string;
  outputFile: string;
  tsconfigPath?: string;
  minUsage?: number;
  includeUnused?: boolean;
}

export default async function runExecutor(
  options: AnalyzeExecutorSchema,
  context: ExecutorContext
) {
  const workspaceRoot = context.root;
  
  console.log('🔍 Analyzing Angular component usage...');
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
    let stats: ComponentStats[] = await analyzeComponents(analyzerOptions);
    
    // Apply filters
    if (options.minUsage && options.minUsage > 0) {
      stats = filterByMinUsage(stats, options.minUsage);
    }
    
    if (!options.includeUnused) {
      stats = stats.filter((s: ComponentStats) => s.count > 0);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(absoluteOutputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write results to file
    fs.writeFileSync(
      absoluteOutputFile,
      JSON.stringify(stats, null, 2),
      'utf-8'
    );
    
    console.log(`✅ Analysis complete!`);
    console.log(`📊 Found ${stats.length} components`);
    console.log(`💾 Results saved to: ${options.outputFile}`);
    
    return {
      success: true,
      stats: {
        totalComponents: stats.length,
        usedComponents: stats.filter((s: ComponentStats) => s.count > 0).length,
        unusedComponents: stats.filter((s: ComponentStats) => s.count === 0).length,
        outputFile: options.outputFile
      }
    };
  } catch (error) {
    console.error('❌ Error analyzing components:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
