import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { RegistrationService } from '../../core/services/registration.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit, OnDestroy {

  event: any = null;
  loading = true;
  registering = false;
  alreadyRegistered = false;
  notFound = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private registrationService: RegistrationService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          this.loading = true;
          this.event = null;
          this.notFound = false;
          return this.eventService.getEventById(Number(params['id']));
        })
      )
      .subscribe({
        next: (data) => {
          this.event = data;
          this.loading = false;
          this.cdr.detectChanges();
          this.checkIfRegistered(data.eventId);
        },
        error: () => {
          this.notFound = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  checkIfRegistered(eventId: number) {
    this.registrationService.getMyRegistrationEventIds().subscribe({
      next: (ids: number[]) => { this.alreadyRegistered = ids.includes(eventId); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  register() {
    if (this.registering || this.alreadyRegistered) return;
    this.registering = true;
    this.registrationService.register(this.event.eventId).subscribe({
      next: () => {
        this.alreadyRegistered = true;
        this.registering = false;
        this.cdr.detectChanges();
        this.toastr.success('Successfully registered!');
      },
      error: (err) => {
        this.registering = false;
        this.cdr.detectChanges();
        this.toastr.error(typeof err.error === 'string' ? err.error : 'Registration failed');
      }
    });
  }

  goBack() { this.router.navigate(['/student']); }

  formatDate(date: string): string {
    if (!date) return 'Date TBA';
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatShortDate(date: string): string {
    if (!date) return 'TBA';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(date: string): string {
    if (!date) return 'TBA';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  isPastEvent(): boolean {
    if (!this.event?.eventDate) return false;
    return new Date(this.event.eventDate) < new Date();
  }

  isLiveNow(): boolean {
    if (!this.event?.eventDate) return false;
    const d = new Date(this.event.eventDate);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff >= 0 && diff < 3 * 60 * 60 * 1000; // within 3h of start
  }

  getCapacityPercent(): number {
    if (!this.event?.capacity) return 0;
    return Math.min(100, Math.round(((this.event.capacity - this.event.spotsLeft) / this.event.capacity) * 100));
  }

  getBannerColor(id: number): string {
    return ['bv1','bv2','bv3','bv4','bv5','bv6'][(id || 0) % 6];
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.apiUrl}${imageUrl}`;
  }
}
