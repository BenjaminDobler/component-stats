import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from './pipes/translate.pipe';
import { TranslationService } from './services/translation.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [RouterModule, TranslatePipe, CommonModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private translationService = inject(TranslationService);
  protected title = 'demo';
  currentLang = 'en';

  switchLanguage(lang: 'en' | 'de'): void {
    this.currentLang = lang;
    this.translationService.setLanguage(lang);
  }
}
