import { Routes } from '@angular/router';
import { OrganizerLayoutComponent } from './layout/organizer-layout.component';

export const ORGANIZER_ROUTES: Routes = [
  {
    path: '',
    component: OrganizerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',         loadComponent: () => import('./dashboard/organizer-dashboard.component').then(m => m.OrganizerDashboardComponent) },
      { path: 'create-club',       loadComponent: () => import('./create-club/create-club.component').then(m => m.CreateClubComponent) },
      { path: 'create-event',      loadComponent: () => import('./create-event/create-event.component').then(m => m.CreateEventComponent) },
      { path: 'my-events',         loadComponent: () => import('./my-events/my-events.component').then(m => m.MyEventsComponent) },
      { path: 'analytics',         loadComponent: () => import('./analytics/organizer-analytics.component').then(m => m.OrganizerAnalyticsComponent) },
      { path: 'qr-scanner',        loadComponent: () => import('./qr-scanner/qr-scanner.component').then(m => m.QrScannerComponent) },
      { path: 'event/:eventId/registrants', loadComponent: () => import('./event-registrants/event-registrants.component').then(m => m.EventRegistrantsComponent) },
      { path: 'event/:eventId/edit', loadComponent: () => import('./edit-event/edit-event.component').then(m => m.EditEventComponent) },
      { path: 'profile',           loadComponent: () => import('../shared/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  }
];
