import { Route } from '@angular/router';
import { HomeComponent } from './components/home.component';
import { ProductsComponent } from './components/products.component';
import { ContactComponent } from './components/contact.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'products',
    component: ProductsComponent
  },
  {
    path: 'contact',
    component: ContactComponent
  }
];
