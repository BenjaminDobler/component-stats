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
    console.log('🔍 Analyzing Angular component usage...');
    console.log(`📁 Project: ${options.projectPath}`);
    try {
        // Import from the built library
        const libPath = path.join(workspaceRoot, 'dist', 'libs', 'component-stats', 'src', 'index.js');
        const { analyzeComponents, filterByMinUsage } = require(libPath);
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
        let stats = await analyzeComponents(analyzerOptions);
        // Apply filters
        if (options.minUsage && options.minUsage > 0) {
            stats = filterByMinUsage(stats, options.minUsage);
        }
        if (!options.includeUnused) {
            stats = stats.filter((s) => s.count > 0);
        }
        // Ensure output directory exists
        const outputDir = path.dirname(absoluteOutputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Write results to file
        fs.writeFileSync(absoluteOutputFile, JSON.stringify(stats, null, 2), 'utf-8');
        console.log(`✅ Analysis complete!`);
        console.log(`📊 Found ${stats.length} components`);
        console.log(`💾 Results saved to: ${options.outputFile}`);
        return {
            success: true,
            stats: {
                totalComponents: stats.length,
                usedComponents: stats.filter((s) => s.count > 0).length,
                unusedComponents: stats.filter((s) => s.count === 0).length,
                outputFile: options.outputFile
            }
        };
    }
    catch (error) {
        console.error('❌ Error analyzing components:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleGVjdXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CQSw4QkEwRUM7QUE1RkQsMkNBQTZCO0FBQzdCLHVDQUF5QjtBQWlCVixLQUFLLFVBQVUsV0FBVyxDQUN2QyxPQUE4QixFQUM5QixPQUF3QjtJQUV4QixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBRW5DLE9BQU8sQ0FBQyxHQUFHLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFFbEQsSUFBSSxDQUFDO1FBQ0gsZ0NBQWdDO1FBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQy9GLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVqRSxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3RSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzRSx5QkFBeUI7UUFDekIsTUFBTSxlQUFlLEdBQW1EO1lBQ3RFLFdBQVcsRUFBRSxtQkFBbUI7U0FDakMsQ0FBQztRQUVGLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3pCLGVBQWUsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FDekMsYUFBYSxFQUNiLE9BQU8sQ0FBQyxZQUFZLENBQ3JCLENBQUM7UUFDSixDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksS0FBSyxHQUFxQixNQUFNLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRXZFLGdCQUFnQjtRQUNoQixJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM3QyxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMzQixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELGlDQUFpQztRQUNqQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUM5QixFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsRUFBRSxDQUFDLGFBQWEsQ0FDZCxrQkFBa0IsRUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUM5QixPQUFPLENBQ1IsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksS0FBSyxDQUFDLE1BQU0sYUFBYSxDQUFDLENBQUM7UUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFMUQsT0FBTztZQUNMLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFO2dCQUNMLGVBQWUsRUFBRSxLQUFLLENBQUMsTUFBTTtnQkFDN0IsY0FBYyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQ3ZFLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQzNFLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTthQUMvQjtTQUNGLENBQUM7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEQsT0FBTztZQUNMLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDOUQsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXhlY3V0b3JDb250ZXh0IH0gZnJvbSAnQG54L2RldmtpdCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5emVFeGVjdXRvclNjaGVtYSB7XG4gIHByb2plY3RQYXRoOiBzdHJpbmc7XG4gIG91dHB1dEZpbGU6IHN0cmluZztcbiAgdHNjb25maWdQYXRoPzogc3RyaW5nO1xuICBtaW5Vc2FnZT86IG51bWJlcjtcbiAgaW5jbHVkZVVudXNlZD86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBDb21wb25lbnRTdGF0cyB7XG4gIG5hbWU6IHN0cmluZztcbiAgcGF0aDogc3RyaW5nO1xuICBjb3VudDogbnVtYmVyO1xuICBleHRlcm5hbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gcnVuRXhlY3V0b3IoXG4gIG9wdGlvbnM6IEFuYWx5emVFeGVjdXRvclNjaGVtYSxcbiAgY29udGV4dDogRXhlY3V0b3JDb250ZXh0XG4pIHtcbiAgY29uc3Qgd29ya3NwYWNlUm9vdCA9IGNvbnRleHQucm9vdDtcbiAgXG4gIGNvbnNvbGUubG9nKCfwn5SNIEFuYWx5emluZyBBbmd1bGFyIGNvbXBvbmVudCB1c2FnZS4uLicpO1xuICBjb25zb2xlLmxvZyhg8J+TgSBQcm9qZWN0OiAke29wdGlvbnMucHJvamVjdFBhdGh9YCk7XG4gIFxuICB0cnkge1xuICAgIC8vIEltcG9ydCBmcm9tIHRoZSBidWlsdCBsaWJyYXJ5XG4gICAgY29uc3QgbGliUGF0aCA9IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCAnZGlzdCcsICdsaWJzJywgJ2NvbXBvbmVudC1zdGF0cycsICdzcmMnLCAnaW5kZXguanMnKTtcbiAgICBjb25zdCB7IGFuYWx5emVDb21wb25lbnRzLCBmaWx0ZXJCeU1pblVzYWdlIH0gPSByZXF1aXJlKGxpYlBhdGgpO1xuICAgIFxuICAgIGNvbnN0IGFic29sdXRlUHJvamVjdFBhdGggPSBwYXRoLnJlc29sdmUod29ya3NwYWNlUm9vdCwgb3B0aW9ucy5wcm9qZWN0UGF0aCk7XG4gICAgY29uc3QgYWJzb2x1dGVPdXRwdXRGaWxlID0gcGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIG9wdGlvbnMub3V0cHV0RmlsZSk7XG4gICAgXG4gICAgLy8gQnVpbGQgYW5hbHl6ZXIgb3B0aW9uc1xuICAgIGNvbnN0IGFuYWx5emVyT3B0aW9uczogeyBwcm9qZWN0UGF0aDogc3RyaW5nOyB0c2NvbmZpZ1BhdGg/OiBzdHJpbmcgfSA9IHtcbiAgICAgIHByb2plY3RQYXRoOiBhYnNvbHV0ZVByb2plY3RQYXRoLFxuICAgIH07XG4gICAgXG4gICAgaWYgKG9wdGlvbnMudHNjb25maWdQYXRoKSB7XG4gICAgICBhbmFseXplck9wdGlvbnMudHNjb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKFxuICAgICAgICB3b3Jrc3BhY2VSb290LFxuICAgICAgICBvcHRpb25zLnRzY29uZmlnUGF0aFxuICAgICAgKTtcbiAgICB9XG4gICAgXG4gICAgLy8gUnVuIHRoZSBhbmFseXNpc1xuICAgIGxldCBzdGF0czogQ29tcG9uZW50U3RhdHNbXSA9IGF3YWl0IGFuYWx5emVDb21wb25lbnRzKGFuYWx5emVyT3B0aW9ucyk7XG4gICAgXG4gICAgLy8gQXBwbHkgZmlsdGVyc1xuICAgIGlmIChvcHRpb25zLm1pblVzYWdlICYmIG9wdGlvbnMubWluVXNhZ2UgPiAwKSB7XG4gICAgICBzdGF0cyA9IGZpbHRlckJ5TWluVXNhZ2Uoc3RhdHMsIG9wdGlvbnMubWluVXNhZ2UpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIW9wdGlvbnMuaW5jbHVkZVVudXNlZCkge1xuICAgICAgc3RhdHMgPSBzdGF0cy5maWx0ZXIoKHM6IENvbXBvbmVudFN0YXRzKSA9PiBzLmNvdW50ID4gMCk7XG4gICAgfVxuICAgIFxuICAgIC8vIEVuc3VyZSBvdXRwdXQgZGlyZWN0b3J5IGV4aXN0c1xuICAgIGNvbnN0IG91dHB1dERpciA9IHBhdGguZGlybmFtZShhYnNvbHV0ZU91dHB1dEZpbGUpO1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXREaXIpKSB7XG4gICAgICBmcy5ta2RpclN5bmMob3V0cHV0RGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gV3JpdGUgcmVzdWx0cyB0byBmaWxlXG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIGFic29sdXRlT3V0cHV0RmlsZSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHN0YXRzLCBudWxsLCAyKSxcbiAgICAgICd1dGYtOCdcbiAgICApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGDinIUgQW5hbHlzaXMgY29tcGxldGUhYCk7XG4gICAgY29uc29sZS5sb2coYPCfk4ogRm91bmQgJHtzdGF0cy5sZW5ndGh9IGNvbXBvbmVudHNgKTtcbiAgICBjb25zb2xlLmxvZyhg8J+SviBSZXN1bHRzIHNhdmVkIHRvOiAke29wdGlvbnMub3V0cHV0RmlsZX1gKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHN0YXRzOiB7XG4gICAgICAgIHRvdGFsQ29tcG9uZW50czogc3RhdHMubGVuZ3RoLFxuICAgICAgICB1c2VkQ29tcG9uZW50czogc3RhdHMuZmlsdGVyKChzOiBDb21wb25lbnRTdGF0cykgPT4gcy5jb3VudCA+IDApLmxlbmd0aCxcbiAgICAgICAgdW51c2VkQ29tcG9uZW50czogc3RhdHMuZmlsdGVyKChzOiBDb21wb25lbnRTdGF0cykgPT4gcy5jb3VudCA9PT0gMCkubGVuZ3RoLFxuICAgICAgICBvdXRwdXRGaWxlOiBvcHRpb25zLm91dHB1dEZpbGVcbiAgICAgIH1cbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBhbmFseXppbmcgY29tcG9uZW50czonLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgIH07XG4gIH1cbn1cbiJdfQ==