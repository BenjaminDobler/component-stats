import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// VS Code API types
interface VSCodeApi {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

// Message types from extension
export interface ValidationResultsMessage {
  type: 'validationResults';
  data: {
    usedKeys: string[];
    languages: string[];
    missingKeysByLanguage: Record<string, string[]>;
    unusedKeysByLanguage: Record<string, string[]>;
  };
}

export interface ComponentAnalysisMessage {
  type: 'componentAnalysis';
  data: Array<{
    selector: string;
    className: string;
    usageCount: number;
    filePath: string;
  }>;
}

type IncomingMessage = ValidationResultsMessage | ComponentAnalysisMessage;

// Commands to extension
export interface OpenFileCommand {
  command: 'openFile';
  filePath: string;
  line?: number;
}

export interface CreateTranslationKeyCommand {
  command: 'createTranslationKey';
  language: string;
  key: string;
  value: string;
}

export interface ExportResultsCommand {
  command: 'exportResults';
  format: 'json' | 'csv';
}

type OutgoingCommand = OpenFileCommand | CreateTranslationKeyCommand | ExportResultsCommand;

@Injectable({
  providedIn: 'root'
})
export class VscodeApiService {
  private vscodeApi: VSCodeApi;
  private validationResultsSubject = new BehaviorSubject<ValidationResultsMessage['data'] | null>(null);
  private componentAnalysisSubject = new BehaviorSubject<ComponentAnalysisMessage['data'] | null>(null);

  validationResults$: Observable<ValidationResultsMessage['data'] | null> = this.validationResultsSubject.asObservable();
  componentAnalysis$: Observable<ComponentAnalysisMessage['data'] | null> = this.componentAnalysisSubject.asObservable();

  constructor() {
    // Acquire VS Code API (only available in webview context)
    try {
      this.vscodeApi = acquireVsCodeApi();
    } catch (error) {
      console.warn('VS Code API not available, running in dev mode');
      // Mock API for development
      this.vscodeApi = {
        postMessage: (msg) => console.log('Mock postMessage:', msg),
        getState: () => ({}),
        setState: (state) => console.log('Mock setState:', state)
      };
    }

    // Listen for messages from extension
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent<IncomingMessage>) {
    const message = event.data;
    
    switch (message.type) {
      case 'validationResults':
        this.validationResultsSubject.next(message.data);
        break;
      case 'componentAnalysis':
        this.componentAnalysisSubject.next(message.data);
        break;
      default:
        console.warn('Unknown message type:', message);
    }
  }

  // Send commands to extension
  openFile(filePath: string, line?: number) {
    this.postMessage({ command: 'openFile', filePath, line });
  }

  createTranslationKey(language: string, key: string, value: string) {
    this.postMessage({ command: 'createTranslationKey', language, key, value });
  }

  exportResults(format: 'json' | 'csv') {
    this.postMessage({ command: 'exportResults', format });
  }

  postMessage(message: OutgoingCommand) {
    this.vscodeApi.postMessage(message);
  }

  // State persistence
  saveState(state: any) {
    this.vscodeApi.setState(state);
  }

  getState(): any {
    return this.vscodeApi.getState();
  }
}
