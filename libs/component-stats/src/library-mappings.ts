// Common UI library component selector mappings
// This helps resolve library components when metadata isn't available in declaration files

interface LibraryComponentMapping {
  selector: string;
  className: string;
  library: string;
}

export const KNOWN_LIBRARY_COMPONENTS: LibraryComponentMapping[] = [
  // PrimeNG components
  { selector: 'p-button', className: 'Button', library: 'primeng/button' },
  { selector: 'p-card', className: 'Card', library: 'primeng/card' },
  { selector: 'p-menubar', className: 'Menubar', library: 'primeng/menubar' },
  { selector: 'p-menu', className: 'Menu', library: 'primeng/menu' },
  { selector: 'p-table', className: 'Table', library: 'primeng/table' },
  { selector: 'p-dialog', className: 'Dialog', library: 'primeng/dialog' },
  { selector: 'p-dropdown', className: 'Dropdown', library: 'primeng/dropdown' },
  { selector: 'p-inputtext', className: 'InputText', library: 'primeng/inputtext' },
  { selector: 'p-calendar', className: 'Calendar', library: 'primeng/calendar' },
  { selector: 'p-checkbox', className: 'Checkbox', library: 'primeng/checkbox' },
  { selector: 'p-radiobutton', className: 'RadioButton', library: 'primeng/radiobutton' },
  { selector: 'p-panel', className: 'Panel', library: 'primeng/panel' },
  { selector: 'p-accordion', className: 'Accordion', library: 'primeng/accordion' },
  { selector: 'p-accordiontab', className: 'AccordionTab', library: 'primeng/accordion' },
  { selector: 'p-tabview', className: 'TabView', library: 'primeng/tabview' },
  { selector: 'p-tabpanel', className: 'TabPanel', library: 'primeng/tabview' },
  { selector: 'p-toast', className: 'Toast', library: 'primeng/toast' },
  { selector: 'p-paginator', className: 'Paginator', library: 'primeng/paginator' },
  { selector: 'p-progressbar', className: 'ProgressBar', library: 'primeng/progressbar' },
  { selector: 'p-spinner', className: 'Spinner', library: 'primeng/spinner' },
  { selector: 'p-tree', className: 'Tree', library: 'primeng/tree' },
  { selector: 'p-fileupload', className: 'FileUpload', library: 'primeng/fileupload' },
  
  // Angular Material components
  { selector: 'mat-button', className: 'MatButton', library: '@angular/material/button' },
  { selector: 'mat-icon-button', className: 'MatIconButton', library: '@angular/material/button' },
  { selector: 'mat-card', className: 'MatCard', library: '@angular/material/card' },
  { selector: 'mat-form-field', className: 'MatFormField', library: '@angular/material/form-field' },
  { selector: 'mat-input', className: 'MatInput', library: '@angular/material/input' },
  { selector: 'mat-select', className: 'MatSelect', library: '@angular/material/select' },
  { selector: 'mat-checkbox', className: 'MatCheckbox', library: '@angular/material/checkbox' },
  { selector: 'mat-radio-button', className: 'MatRadioButton', library: '@angular/material/radio' },
  { selector: 'mat-table', className: 'MatTable', library: '@angular/material/table' },
  { selector: 'mat-dialog', className: 'MatDialog', library: '@angular/material/dialog' },
  { selector: 'mat-menu', className: 'MatMenu', library: '@angular/material/menu' },
  { selector: 'mat-toolbar', className: 'MatToolbar', library: '@angular/material/toolbar' },
  { selector: 'mat-sidenav', className: 'MatSidenav', library: '@angular/material/sidenav' },
  { selector: 'mat-tab-group', className: 'MatTabGroup', library: '@angular/material/tabs' },
  { selector: 'mat-tab', className: 'MatTab', library: '@angular/material/tabs' },
  { selector: 'mat-progress-bar', className: 'MatProgressBar', library: '@angular/material/progress-bar' },
  { selector: 'mat-progress-spinner', className: 'MatProgressSpinner', library: '@angular/material/progress-spinner' },
  { selector: 'mat-paginator', className: 'MatPaginator', library: '@angular/material/paginator' },
  { selector: 'mat-icon', className: 'MatIcon', library: '@angular/material/icon' },
  
  // Angular Router
  { selector: 'router-outlet', className: 'RouterOutlet', library: '@angular/router' },
  { selector: 'router-link', className: 'RouterLink', library: '@angular/router' },
  
  // Angular Forms
  { selector: 'ng-template', className: 'NgTemplate', library: '@angular/common' },
  { selector: 'ng-container', className: 'NgContainer', library: '@angular/common' },
  { selector: 'ng-content', className: 'NgContent', library: '@angular/core' },
];

export function getLibraryComponentInfo(selector: string): LibraryComponentMapping | undefined {
  return KNOWN_LIBRARY_COMPONENTS.find(c => c.selector === selector);
}
