import * as vscode from 'vscode';
import * as path from 'path';
import { validateTranslations, analyzeComponents, ComponentStats, TranslationValidationResult } from '../../../libs/component-stats/src/index';
import { ResultsWebviewProvider } from './webview-provider';

let outputChannel: vscode.OutputChannel;
let webviewProvider: ResultsWebviewProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension activation started');
  console.log('context.extensionPath:', context.extensionPath);
  console.log('context.extensionUri:', context.extensionUri);
  
  outputChannel = vscode.window.createOutputChannel('Component Stats');
  outputChannel.appendLine('Component Stats extension activated');
  outputChannel.appendLine(`Extension path: ${context.extensionPath}`);

  // Initialize webview provider
  webviewProvider = new ResultsWebviewProvider(context.extensionPath);

  // Register validate translations command
  const validateCmd = vscode.commands.registerCommand(
    'componentStats.validateTranslations',
    async (uri?: vscode.Uri) => {
      await runTranslationValidation(uri);
    }
  );

  // Register analyze components command
  const analyzeCmd = vscode.commands.registerCommand(
    'componentStats.analyzeComponents',
    async (uri?: vscode.Uri) => {
      await runComponentAnalysis(uri);
    }
  );

  // Register show results command
  const showResultsCmd = vscode.commands.registerCommand(
    'componentStats.showResults',
    async () => {
      vscode.window.showInformationMessage('Run an analysis first to see results');
    }
  );

  context.subscriptions.push(validateCmd, analyzeCmd, showResultsCmd, outputChannel);
}

export function deactivate() {
  if (outputChannel) {
    outputChannel.dispose();
  }
}

async function runTranslationValidation(contextUri?: vscode.Uri) {
  // Determine the project path
  let projectPath: string;
  let workspaceRoot: string;
  
  if (contextUri) {
    // Called from context menu - use the selected folder/file
    const stats = await vscode.workspace.fs.stat(contextUri);
    if (stats.type === vscode.FileType.Directory) {
      projectPath = contextUri.fsPath;
    } else {
      // If it's a file, use its directory
      projectPath = path.dirname(contextUri.fsPath);
    }
    
    // Get workspace root for relative path calculations
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(contextUri);
    workspaceRoot = workspaceFolder?.uri.fsPath || projectPath;
    
    outputChannel.appendLine(`📂 Using selected path: ${projectPath}`);
  } else {
    // Called from command palette - use workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }
    projectPath = workspaceFolder.uri.fsPath;
    workspaceRoot = projectPath;
  }

  const config = vscode.workspace.getConfiguration('componentStats');
  const configTranslationsPath = config.get<string>('translationsPath', 'src/assets/i18n');
  
  // Try to find translations folder
  let translationsPath: string;
  
  // First, try common locations relative to the selected project path
  const possiblePaths = [
    path.join(projectPath, 'src/assets/i18n'),
    path.join(projectPath, 'public/assets/i18n'),
    path.join(projectPath, 'assets/i18n'),
    path.join(projectPath, configTranslationsPath),
    path.join(workspaceRoot, configTranslationsPath),
  ];
  
  let foundPath: string | undefined;
  for (const testPath of possiblePaths) {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(testPath));
      foundPath = testPath;
      break;
    } catch {
      // Path doesn't exist, try next
    }
  }
  
  if (foundPath) {
    translationsPath = foundPath;
    outputChannel.appendLine(`✅ Found translations at: ${translationsPath}`);
  } else {
    translationsPath = path.join(projectPath, configTranslationsPath);
    outputChannel.appendLine(`⚠️  Using default path (may not exist): ${translationsPath}`);
  }

  outputChannel.clear();
  outputChannel.show();
  outputChannel.appendLine('🌐 Starting translation validation...');
  outputChannel.appendLine(`📁 Project path: ${projectPath}`);
  outputChannel.appendLine(`🗂️  Translations: ${translationsPath}`);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Validating translations...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Analyzing Angular project...' });

        const result = await validateTranslations({
          projectPath: projectPath,
          translationsPath: translationsPath,
        });

        progress.report({ increment: 100, message: 'Complete!' });

        displayValidationResults(result);
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`❌ Error: ${errorMessage}`);
    vscode.window.showErrorMessage(`Translation validation failed: ${errorMessage}`);
  }
}

function displayValidationResults(result: TranslationValidationResult) {
  outputChannel.appendLine('\n✅ Validation complete!');
  outputChannel.appendLine(`🔤 Found ${result.usedKeys.length} unique translation keys in code`);
  outputChannel.appendLine(`🌍 Checked ${result.languages.length} language(s): ${result.languages.join(', ')}`);

  if (result.missingKeysByLanguage.size > 0) {
    outputChannel.appendLine('\n⚠️  Missing translations:');
    for (const [lang, keys] of result.missingKeysByLanguage) {
      outputChannel.appendLine(`  ${lang}: ${keys.length} key(s) missing`);
      keys.forEach((key: string) => outputChannel.appendLine(`    - ${key}`));
    }
  }

  if (result.unusedKeysByLanguage.size > 0) {
    outputChannel.appendLine('\n📦 Unused translations:');
    for (const [lang, keys] of result.unusedKeysByLanguage) {
      outputChannel.appendLine(`  ${lang}: ${keys.length} key(s) not used`);
      keys.slice(0, 10).forEach((key: string) => outputChannel.appendLine(`    - ${key}`));
      if (keys.length > 10) {
        outputChannel.appendLine(`    ... and ${keys.length - 10} more`);
      }
    }
  }

  if (result.missingKeysByLanguage.size === 0 && result.unusedKeysByLanguage.size === 0) {
    outputChannel.appendLine('\n✨ All translations are in sync!');
  }

  vscode.window.showInformationMessage(
    `Translation validation complete: ${result.languages.length} language(s) checked`
  );

  // Show results in webview
  webviewProvider.show({
    type: 'validationResults',
    data: {
      usedKeys: result.usedKeys,
      languages: result.languages,
      missingKeysByLanguage: Object.fromEntries(result.missingKeysByLanguage),
      unusedKeysByLanguage: Object.fromEntries(result.unusedKeysByLanguage)
    }
  }, 'Translation Validation Results');
}

async function runComponentAnalysis(contextUri?: vscode.Uri) {
  // Determine the project path
  let projectPath: string;
  
  if (contextUri) {
    // Called from context menu - use the selected folder/file
    const stats = await vscode.workspace.fs.stat(contextUri);
    if (stats.type === vscode.FileType.Directory) {
      projectPath = contextUri.fsPath;
    } else {
      // If it's a file, use its directory
      projectPath = path.dirname(contextUri.fsPath);
    }
    outputChannel.appendLine(`📂 Using selected path: ${projectPath}`);
  } else {
    // Called from command palette - use workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }
    projectPath = workspaceFolder.uri.fsPath;
  }

  outputChannel.clear();
  outputChannel.show();
  outputChannel.appendLine('📊 Starting component analysis...');
  outputChannel.appendLine(`📁 Project path: ${projectPath}`);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing components...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0, message: 'Scanning Angular project...' });

        const components = await analyzeComponents({
          projectPath: projectPath,
        });

        progress.report({ increment: 100, message: 'Complete!' });

        outputChannel.appendLine(`\n✅ Found ${components.length} components`);
        outputChannel.appendLine('\nTop 10 most used components:');
        
        components
          .sort((a: ComponentStats, b: ComponentStats) => b.count - a.count)
          .slice(0, 10)
          .forEach((comp: ComponentStats, index: number) => {
            outputChannel.appendLine(`  ${index + 1}. ${comp.componentClass} - used ${comp.count} time(s)`);
          });

        vscode.window.showInformationMessage(
          `Component analysis complete: ${components.length} components found`
        );
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`❌ Error: ${errorMessage}`);
    vscode.window.showErrorMessage(`Component analysis failed: ${errorMessage}`);
  }
}
