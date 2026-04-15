import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { role: 'STUDENT' },
    loadChildren: () =>
      import('./student/student.routes')
        .then(m => m.STUDENT_ROUTES)
  },

  {
    path: 'organizer',
    canActivate: [authGuard, roleGuard],
    data: { role: 'ORGANIZER' },
    loadChildren: () =>
      import('./organizer/organizer.routes')
        .then(m => m.ORGANIZER_ROUTES)
  },

  {
    // Feature 2: Admin route was completely unguarded — fixed
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' },
    loadChildren: () =>
      import('./admin/admin.routes')
        .then(m => m.ADMIN_ROUTES)
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];
