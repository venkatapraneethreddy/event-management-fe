import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { routes } from './app.routes';
import { NoReuseStrategy } from './core/strategies/no-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withComponentInputBinding()
    ),
    { provide: RouteReuseStrategy, useClass: NoReuseStrategy },
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideToastr({ positionClass: 'toast-top-right', timeOut: 3000, preventDuplicates: true }),
    provideCharts(withDefaultRegisterables()),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'none',
          cssLayer: false
        }
      }
    }),
    MessageService,
    ConfirmationService
  ]
};
