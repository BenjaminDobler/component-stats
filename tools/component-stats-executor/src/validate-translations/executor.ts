import { ExecutorContext } from '@nx/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { TranslationValidationResult, validateTranslations } from '@component-stats/component-stats';

export interface ValidateTranslationsExecutorSchema {
  projectPath: string;
  translationsPath: string;
  outputFile: string;
  tsconfigPath?: string;
}

export default async function runExecutor(
  options: ValidateTranslationsExecutorSchema,
  context: ExecutorContext
) {
  const workspaceRoot = context.root;
  
  console.log('🌐 Validating translation coverage...');
  console.log(`📁 Project: ${options.projectPath}`);
  console.log(`🗂️  Translations: ${options.translationsPath}`);
  
  try {
    const absoluteProjectPath = path.resolve(workspaceRoot, options.projectPath);
    const absoluteTranslationsPath = path.resolve(workspaceRoot, options.translationsPath);
    const absoluteOutputFile = path.resolve(workspaceRoot, options.outputFile);
    
    // Build analyzer options
    const analyzerOptions: { projectPath: string; translationsPath: string; tsconfigPath?: string } = {
      projectPath: absoluteProjectPath,
      translationsPath: absoluteTranslationsPath,
    };
    
    if (options.tsconfigPath) {
      analyzerOptions.tsconfigPath = path.resolve(
        workspaceRoot,
        options.tsconfigPath
      );
    }
    
    // Run the validation
    const result = await validateTranslations(analyzerOptions);
    
    // Ensure output directory exists
    const outputDir = path.dirname(absoluteOutputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert Maps to Objects for JSON serialization
    const serializableResult = {
      usedKeys: result.usedKeys,
      languages: result.languages,
      missingKeysByLanguage: Object.fromEntries(result.missingKeysByLanguage),
      unusedKeysByLanguage: Object.fromEntries(result.unusedKeysByLanguage)
    };
    
    // Write results to file
    fs.writeFileSync(
      absoluteOutputFile,
      JSON.stringify(serializableResult, null, 2),
      'utf-8'
    );
    
    // Print summary
    console.log(`✅ Validation complete!`);
    console.log(`🔤 Found ${result.usedKeys.length} unique translation keys in code`);
    console.log(`🌍 Checked ${result.languages.length} language(s): ${result.languages.join(', ')}`);
    
    let hasIssues = false;
    
    if (result.missingKeysByLanguage.size > 0) {
      hasIssues = true;
      console.log(`\n⚠️  Missing translations:`);
      for (const [lang, keys] of result.missingKeysByLanguage) {
        console.log(`  ${lang}: ${keys.length} key(s) missing`);
      }
    }
    
    if (result.unusedKeysByLanguage.size > 0) {
      hasIssues = true;
      console.log(`\n📦 Unused translations:`);
      for (const [lang, keys] of result.unusedKeysByLanguage) {
        console.log(`  ${lang}: ${keys.length} key(s) not used`);
      }
    }
    
    if (!hasIssues) {
      console.log(`\n✨ All translations are in sync!`);
    }
    
    console.log(`💾 Results saved to: ${options.outputFile}`);
    
    return {
      success: true,
      stats: {
        usedKeysCount: result.usedKeys.length,
        languages: result.languages,
        hasMissingKeys: result.missingKeysByLanguage.size > 0,
        hasUnusedKeys: result.unusedKeysByLanguage.size > 0,
        outputFile: options.outputFile
      }
    };
  } catch (error) {
    console.error('❌ Error validating translations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
