import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ResultsWebviewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private extensionPath: string;
  private currentResults: any = null;

  constructor(extensionPath: string) {
    console.log('ResultsWebviewProvider constructor called with extensionPath:', extensionPath);
    if (!extensionPath) {
      throw new Error('extensionPath is required but was undefined');
    }
    this.extensionPath = extensionPath;
  }

  public show(results: any, title: string = 'Component Stats Results') {
    this.currentResults = results;

    if (this.panel) {
      // Panel already exists, just reveal it and update data
      this.panel.reveal(vscode.ViewColumn.One);
      this.panel.webview.postMessage(results);
      return;
    }

    // Create new panel
    this.panel = vscode.window.createWebviewPanel(
      'componentStatsResults',
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.extensionPath, 'webview'))
        ]
      }
    );

    // Set HTML content
    this.panel.webview.html = this.getWebviewContent(this.panel.webview);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      message => this.handleWebviewMessage(message),
      undefined,
      []
    );

    // Clean up when panel is closed
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      undefined,
      []
    );

    // Send initial data after a short delay to ensure webview is ready
    setTimeout(() => {
      this.panel?.webview.postMessage(results);
    }, 100);
  }

  private async handleWebviewMessage(message: any) {
    switch (message.command) {
      case 'openFile':
        await this.openFile(message.filePath, message.line);
        break;

      case 'createTranslationKey':
        await this.createTranslationKey(message.language, message.key, message.value);
        break;

      case 'openTranslationFile':
        await this.openTranslationFile(message.language, message.key);
        break;

      case 'exportResults':
        await this.exportResults(message.format);
        break;

      default:
        console.warn('Unknown command from webview:', message.command);
    }
  }

  private async openFile(filePath: string, line?: number) {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(document);

      if (line !== undefined) {
        const position = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
    }
  }

  private async createTranslationKey(language: string, key: string, value: string) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const config = vscode.workspace.getConfiguration('componentStats');
    const translationsPath = config.get<string>('translationsPath', 'src/assets/i18n');
    
    const translationFilePath = path.join(
      workspaceFolder.uri.fsPath,
      translationsPath,
      `${language}.json`
    );

    try {
      // Read existing file
      const content = fs.readFileSync(translationFilePath, 'utf-8');
      const translations = JSON.parse(content);

      // Add new key (handle nested keys)
      const keyParts = key.split('.');
      let current = translations;
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!current[keyParts[i]]) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      current[keyParts[keyParts.length - 1]] = value || `TODO: Add translation for ${key}`;

      // Write back
      fs.writeFileSync(translationFilePath, JSON.stringify(translations, null, 2), 'utf-8');

      vscode.window.showInformationMessage(`Created key "${key}" in ${language}.json`);

      // Open the file
      await this.openFile(translationFilePath);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create translation key: ${error}`);
    }
  }

  private async openTranslationFile(language: string, key: string) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const config = vscode.workspace.getConfiguration('componentStats');
    const translationsPath = config.get<string>('translationsPath', 'src/assets/i18n');
    
    const translationFilePath = path.join(
      workspaceFolder.uri.fsPath,
      translationsPath,
      `${language}.json`
    );

    try {
      const content = fs.readFileSync(translationFilePath, 'utf-8');
      const lines = content.split('\n');
      
      // Find the line with the key
      const keyToFind = `"${key.split('.').pop()}"`;
      const lineIndex = lines.findIndex(line => line.includes(keyToFind));

      await this.openFile(translationFilePath, lineIndex >= 0 ? lineIndex : undefined);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open translation file: ${error}`);
    }
  }

  private async exportResults(format: 'json' | 'csv') {
    if (!this.currentResults) return;

    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`component-stats-results.${format}`),
      filters: {
        'JSON': ['json'],
        'CSV': ['csv']
      }
    });

    if (uri) {
      try {
        let content: string;
        if (format === 'json') {
          content = JSON.stringify(this.currentResults.data, null, 2);
        } else {
          // Simple CSV export
          content = 'Not implemented yet';
        }
        fs.writeFileSync(uri.fsPath, content, 'utf-8');
        vscode.window.showInformationMessage(`Results exported to ${uri.fsPath}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to export results: ${error}`);
      }
    }
  }

  private getWebviewContent(webview: vscode.Webview): string {
    // Path to Angular built files
    const webviewPath = path.join(this.extensionPath, 'webview');
    const indexPath = path.join(webviewPath, 'index.html');

    // Check if built Angular app exists
    if (fs.existsSync(indexPath)) {
      // Load the Angular app's index.html
      let html = fs.readFileSync(indexPath, 'utf-8');

      // Replace script/style src with webview URIs
      const scriptRegex = /<script\s+[^>]*src="([^"]+)"[^>]*><\/script>/g;
      const styleRegex = /<link\s+[^>]*href="([^"]+)"[^>]*>/g;

      html = html.replace(scriptRegex, (match, src) => {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, src)));
        return match.replace(src, scriptUri.toString());
      });

      html = html.replace(styleRegex, (match, href) => {
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, href)));
        return match.replace(href, styleUri.toString());
      });

      // Add CSP meta tag
      const cspContent = `
        default-src 'none'; 
        style-src ${webview.cspSource} 'unsafe-inline'; 
        script-src ${webview.cspSource}; 
        img-src ${webview.cspSource} https: data:;
        font-src ${webview.cspSource};
      `;
      html = html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${cspContent}"></head>`);

      return html;
    }

    // Fallback simple HTML if Angular app not built
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Component Stats</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          padding: 20px;
        }
        .error {
          color: var(--vscode-errorForeground);
          background: var(--vscode-inputValidation-errorBackground);
          padding: 12px;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="error">
        <h2>Webview UI Not Built</h2>
        <p>The Angular webview UI needs to be built first.</p>
        <p>Run: <code>nx build vscode-extension-ui</code></p>
      </div>
    </body>
    </html>`;
  }
}
