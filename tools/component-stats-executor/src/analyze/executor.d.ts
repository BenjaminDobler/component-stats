import { ExecutorContext } from '@nx/devkit';
export interface AnalyzeExecutorSchema {
    projectPath: string;
    outputFile: string;
    tsconfigPath?: string;
    minUsage?: number;
    includeUnused?: boolean;
}
export default function runExecutor(options: AnalyzeExecutorSchema, context: ExecutorContext): Promise<{
    success: boolean;
    stats: {
        totalComponents: number;
        usedComponents: number;
        unusedComponents: number;
        outputFile: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    stats?: undefined;
}>;
