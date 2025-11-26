export { analyzeComponents, analyzeTranslatePipes, AngularComponentAnalyzer } from './analyzer-v3';
export { ComponentStats, AnalyzerOptions, TranslatePipeUsage } from './types';
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
