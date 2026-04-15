import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getRole();
  const expectedRole = route.data?.['role'] ?? route.parent?.data?.['role'];

  if (userRole !== expectedRole) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
