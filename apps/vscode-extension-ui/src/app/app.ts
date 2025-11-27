import { Component } from '@angular/core';
import { TranslationResultsComponent } from './components/translation-results.component';

@Component({
  imports: [TranslationResultsComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Component Stats';
}
