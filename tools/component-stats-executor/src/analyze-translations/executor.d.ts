import { ExecutorContext } from '@nx/devkit';
export interface AnalyzeTranslationsExecutorSchema {
    projectPath: string;
    outputFile: string;
    tsconfigPath?: string;
}
export default function runExecutor(options: AnalyzeTranslationsExecutorSchema, context: ExecutorContext): Promise<{
    success: boolean;
    stats: {
        totalTranslations: any;
        outputFile: string;
    };
    error?: undefined;
} | {
    success: boolean;
    error: string;
    stats?: undefined;
}>;
