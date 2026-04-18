import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { EventService } from '../../core/services/event.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TooltipModule],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.scss'
})
export class MyEventsComponent implements OnInit, OnDestroy {

  events: any[] = [];
  filteredEvents: any[] = [];
  loading = true;
  publishing = new Set<number>();
  cancelling = new Set<number>();
  cancelTarget: any = null;

  searchTerm = '';
  statusFilter: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED' = 'ALL';

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadEvents(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadEvents() {
    this.loading = true;
    this.eventService.getMyEvents().subscribe({
      next: (data: any[]) => {
        this.events = data;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Failed to load events');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    let result = this.events;
    if (this.statusFilter !== 'ALL') result = result.filter(e => e.status === this.statusFilter);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e => e.title?.toLowerCase().includes(term) || e.location?.toLowerCase().includes(term) || e.place?.toLowerCase().includes(term));
    }
    this.filteredEvents = result;
    this.cdr.detectChanges();
  }

  setStatusFilter(f: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED') {
    this.statusFilter = f;
    this.applyFilter();
  }

  publish(eventId: number) {
    if (this.publishing.has(eventId)) return;
    this.publishing.add(eventId);
    this.cdr.detectChanges();
    this.eventService.publishEvent(eventId).subscribe({
      next: () => {
        const event = this.events.find(e => e.eventId === eventId);
        if (event) event.status = 'PUBLISHED';
        this.publishing.delete(eventId);
        this.applyFilter();
        this.toastr.success('Event published successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.publishing.delete(eventId);
        this.toastr.error(err.error?.error || 'Failed to publish event');
        this.cdr.detectChanges();
      }
    });
  }

  confirmCancel(event: any) {
    this.cancelTarget = event;
  }

  cancelEvent(eventId: number) {
    if (this.cancelling.has(eventId)) return;
    this.cancelling.add(eventId);
    this.cdr.detectChanges();
    this.eventService.cancelEvent(eventId).subscribe({
      next: () => {
        const event = this.events.find(e => e.eventId === eventId);
        if (event) event.status = 'CANCELLED';
        this.cancelling.delete(eventId);
        this.cancelTarget = null;
        this.applyFilter();
        this.toastr.success('Event cancelled');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancelling.delete(eventId);
        this.toastr.error(err.error?.error || 'Failed to cancel event');
        this.cdr.detectChanges();
      }
    });
  }

  get draftCount()     { return this.events.filter(e => e.status === 'DRAFT').length; }
  get publishedCount() { return this.events.filter(e => e.status === 'PUBLISHED').length; }
  get cancelledCount() { return this.events.filter(e => e.status === 'CANCELLED').length; }

  formatDate(date: string): string {
    if (!date) return 'Date TBA';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getBannerColor(id: number): string {
    return ['bv1','bv2','bv3','bv4','bv5','bv6'][(id || 0) % 6];
  }
}
