import { Component } from '@angular/core';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  key: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="products-container">
      <header>
        <h1>{{ 'products.title' | translate }}</h1>
        <p>{{ 'products.description' | translate }}</p>
      </header>

      <div class="products-grid">
        @for (product of products; track product.id) {
          <div class="product-card">
            <h3>{{ 'products.' + product.key + '.name' | translate }}</h3>
            <p class="description">{{ 'products.' + product.key + '.description' | translate }}</p>
            <div class="price-tag">
              <span>{{ 'products.' + product.key + '.price' | translate }}</span>: $99.99
            </div>
            <div class="actions">
              <button class="btn-primary">{{ 'products.add_to_cart' | translate }}</button>
              <button class="btn-secondary">{{ 'products.view_details' | translate }}</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .products-container {
      padding: 2rem;
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

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }

    .product-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .product-card h3 {
      color: #764ba2;
      margin-bottom: 1rem;
    }

    .description {
      color: #666;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .price-tag {
      font-size: 1.3rem;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    button {
      flex: 1;
      padding: 0.7rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }
  `]
})
export class ProductsComponent {
  products: Product[] = [
    { id: 1, key: 'product_1' },
    { id: 2, key: 'product_2' },
    { id: 3, key: 'product_3' }
  ];
}
