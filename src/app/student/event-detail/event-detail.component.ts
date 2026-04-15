import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { RegistrationService } from '../../core/services/registration.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, ProgressBarModule, DividerModule, MessageModule],
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
          const eventId = Number(params['id']);
          return this.eventService.getEventById(eventId);
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
      next: (ids: number[]) => { this.alreadyRegistered = ids.includes(eventId); },
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

  isPastEvent(): boolean {
    if (!this.event?.eventDate) return false;
    return new Date(this.event.eventDate) < new Date();
  }

  getBannerColor(id: number): string {
    return ['bv1','bv2','bv3','bv4','bv5','bv6'][(id || 0) % 6];
  }
}
