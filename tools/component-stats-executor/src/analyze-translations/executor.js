"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = runExecutor;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
async function runExecutor(options, context) {
    const workspaceRoot = context.root;
    console.log('🌍 Analyzing translate pipe usage...');
    console.log(`📁 Project: ${options.projectPath}`);
    try {
        // Import from the built library
        const libPath = path.join(workspaceRoot, 'dist', 'libs', 'component-stats', 'src', 'index.js');
        const { analyzeTranslatePipes } = require(libPath);
        const absoluteProjectPath = path.resolve(workspaceRoot, options.projectPath);
        const absoluteOutputFile = path.resolve(workspaceRoot, options.outputFile);
        // Build analyzer options
        const analyzerOptions = {
            projectPath: absoluteProjectPath,
        };
        if (options.tsconfigPath) {
            analyzerOptions.tsconfigPath = path.resolve(workspaceRoot, options.tsconfigPath);
        }
        // Run the analysis
        const translations = await analyzeTranslatePipes(analyzerOptions);
        // Ensure output directory exists
        const outputDir = path.dirname(absoluteOutputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Write results to file
        fs.writeFileSync(absoluteOutputFile, JSON.stringify(translations, null, 2), 'utf-8');
        console.log(`✅ Analysis complete!`);
        console.log(`🔤 Found ${translations.length} translation keys`);
        console.log(`💾 Results saved to: ${options.outputFile}`);
        return {
            success: true,
            stats: {
                totalTranslations: translations.length,
                outputFile: options.outputFile
            }
        };
    }
    catch (error) {
        console.error('❌ Error analyzing translations:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVBLDhCQStEQztBQXhFRCwyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBUVYsS0FBSyxVQUFVLFdBQVcsQ0FDdkMsT0FBMEMsRUFDMUMsT0FBd0I7SUFFeEIsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztJQUVuQyxPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7SUFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBRWxELElBQUksQ0FBQztRQUNILGdDQUFnQztRQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvRixNQUFNLEVBQUUscUJBQXFCLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbkQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0UsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFM0UseUJBQXlCO1FBQ3pCLE1BQU0sZUFBZSxHQUFtRDtZQUN0RSxXQUFXLEVBQUUsbUJBQW1CO1NBQ2pDLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6QixlQUFlLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQ3pDLGFBQWEsRUFDYixPQUFPLENBQUMsWUFBWSxDQUNyQixDQUFDO1FBQ0osQ0FBQztRQUVELG1CQUFtQjtRQUNuQixNQUFNLFlBQVksR0FBRyxNQUFNLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRWxFLGlDQUFpQztRQUNqQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUM5QixFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsRUFBRSxDQUFDLGFBQWEsQ0FDZCxrQkFBa0IsRUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUNyQyxPQUFPLENBQ1IsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksWUFBWSxDQUFDLE1BQU0sbUJBQW1CLENBQUMsQ0FBQztRQUNoRSxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUUxRCxPQUFPO1lBQ0wsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUU7Z0JBQ0wsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLE1BQU07Z0JBQ3RDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTthQUMvQjtTQUNGLENBQUM7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEQsT0FBTztZQUNMLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDOUQsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXhlY3V0b3JDb250ZXh0IH0gZnJvbSAnQG54L2RldmtpdCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5emVUcmFuc2xhdGlvbnNFeGVjdXRvclNjaGVtYSB7XG4gIHByb2plY3RQYXRoOiBzdHJpbmc7XG4gIG91dHB1dEZpbGU6IHN0cmluZztcbiAgdHNjb25maWdQYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBydW5FeGVjdXRvcihcbiAgb3B0aW9uczogQW5hbHl6ZVRyYW5zbGF0aW9uc0V4ZWN1dG9yU2NoZW1hLFxuICBjb250ZXh0OiBFeGVjdXRvckNvbnRleHRcbikge1xuICBjb25zdCB3b3Jrc3BhY2VSb290ID0gY29udGV4dC5yb290O1xuICBcbiAgY29uc29sZS5sb2coJ/CfjI0gQW5hbHl6aW5nIHRyYW5zbGF0ZSBwaXBlIHVzYWdlLi4uJyk7XG4gIGNvbnNvbGUubG9nKGDwn5OBIFByb2plY3Q6ICR7b3B0aW9ucy5wcm9qZWN0UGF0aH1gKTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gSW1wb3J0IGZyb20gdGhlIGJ1aWx0IGxpYnJhcnlcbiAgICBjb25zdCBsaWJQYXRoID0gcGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsICdkaXN0JywgJ2xpYnMnLCAnY29tcG9uZW50LXN0YXRzJywgJ3NyYycsICdpbmRleC5qcycpO1xuICAgIGNvbnN0IHsgYW5hbHl6ZVRyYW5zbGF0ZVBpcGVzIH0gPSByZXF1aXJlKGxpYlBhdGgpO1xuICAgIFxuICAgIGNvbnN0IGFic29sdXRlUHJvamVjdFBhdGggPSBwYXRoLnJlc29sdmUod29ya3NwYWNlUm9vdCwgb3B0aW9ucy5wcm9qZWN0UGF0aCk7XG4gICAgY29uc3QgYWJzb2x1dGVPdXRwdXRGaWxlID0gcGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIG9wdGlvbnMub3V0cHV0RmlsZSk7XG4gICAgXG4gICAgLy8gQnVpbGQgYW5hbHl6ZXIgb3B0aW9uc1xuICAgIGNvbnN0IGFuYWx5emVyT3B0aW9uczogeyBwcm9qZWN0UGF0aDogc3RyaW5nOyB0c2NvbmZpZ1BhdGg/OiBzdHJpbmcgfSA9IHtcbiAgICAgIHByb2plY3RQYXRoOiBhYnNvbHV0ZVByb2plY3RQYXRoLFxuICAgIH07XG4gICAgXG4gICAgaWYgKG9wdGlvbnMudHNjb25maWdQYXRoKSB7XG4gICAgICBhbmFseXplck9wdGlvbnMudHNjb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKFxuICAgICAgICB3b3Jrc3BhY2VSb290LFxuICAgICAgICBvcHRpb25zLnRzY29uZmlnUGF0aFxuICAgICAgKTtcbiAgICB9XG4gICAgXG4gICAgLy8gUnVuIHRoZSBhbmFseXNpc1xuICAgIGNvbnN0IHRyYW5zbGF0aW9ucyA9IGF3YWl0IGFuYWx5emVUcmFuc2xhdGVQaXBlcyhhbmFseXplck9wdGlvbnMpO1xuICAgIFxuICAgIC8vIEVuc3VyZSBvdXRwdXQgZGlyZWN0b3J5IGV4aXN0c1xuICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGguZGlybmFtZShhYnNvbHV0ZU91dHB1dEZpbGUpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXIpKSB7XG4gICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gV3JpdGUgcmVzdWx0cyB0byBmaWxlXG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIGFic29sdXRlT3V0cHV0RmlsZSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHRyYW5zbGF0aW9ucywgbnVsbCwgMiksXG4gICAgICAndXRmLTgnXG4gICAgKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhg4pyFIEFuYWx5c2lzIGNvbXBsZXRlIWApO1xuICAgIGNvbnNvbGUubG9nKGDwn5SkIEZvdW5kICR7dHJhbnNsYXRpb25zLmxlbmd0aH0gdHJhbnNsYXRpb24ga2V5c2ApO1xuICAgIGNvbnNvbGUubG9nKGDwn5K+IFJlc3VsdHMgc2F2ZWQgdG86ICR7b3B0aW9ucy5vdXRwdXRGaWxlfWApO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgc3RhdHM6IHtcbiAgICAgICAgdG90YWxUcmFuc2xhdGlvbnM6IHRyYW5zbGF0aW9ucy5sZW5ndGgsXG4gICAgICAgIG91dHB1dEZpbGU6IG9wdGlvbnMub3V0cHV0RmlsZVxuICAgICAgfVxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIEVycm9yIGFuYWx5emluZyB0cmFuc2xhdGlvbnM6JywgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICB9O1xuICB9XG59XG4iXX0=