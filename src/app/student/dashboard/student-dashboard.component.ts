import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { RegistrationService } from '../../core/services/registration.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, TitleCasePipe, SelectButtonModule, ChipModule, TagModule, ProgressBarModule, AvatarModule, ButtonModule, SkeletonModule, IconFieldModule, InputIconModule, InputTextModule, TooltipModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit, OnDestroy {

  events: any[] = [];
  filteredEvents: any[] = [];
  loading = true;
  loadError = false;
  registeredEventIds = new Set<number>();
  registering = new Set<number>();
  showPast = false;
  searchTerm = '';
  filterType: 'all' | 'free' | 'paid' = 'all';
  feeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Free', value: 'free' },
    { label: 'Paid', value: 'paid' }
  ];
  categoryFilter = 'ALL';

  readonly categories = ['TECHNICAL','CULTURAL','SPORTS','WORKSHOP','SEMINAR','SOCIAL'];

  currentPage = 1;
  readonly pageSize = 9;

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private registrationService: RegistrationService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadAll(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadAll() {
    this.loading = true;
    this.loadError = false;

    // Load events — this controls the loading spinner
    this.eventService.getPublishedEvents()
      .subscribe({
        next: (events) => {
          this.events = events;
          this.applyFilter();
          this.loading = false;
          this.cdr.detectChanges();

          // Load registrations independently — failure just means no "Registered" badges shown
          this.registrationService.getMyRegistrations()
            .subscribe({
              next: (registrations) => {
                this.registeredEventIds = new Set(registrations.map((r: any) => r.event.eventId));
              },
              error: () => {} // silent — not critical for page to function
            });
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
          this.toastr.error('Failed to load events. Please refresh.');
        }
      });
  }

  applyFilter() {
    this.currentPage = 1;
    let result = this.events;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e =>
        e.title?.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term) ||
        e.club?.clubName?.toLowerCase().includes(term)
      );
    }
    if (this.filterType === 'free') result = result.filter(e => !e.paid);
    if (this.filterType === 'paid') result = result.filter(e =>  e.paid);
    if (this.categoryFilter !== 'ALL') result = result.filter(e => e.category === this.categoryFilter);
    this.filteredEvents = result;
  }

  get allUpcoming(): any[] {
    const now = new Date();
    return this.filteredEvents.filter(e => !e.eventDate || new Date(e.eventDate) >= now);
  }
  get pastEvents(): any[] {
    const now = new Date();
    return this.filteredEvents.filter(e => e.eventDate && new Date(e.eventDate) < now);
  }
  get upcomingEvents(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.allUpcoming.slice(start, start + this.pageSize);
  }
  onPageChange(page: number) { this.currentPage = page; }

  register(eventId: number) {
    if (this.registering.has(eventId)) return;
    this.registering.add(eventId);
    this.registrationService.register(eventId).subscribe({
      next: () => {
        this.registeredEventIds.add(eventId);
        this.registering.delete(eventId);
        const e = this.events.find(ev => ev.eventId === eventId);
        if (e && e.spotsLeft != null) {
          e.spotsLeft = Math.max(0, e.spotsLeft - 1);
          e.registrationCount = (e.registrationCount ?? 0) + 1;
          e.full = e.capacity != null && e.registrationCount >= e.capacity;
        }
        this.toastr.success('Registered! Check your email for confirmation.');
      },
      error: (err) => {
        this.registering.delete(eventId);
        this.toastr.error(err.error?.error || 'Registration failed');
      }
    });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.apiUrl}${imageUrl}`;
  }

  /* getCategoryEmoji(cat: string): string {
  const map: any = {
    TECHNICAL: '💻',
    CULTURAL: '🎭',
    SPORTS: '🏅',
    WORKSHOP: '🛠️',
    SEMINAR: '📢',
    SOCIAL: '🤝'
  };

  return map[cat] ?? '📌';
} */

  get userName(): string {
    return this.authService.getFullName()?.split(' ')[0] || 'there';
  }

  getCapacityPercent(e: any): number {
    if (!e.capacity) return 0;
    return Math.min(100, Math.round((e.registrationCount / e.capacity) * 100));
  }
  getCapacityClass(e: any): string {
    const pct = this.getCapacityPercent(e);
    if (pct >= 90) return 'critical';
    if (pct >= 60) return 'warning';
    return 'good';
  }
  getCardColor(id: number): string { return ['c1','c2','c3','c4','c5','c6'][id % 6]; }
  formatShortDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }
  formatTime(date: string): string {
    if (!date) return 'TBA';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  formatDate(date: string): string {
    if (!date) return 'Date TBA';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  
  selectedEvent: any = null;

openModal(event: any) {
  this.selectedEvent = event;
}

closeModal() {
  this.selectedEvent = null;
}
isAlmostFull(e: any): boolean {
  return !e.full && this.getCapacityPercent(e) >= 75;
}

isToday(date: string): boolean {
  if (!date) return false;

  const d = new Date(date);
  const now = new Date();

  return d.getDate() === now.getDate()
    && d.getMonth() === now.getMonth()
    && d.getFullYear() === now.getFullYear();
}
}
