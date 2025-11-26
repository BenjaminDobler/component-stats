import { ComponentStats } from './types';
/**
 * Filter components by minimum usage count
 */
export declare function filterByMinUsage(stats: ComponentStats[], minCount: number): ComponentStats[];
/**
 * Get only unused components
 */
export declare function getUnusedComponents(stats: ComponentStats[]): ComponentStats[];
/**
 * Get components from external libraries (node_modules)
 */
export declare function getLibraryComponents(stats: ComponentStats[]): ComponentStats[];
/**
 * Get local project components
 */
export declare function getLocalComponents(stats: ComponentStats[]): ComponentStats[];
/**
 * Group components by source (library or path)
 */
export declare function groupBySource(stats: ComponentStats[]): Map<string, ComponentStats[]>;
/**
 * Get top N most used components
 */
export declare function getTopComponents(stats: ComponentStats[], limit?: number): ComponentStats[];
/**
 * Find components used by a specific component
 */
export declare function findUsedBy(stats: ComponentStats[], componentClass: string): ComponentStats[];
/**
 * Generate a simple text report
 */
export declare function generateReport(stats: ComponentStats[]): string;
/**
 * Export to CSV format
 */
export declare function toCSV(stats: ComponentStats[]): string;
