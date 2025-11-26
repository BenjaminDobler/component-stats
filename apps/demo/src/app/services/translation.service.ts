import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'de';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<Record<string, any>>({});
  private currentLang = signal<Language>('en');

  constructor() {
    this.loadTranslations('en');
  }

  async loadTranslations(lang: Language): Promise<void> {
    try {
      const response = await fetch(`/assets/i18n/${lang}.json`);
      const data = await response.json();
      this.translations.set(data);
      this.currentLang.set(lang);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  getCurrentLang(): Language {
    return this.currentLang();
  }

  setLanguage(lang: Language): void {
    this.loadTranslations(lang);
  }
}
