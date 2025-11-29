import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface Product {
  id: number;
  key: string;
  name?: string;
  description?: string;
  price?: string;
}

export interface ProductCardLabels {
  addToCart: string;
  viewDetails: string;
}

@Component({
  selector: 'lib-product-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  product = input.required<Product>();
}
