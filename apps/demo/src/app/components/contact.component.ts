import { Component } from '@angular/core';
import { TranslatePipe } from '../pipes/translate.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [TranslatePipe, FormsModule],
  template: `
    <div class="contact-container">
      <header>
        <h1>{{ 'contact.title' | translate }}</h1>
        <p>{{ 'contact.description' | translate }}</p>
      </header>

      <div class="content-grid">
        <div class="form-section">
          <form>
            <div class="form-group">
              <label [attr.for]="'name'">{{ 'contact.form.name' | translate }}</label>
              <input type="text" id="name" [placeholder]="'contact.form.name' | translate">
            </div>

            <div class="form-group">
              <label [attr.for]="'email'">{{ 'contact.form.email' | translate }}</label>
              <input type="email" id="email" [placeholder]="'contact.form.email' | translate">
            </div>

            <div class="form-group">
              <label [attr.for]="'message'">{{ 'contact.form.message' | translate }}</label>
              <textarea id="message" rows="5" [placeholder]="'contact.form.message' | translate"></textarea>
            </div>

            <button type="submit" class="btn-submit">
              {{ 'contact.form.submit' | translate }}
            </button>
          </form>
        </div>

        <div class="info-section">
          <h3>{{ 'contact.info.address' | translate }}</h3>
          <p>123 Main Street, City, Country</p>

          <h3>{{ 'contact.info.phone' | translate }}</h3>
          <p>+1 234 567 8900</p>

          <h3>{{ 'contact.info.email' | translate }}</h3>
          <p>contact@example.com</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
    }

    header h1 {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    header p {
      color: #666;
      font-size: 1.1rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 3rem;
    }

    .form-section {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    input, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-submit {
      width: 100%;
      padding: 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-submit:hover {
      background: #5568d3;
    }

    .info-section {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .info-section h3 {
      color: #764ba2;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .info-section h3:first-child {
      margin-top: 0;
    }

    .info-section p {
      color: #666;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ContactComponent {}
