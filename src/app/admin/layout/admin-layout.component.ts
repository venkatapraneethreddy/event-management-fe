import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, ToastModule, MessageModule, AvatarModule, ButtonModule, BadgeModule, TooltipModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  fullName: string;
  pendingCount = 0;
  sidebarOpen = false;
  constructor(private authService: AuthService, private router: Router) {
    this.fullName = this.authService.getFullName() || 'Admin';
  }
  logout() { this.authService.logout(); this.router.navigate(['/login']); }

  sessionExpiring = false;
  minutesLeft = 5;
  private boundHandler = this.onSessionExpiring.bind(this);

  ngOnInit() { window.addEventListener('session-expiring-soon', this.boundHandler); }
  ngOnDestroy() { window.removeEventListener('session-expiring-soon', this.boundHandler); }
  onSessionExpiring(e: Event) { this.minutesLeft = (e as CustomEvent).detail.minutesLeft; this.sessionExpiring = true; }
  dismissBanner() { this.sessionExpiring = false; }

}