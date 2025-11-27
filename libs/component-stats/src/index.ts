export { analyzeComponents, analyzeTranslatePipes, validateTranslations, AngularComponentAnalyzer } from './analyzer-v3';
export { ComponentStats, AnalyzerOptions, TranslatePipeUsage } from './types';
export { TranslationValidationResult } from './translation-validator';
export {
  filterByMinUsage,
  getUnusedComponents,
  getLibraryComponents,
  getLocalComponents,
  groupBySource,
  getTopComponents,
  findUsedBy,
  generateReport,
  toCSV
} from './utils';
