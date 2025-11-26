"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCSV = exports.generateReport = exports.findUsedBy = exports.getTopComponents = exports.groupBySource = exports.getLocalComponents = exports.getLibraryComponents = exports.getUnusedComponents = exports.filterByMinUsage = exports.AngularComponentAnalyzer = exports.analyzeTranslatePipes = exports.analyzeComponents = void 0;
var analyzer_v3_1 = require("./analyzer-v3");
Object.defineProperty(exports, "analyzeComponents", { enumerable: true, get: function () { return analyzer_v3_1.analyzeComponents; } });
Object.defineProperty(exports, "analyzeTranslatePipes", { enumerable: true, get: function () { return analyzer_v3_1.analyzeTranslatePipes; } });
Object.defineProperty(exports, "AngularComponentAnalyzer", { enumerable: true, get: function () { return analyzer_v3_1.AngularComponentAnalyzer; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "filterByMinUsage", { enumerable: true, get: function () { return utils_1.filterByMinUsage; } });
Object.defineProperty(exports, "getUnusedComponents", { enumerable: true, get: function () { return utils_1.getUnusedComponents; } });
Object.defineProperty(exports, "getLibraryComponents", { enumerable: true, get: function () { return utils_1.getLibraryComponents; } });
Object.defineProperty(exports, "getLocalComponents", { enumerable: true, get: function () { return utils_1.getLocalComponents; } });
Object.defineProperty(exports, "groupBySource", { enumerable: true, get: function () { return utils_1.groupBySource; } });
Object.defineProperty(exports, "getTopComponents", { enumerable: true, get: function () { return utils_1.getTopComponents; } });
Object.defineProperty(exports, "findUsedBy", { enumerable: true, get: function () { return utils_1.findUsedBy; } });
Object.defineProperty(exports, "generateReport", { enumerable: true, get: function () { return utils_1.generateReport; } });
Object.defineProperty(exports, "toCSV", { enumerable: true, get: function () { return utils_1.toCSV; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBbUc7QUFBMUYsZ0hBQUEsaUJBQWlCLE9BQUE7QUFBRSxvSEFBQSxxQkFBcUIsT0FBQTtBQUFFLHVIQUFBLHdCQUF3QixPQUFBO0FBRTNFLGlDQVVpQjtBQVRmLHlHQUFBLGdCQUFnQixPQUFBO0FBQ2hCLDRHQUFBLG1CQUFtQixPQUFBO0FBQ25CLDZHQUFBLG9CQUFvQixPQUFBO0FBQ3BCLDJHQUFBLGtCQUFrQixPQUFBO0FBQ2xCLHNHQUFBLGFBQWEsT0FBQTtBQUNiLHlHQUFBLGdCQUFnQixPQUFBO0FBQ2hCLG1HQUFBLFVBQVUsT0FBQTtBQUNWLHVHQUFBLGNBQWMsT0FBQTtBQUNkLDhGQUFBLEtBQUssT0FBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB7IGFuYWx5emVDb21wb25lbnRzLCBhbmFseXplVHJhbnNsYXRlUGlwZXMsIEFuZ3VsYXJDb21wb25lbnRBbmFseXplciB9IGZyb20gJy4vYW5hbHl6ZXItdjMnO1xuZXhwb3J0IHsgQ29tcG9uZW50U3RhdHMsIEFuYWx5emVyT3B0aW9ucywgVHJhbnNsYXRlUGlwZVVzYWdlIH0gZnJvbSAnLi90eXBlcyc7XG5leHBvcnQge1xuICBmaWx0ZXJCeU1pblVzYWdlLFxuICBnZXRVbnVzZWRDb21wb25lbnRzLFxuICBnZXRMaWJyYXJ5Q29tcG9uZW50cyxcbiAgZ2V0TG9jYWxDb21wb25lbnRzLFxuICBncm91cEJ5U291cmNlLFxuICBnZXRUb3BDb21wb25lbnRzLFxuICBmaW5kVXNlZEJ5LFxuICBnZW5lcmF0ZVJlcG9ydCxcbiAgdG9DU1Zcbn0gZnJvbSAnLi91dGlscyc7XG4iXX0=