export interface ComponentStats {
  componentClass: string;
  usedIn: string[];
  count: number;
  source: string;
  external: boolean;
}

export interface TranslatePipeUsage {
  componentClass: string;
  translationKey: string;
  filePath: string;
}

export interface AnalyzerOptions {
  projectPath: string;
  tsconfigPath?: string;
}
