import { Pipe, PipeTransform, inject, InjectionToken } from '@angular/core';

// Create an injection token for the translation function
export const TRANSLATE_FUNCTION = new InjectionToken<(key: string) => string>('TRANSLATE_FUNCTION');

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private translateFn = inject(TRANSLATE_FUNCTION, { optional: true });

  transform(key: string): string {
    if (this.translateFn) {
      return this.translateFn(key);
    }
    return key; // Fallback to key if no translation function provided
  }
}
