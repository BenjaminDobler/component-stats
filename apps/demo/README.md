# Demo Application

An Angular 20 demo application showcasing the translate pipe functionality with multi-language support.

## Features

- 🌍 **Multi-language Support**: English and German translations
- 🔄 **Language Switcher**: Toggle between languages in real-time
- 📱 **Responsive Design**: Works on all device sizes
- 🎨 **Modern UI**: Clean and professional interface
- 📄 **Multiple Pages**: Home, Products, and Contact pages
- 🔧 **Translation Pipe**: Custom translate pipe implementation

## Structure

```
apps/demo/
├── public/
│   └── assets/
│       └── i18n/          # Translation JSON files
│           ├── en.json    # English translations
│           └── de.json    # German translations
├── src/
│   ├── app/
│   │   ├── components/    # Feature components
│   │   │   ├── home.component.ts
│   │   │   ├── products.component.ts
│   │   │   └── contact.component.ts
│   │   ├── pipes/         # Custom pipes
│   │   │   └── translate.pipe.ts
│   │   ├── services/      # Application services
│   │   │   └── translation.service.ts
│   │   ├── app.ts         # Main app component
│   │   ├── app.routes.ts  # Routing configuration
│   │   └── app.config.ts  # App configuration
│   └── main.ts            # Application bootstrap
└── project.json           # Nx project configuration
```

## Running the Application

### Development Server

```bash
# From workspace root
nx serve demo

# Or using npm
npm run serve:demo
```

The application will be available at `http://localhost:4200/`

### Build

```bash
# Development build
nx build demo

# Production build
nx build demo --configuration=production
```

## Translation Files

Translation files are located in `public/assets/i18n/`:

- **en.json**: English translations
- **de.json**: German translations

### Adding New Translations

1. Add the translation key to both `en.json` and `de.json`
2. Use the translate pipe in your template:
   ```html
   {{ 'your.translation.key' | translate }}
   ```

### Translation Structure

```json
{
  "section": {
    "subsection": {
      "key": "Translation value"
    }
  }
}
```

Access nested keys using dot notation: `'section.subsection.key' | translate`

## Components

### Home Component
- Welcome message
- Feature cards
- Uses multiple translation keys

### Products Component
- Product grid layout
- Dynamic product cards
- Price display
- Action buttons with translations

### Contact Component
- Contact form with translated labels
- Company information section
- Form validation (placeholder)

### App Component
- Navigation bar with language switcher
- Route management
- Footer with copyright notice

## Translation Service

The `TranslationService` provides:
- Loading translation files from JSON
- Switching between languages
- Accessing nested translation keys
- Signal-based reactivity

## Testing with Component Stats

Test translate pipe detection:
```bash
node dist/libs/component-stats/src/cli.js apps/demo --translate --json
```

Test component usage analysis:
```bash
node dist/libs/component-stats/src/cli.js apps/demo --json
```

## Translation Keys Used

The demo uses translation keys from these categories:
- `app.*` - Application title and metadata
- `navigation.*` - Navigation menu items
- `home.*` - Home page content
- `products.*` - Product listings and actions
- `contact.*` - Contact form and information
- `common.*` - Common UI elements
- `footer.*` - Footer content

## Technologies

- **Angular 20**: Latest Angular framework
- **TypeScript 5.6**: Type-safe development
- **Nx**: Monorepo build system
- **esbuild**: Fast bundler
- **Signals**: Modern Angular reactivity

## Development

### Adding a New Page

1. Create component in `src/app/components/`
2. Add route to `app.routes.ts`
3. Add navigation link to `app.html`
4. Add translations to JSON files

### Styling

- Component styles are colocated with components
- Global styles in `src/styles.css`
- App-level styles in `app.css`

## Notes

- Language preference is not persisted (resets on reload)
- Translation service uses browser's `fetch` API
- All components use standalone API
- Routes use lazy loading capable structure
