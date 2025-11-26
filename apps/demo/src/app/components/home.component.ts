import { Component } from '@angular/core';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="home-container">
      <header class="hero">
        <h1>{{ 'home.welcome' | translate }}</h1>
        <p class="subtitle">{{ 'home.description' | translate }}</p>
      </header>

      <section class="features">
        <div class="feature-card">
          <h3>{{ 'home.getting_started' | translate }}</h3>
          <p>{{ 'app.subtitle' | translate }}</p>
        </div>
        <div class="feature-card">
          <h3>{{ 'home.learn_more' | translate }}</h3>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem;
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .feature-card h3 {
      color: #667eea;
      margin-bottom: 1rem;
    }
  `]
})
export class HomeComponent {}
