import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// How many ms before expiry to show the warning (5 minutes)
const WARN_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

let expiryWarningShown = false;
let expiryWarningTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleExpiryWarning(token: string) {
  // JWT payload is base64url encoded — decode it
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expMs = payload.exp * 1000;
    const nowMs = Date.now();
    const msUntilExpiry = expMs - nowMs;

    if (msUntilExpiry <= 0) return; // already expired

    // Clear any existing timer
    if (expiryWarningTimer) clearTimeout(expiryWarningTimer);

    const warnAt = msUntilExpiry - WARN_BEFORE_EXPIRY_MS;

    if (warnAt > 0 && !expiryWarningShown) {
      expiryWarningTimer = setTimeout(() => {
        expiryWarningShown = true;
        // Show a dismissible banner by dispatching a custom event the layout can listen to
        window.dispatchEvent(new CustomEvent('session-expiring-soon', {
          detail: { minutesLeft: Math.ceil(WARN_BEFORE_EXPIRY_MS / 60000) }
        }));
      }, warnAt);
    }
  } catch {
    // If token can't be decoded, just ignore
  }
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    // Schedule expiry warning on every request (timer is cleared/reset if already scheduled)
    scheduleExpiryWarning(token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const currentUrl = router.url;
        const isAuthCall = req.url.includes('/api/auth/');
        const isOnLogin  = currentUrl === '/login' || currentUrl === '/';

        if (!isAuthCall && !isOnLogin) {
          // Clear the expiry warning timer since we're logging out
          if (expiryWarningTimer) { clearTimeout(expiryWarningTimer); expiryWarningTimer = null; }
          expiryWarningShown = false;
          localStorage.clear();
          router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
        }
      }
      return throwError(() => error);
    })
  );
};
