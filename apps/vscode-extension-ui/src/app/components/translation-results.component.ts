import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VscodeApiService } from '../services/vscode-api.service';

interface LanguageStats {
  language: string;
  missingCount: number;
  unusedCount: number;
  missingKeys: string[];
  unusedKeys: string[];
}

@Component({
  selector: 'app-translation-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="results-container">
      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Waiting for analysis results...</p>
        </div>
      }

      @if (!loading && results) {
        <div class="header">
          <h2>Translation Validation Results</h2>
          <div class="stats-summary">
            <div class="stat">
              <span class="label">Total Keys:</span>
              <span class="value">{{ results.usedKeys.length }}</span>
            </div>
            <div class="stat">
              <span class="label">Languages:</span>
              <span class="value">{{ results.languages.length }}</span>
            </div>
          </div>
          <button class="export-btn" (click)="exportResults()">
            Export JSON
          </button>
        </div>

        <div class="filter-bar">
          <input 
            type="text" 
            placeholder="Filter keys..." 
            [(ngModel)]="filterText"
            (input)="applyFilter()"
            class="filter-input"
          />
          <select [(ngModel)]="selectedView" (change)="applyFilter()" class="view-select">
            <option value="all">All Issues</option>
            <option value="missing">Missing Only</option>
            <option value="unused">Unused Only</option>
          </select>
        </div>

        <div class="languages-grid">
          @for (langStat of filteredLanguageStats; track langStat.language) {
            <div class="language-card">
              <div class="language-header">
                <h3>{{ langStat.language }}</h3>
                <div class="badges">
                  @if (langStat.missingCount > 0) {
                    <span class="badge missing">{{ langStat.missingCount }} missing</span>
                  }
                  @if (langStat.unusedCount > 0) {
                    <span class="badge unused">{{ langStat.unusedCount }} unused</span>
                  }
                  @if (langStat.missingCount === 0 && langStat.unusedCount === 0) {
                    <span class="badge success">✓ In sync</span>
                  }
                </div>
              </div>

              @if (langStat.missingCount > 0 && (selectedView === 'all' || selectedView === 'missing')) {
                <div class="keys-section">
                  <h4>Missing Keys</h4>
                  <ul class="keys-list missing-list">
                    @for (key of langStat.missingKeys; track key) {
                      <li>
                        <span class="key-name">{{ key }}</span>
                        <button 
                          class="action-btn" 
                          (click)="createKey(langStat.language, key)"
                          title="Create this key in translation file"
                        >
                          + Create
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }

              @if (langStat.unusedCount > 0 && (selectedView === 'all' || selectedView === 'unused')) {
                <div class="keys-section">
                  <h4>Unused Keys</h4>
                  <ul class="keys-list unused-list">
                    @for (key of langStat.unusedKeys.slice(0, showAllUnused[langStat.language] ? undefined : 10); track key) {
                      <li>
                        <span class="key-name">{{ key }}</span>
                        <button 
                          class="action-btn view-btn" 
                          (click)="openTranslationFile(langStat.language, key)"
                          title="Open in translation file"
                        >
                          View
                        </button>
                      </li>
                    }
                  </ul>
                  @if (langStat.unusedKeys.length > 10 && !showAllUnused[langStat.language]) {
                    <button class="show-more-btn" (click)="toggleShowAll(langStat.language)">
                      Show {{ langStat.unusedKeys.length - 10 }} more...
                    </button>
                  }
                  @if (showAllUnused[langStat.language]) {
                    <button class="show-more-btn" (click)="toggleShowAll(langStat.language)">
                      Show less
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .results-container {
      padding: 20px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--vscode-progressBar-background);
      border-top-color: var(--vscode-button-background);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .stats-summary {
      display: flex;
      gap: 24px;
    }

    .stat {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .stat .label {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }

    .stat .value {
      font-weight: 600;
      font-size: 18px;
      color: var(--vscode-textLink-foreground);
    }

    .export-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .export-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .filter-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .filter-input,
    .view-select {
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
    }

    .filter-input {
      flex: 1;
    }

    .view-select {
      min-width: 150px;
    }

    .languages-grid {
      display: grid;
      gap: 24px;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    }

    .language-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 16px;
    }

    .language-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .language-header h3 {
      margin: 0;
      font-size: 18px;
      text-transform: uppercase;
    }

    .badges {
      display: flex;
      gap: 8px;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge.missing {
      background: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
    }

    .badge.unused {
      background: var(--vscode-inputValidation-warningBackground);
      color: var(--vscode-inputValidation-warningForeground);
    }

    .badge.success {
      background: var(--vscode-testing-iconPassed);
      color: white;
    }

    .keys-section {
      margin-bottom: 16px;
    }

    .keys-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .keys-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .keys-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin-bottom: 4px;
      background: var(--vscode-list-hoverBackground);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 13px;
    }

    .keys-list li:hover {
      background: var(--vscode-list-activeSelectionBackground);
    }

    .key-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .action-btn {
      background: transparent;
      color: var(--vscode-button-background);
      border: 1px solid var(--vscode-button-background);
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
    }

    .action-btn:hover {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .view-btn {
      color: var(--vscode-textLink-foreground);
      border-color: var(--vscode-textLink-foreground);
    }

    .view-btn:hover {
      background: var(--vscode-textLink-foreground);
      color: white;
    }

    .show-more-btn {
      background: transparent;
      color: var(--vscode-textLink-foreground);
      border: none;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      width: 100%;
      text-align: center;
      margin-top: 8px;
    }

    .show-more-btn:hover {
      text-decoration: underline;
    }
  `]
})
export class TranslationResultsComponent implements OnInit {
  results: any = null;
  loading = true;
  filterText = '';
  selectedView: 'all' | 'missing' | 'unused' = 'all';
  languageStats: LanguageStats[] = [];
  filteredLanguageStats: LanguageStats[] = [];
  showAllUnused: Record<string, boolean> = {};

  constructor(private vscodeApi: VscodeApiService) {}

  ngOnInit() {
    this.vscodeApi.validationResults$.subscribe(results => {
      if (results) {
        this.results = results;
        this.loading = false;
        this.processResults();
      }
    });
  }

  processResults() {
    this.languageStats = this.results.languages.map((lang: string) => ({
      language: lang,
      missingKeys: this.results.missingKeysByLanguage[lang] || [],
      unusedKeys: this.results.unusedKeysByLanguage[lang] || [],
      missingCount: (this.results.missingKeysByLanguage[lang] || []).length,
      unusedCount: (this.results.unusedKeysByLanguage[lang] || []).length
    }));
    this.applyFilter();
  }

  applyFilter() {
    let filtered = this.languageStats;

    // Filter by view
    if (this.selectedView === 'missing') {
      filtered = filtered.map(stat => ({
        ...stat,
        unusedKeys: [],
        unusedCount: 0
      })).filter(stat => stat.missingCount > 0);
    } else if (this.selectedView === 'unused') {
      filtered = filtered.map(stat => ({
        ...stat,
        missingKeys: [],
        missingCount: 0
      })).filter(stat => stat.unusedCount > 0);
    }

    // Filter by text
    if (this.filterText) {
      const searchText = this.filterText.toLowerCase();
      filtered = filtered.map(stat => ({
        ...stat,
        missingKeys: stat.missingKeys.filter(k => k.toLowerCase().includes(searchText)),
        unusedKeys: stat.unusedKeys.filter(k => k.toLowerCase().includes(searchText)),
        missingCount: stat.missingKeys.filter(k => k.toLowerCase().includes(searchText)).length,
        unusedCount: stat.unusedKeys.filter(k => k.toLowerCase().includes(searchText)).length
      })).filter(stat => stat.missingCount > 0 || stat.unusedCount > 0);
    }

    this.filteredLanguageStats = filtered;
  }

  exportResults() {
    this.vscodeApi.exportResults('json');
  }

  createKey(language: string, key: string) {
    this.vscodeApi.createTranslationKey(language, key, '');
  }

  openTranslationFile(language: string, key: string) {
    // This will be handled by extension to determine the file path
    this.vscodeApi.postMessage({
      command: 'openTranslationFile',
      language,
      key
    } as any);
  }

  toggleShowAll(language: string) {
    this.showAllUnused[language] = !this.showAllUnused[language];
  }
}
