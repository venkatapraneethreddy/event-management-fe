import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { ClubService } from '../../core/services/club.service';
import { EventService } from '../../core/services/event.service';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, MessageModule, TooltipModule],
  templateUrl: './organizer-dashboard.component.html',
  styleUrls: ['./organizer-dashboard.component.scss']
})
export class OrganizerDashboardComponent implements OnInit, OnDestroy {

  eventCount = 0;
  registrationCount = 0;
  publishedCount = 0;
  draftCount = 0;
  club: any = undefined;   // undefined=loading, null=no club, obj=loaded
  loading = true;
  loadError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private clubService: ClubService,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.refresh(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  refresh() {
    this.loading = true;
    this.loadError = false;

    // Load club first — controls the spinner
    this.clubService.getMyClub()
      .subscribe({
        next: (res: any) => {
          this.club = res?.club ?? null;
          this.loading = false;
          this.cdr.detectChanges();

          // Load event stats independently — failure just leaves counters at 0
          this.eventService.getMyEvents()
            .subscribe({
              next: (events: any[]) => {
                this.eventCount       = events.length;
                this.publishedCount   = events.filter(e => e.status === 'PUBLISHED').length;
                this.draftCount       = events.filter(e => e.status === 'DRAFT').length;
                this.registrationCount = events.reduce(
                  (sum, e) => sum + (e.registrationCount ?? 0), 0
                );
                this.cdr.detectChanges();
              },
              error: () => {} // counters stay 0 — not critical
            });
        },
        error: () => {
          this.club = null;
          this.loadError = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }
}