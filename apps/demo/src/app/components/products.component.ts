import { Component } from '@angular/core';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CommonModule } from '@angular/common';
import { ProductCardComponent, type Product, TRANSLATE_FUNCTION } from '@component-stats/ui';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ProductCardComponent],
  providers: [
    {
      provide: TRANSLATE_FUNCTION,
      useFactory: () => {
        const service = new TranslationService();
        return (key: string) => service.translate(key);
      }
    }
  ],
  templateUrl: './products.component.html',
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
  `]
})
export class ProductsComponent {
  products: Product[] = [
    { id: 1, key: 'product_1' },
    { id: 2, key: 'product_2' },
    { id: 3, key: 'product_3' }
  ];
}
