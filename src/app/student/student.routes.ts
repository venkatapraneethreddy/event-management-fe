import { Routes } from '@angular/router';
import { StudentLayoutComponent } from './layout/student-layout.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/student-dashboard.component')
          .then(m => m.StudentDashboardComponent)
      },
      {
        path: 'my-registrations',
        loadComponent: () => import('./my-registrations/student-my-registrations.component')
          .then(m => m.StudentMyRegistrationsComponent)
      },
      {
        path: 'event/:id',
        loadComponent: () => import('./event-detail/event-detail.component')
          .then(m => m.EventDetailComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('../shared/profile/profile.component')
          .then(m => m.ProfileComponent)
      }
    ]
  }
];
