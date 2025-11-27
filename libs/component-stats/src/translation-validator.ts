import * as fs from 'fs';
import * as path from 'path';

export interface TranslationFile {
  language: string;
  filePath: string;
  keys: Set<string>;
}

export interface TranslationValidationResult {
  usedKeys: string[];
  missingKeysByLanguage: Map<string, string[]>;
  unusedKeysByLanguage: Map<string, string[]>;
  languages: string[];
}

/**
 * Extract language code from translation filename
 * Supports patterns like: en.json, _en.json, something_en.json, en-US.json
 */
export function extractLanguageFromFilename(filename: string): string | null {
  // Remove .json extension
  const baseName = filename.replace(/\.json$/i, '');
  
  // Pattern 1: _en.json or en.json
  const simpleMatch = baseName.match(/^_?([a-z]{2}(?:-[A-Z]{2})?)$/i);
  if (simpleMatch) {
    return simpleMatch[1].toLowerCase();
  }
  
  // Pattern 2: something_en.json or something-en.json
  const suffixMatch = baseName.match(/[_-]([a-z]{2}(?:-[A-Z]{2})?)$/i);
  if (suffixMatch) {
    return suffixMatch[1].toLowerCase();
  }
  
  return null;
}

/**
 * Recursively extract all keys from a nested translation object
 */
function extractKeysFromObject(obj: Record<string, unknown>, prefix = ''): Set<string> {
  const keys = new Set<string>();
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // Recursive case: nested object
      const nestedKeys = extractKeysFromObject(obj[key] as Record<string, unknown>, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      // Base case: leaf node
      keys.add(fullKey);
    }
  }
  
  return keys;
}

/**
 * Read all translation files from a directory
 */
export function readTranslationFiles(translationsPath: string): TranslationFile[] {
  const translationFiles: TranslationFile[] = [];
  
  if (!fs.existsSync(translationsPath)) {
    throw new Error(`Translations path does not exist: ${translationsPath}`);
  }
  
  const files = fs.readdirSync(translationsPath);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  for (const file of jsonFiles) {
    const language = extractLanguageFromFilename(file);
    
    if (!language) {
      console.warn(`Skipping file with unrecognized language pattern: ${file}`);
      continue;
    }
    
    const filePath = path.join(translationsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    try {
      const data = JSON.parse(content);
      const keys = extractKeysFromObject(data);
      
      translationFiles.push({
        language,
        filePath,
        keys
      });
    } catch (error) {
      console.error(`Error parsing JSON file ${file}:`, error);
    }
  }
  
  return translationFiles;
}

/**
 * Validate translation coverage
 */
export function validateTranslationCoverage(
  usedKeys: string[],
  translationFiles: TranslationFile[]
): TranslationValidationResult {
  const usedKeySet = new Set(usedKeys);
  const missingKeysByLanguage = new Map<string, string[]>();
  const unusedKeysByLanguage = new Map<string, string[]>();
  const languages = translationFiles.map(tf => tf.language);
  
  // Check each language file
  for (const translationFile of translationFiles) {
    const missingKeys: string[] = [];
    const unusedKeys: string[] = [];
    
    // Find missing keys (used in code but not in translation file)
    for (const usedKey of usedKeySet) {
      if (!translationFile.keys.has(usedKey)) {
        missingKeys.push(usedKey);
      }
    }
    
    // Find unused keys (in translation file but not used in code)
    for (const translationKey of translationFile.keys) {
      if (!usedKeySet.has(translationKey)) {
        unusedKeys.push(translationKey);
      }
    }
    
    if (missingKeys.length > 0) {
      missingKeysByLanguage.set(translationFile.language, missingKeys.sort());
    }
    
    if (unusedKeys.length > 0) {
      unusedKeysByLanguage.set(translationFile.language, unusedKeys.sort());
    }
  }
  
  return {
    usedKeys: Array.from(usedKeySet).sort(),
    missingKeysByLanguage,
    unusedKeysByLanguage,
    languages
  };
}
