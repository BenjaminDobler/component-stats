import { ComponentStats } from './types';

/**
 * Filter components by minimum usage count
 */
export function filterByMinUsage(stats: ComponentStats[], minCount: number): ComponentStats[] {
  return stats.filter(c => c.count >= minCount);
}

/**
 * Get only unused components
 */
export function getUnusedComponents(stats: ComponentStats[]): ComponentStats[] {
  return stats.filter(c => c.count === 0);
}

/**
 * Get components from external libraries (node_modules)
 */
export function getLibraryComponents(stats: ComponentStats[]): ComponentStats[] {
  return stats.filter(c => c.source.includes('node_modules') || c.source.startsWith('@'));
}

/**
 * Get local project components
 */
export function getLocalComponents(stats: ComponentStats[]): ComponentStats[] {
  return stats.filter(c => !c.source.includes('node_modules') && !c.source.startsWith('@'));
}

/**
 * Group components by source (library or path)
 */
export function groupBySource(stats: ComponentStats[]): Map<string, ComponentStats[]> {
  const grouped = new Map<string, ComponentStats[]>();
  
  for (const stat of stats) {
    const source = stat.source;
    if (!grouped.has(source)) {
      grouped.set(source, []);
    }
    grouped.get(source)!.push(stat);
  }
  
  return grouped;
}

/**
 * Get top N most used components
 */
export function getTopComponents(stats: ComponentStats[], limit: number = 10): ComponentStats[] {
  return stats
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Find components used by a specific component
 */
export function findUsedBy(stats: ComponentStats[], componentClass: string): ComponentStats[] {
  return stats.filter(c => c.usedIn.includes(componentClass));
}

/**
 * Generate a simple text report
 */
export function generateReport(stats: ComponentStats[]): string {
  const lines: string[] = [];
  
  lines.push('Angular Component Usage Report');
  lines.push('==============================\n');
  
  const totalComponents = stats.length;
  const usedComponents = stats.filter(c => c.count > 0).length;
  const unusedComponents = stats.filter(c => c.count === 0).length;
  const totalUsages = stats.reduce((sum, c) => sum + c.count, 0);
  
  lines.push('Summary:');
  lines.push(`  Total components: ${totalComponents}`);
  lines.push(`  Used components: ${usedComponents}`);
  lines.push(`  Unused components: ${unusedComponents}`);
  lines.push(`  Total usages: ${totalUsages}`);
  lines.push('');
  
  const topComponents = getTopComponents(stats, 5);
  if (topComponents.length > 0) {
    lines.push('Top 5 Most Used Components:');
    topComponents.forEach((c, i) => {
      lines.push(`  ${i + 1}. ${c.componentClass} - ${c.count} usage(s)`);
    });
    lines.push('');
  }
  
  const unused = getUnusedComponents(stats);
  if (unused.length > 0) {
    lines.push(`Unused Components (${unused.length}):`);
    unused.slice(0, 10).forEach(c => {
      lines.push(`  - ${c.componentClass} (${c.source})`);
    });
    if (unused.length > 10) {
      lines.push(`  ... and ${unused.length - 10} more`);
    }
    lines.push('');
  }
  
  const libraryComponents = getLibraryComponents(stats);
  if (libraryComponents.length > 0) {
    lines.push(`Library Components (${libraryComponents.length}):`);
    const byLib = groupBySource(libraryComponents);
    for (const [lib, components] of byLib) {
      const totalLibUsage = components.reduce((sum, c) => sum + c.count, 0);
      lines.push(`  ${lib}: ${components.length} component(s), ${totalLibUsage} usage(s)`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Export to CSV format
 */
export function toCSV(stats: ComponentStats[]): string {
  const lines: string[] = [];
  lines.push('Component Class,Source,Usage Count,Used In');
  
  for (const stat of stats) {
    const usedIn = stat.usedIn.join('; ');
    lines.push(`"${stat.componentClass}","${stat.source}",${stat.count},"${usedIn}"`);
  }
  
  return lines.join('\n');
}
