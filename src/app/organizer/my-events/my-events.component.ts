import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TabMenuModule } from 'primeng/tabmenu';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, TagModule, ChipModule, AvatarModule, SkeletonModule, MessageModule, TooltipModule, IconFieldModule, InputIconModule, InputTextModule, TabMenuModule],
  templateUrl: './my-events.component.html',
  styleUrl: './my-events.component.scss'
})
export class MyEventsComponent implements OnInit, OnDestroy {

  events: any[] = [];
  filteredEvents: any[] = [];
  loading = true;
  publishing = new Set<number>();
  cancelling = new Set<number>();

  searchTerm = '';
  statusFilter: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED' = 'ALL';
  activeTab: any = null;
  filterTabs: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterTabs = [
      { label: 'All', command: () => this.setStatusFilter('ALL') },
      { label: 'Draft', command: () => this.setStatusFilter('DRAFT') },
      { label: 'Published', command: () => this.setStatusFilter('PUBLISHED') },
      { label: 'Cancelled', command: () => this.setStatusFilter('CANCELLED') }
    ];
    this.activeTab = this.filterTabs[0]; this.loadEvents(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    if (this.statusFilter !== 'ALL') {
      result = result.filter(e => e.status === this.statusFilter);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e =>
        e.title?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term)
      );
    }
    this.filteredEvents = result;
    this.cdr.detectChanges();
  }

  setStatusFilter(f: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELLED') {
    this.statusFilter = f;
    this.applyFilter();
  }

  onTabChange(item: any) {
    this.activeTab = item;
  }

  publish(eventId: number) {
    if (this.publishing.has(eventId)) return;
    this.publishing.add(eventId);
    this.eventService.publishEvent(eventId).subscribe({
      next: () => {
        const event = this.events.find(e => e.eventId === eventId);
        if (event) event.status = 'PUBLISHED';
        this.publishing.delete(eventId);
        this.applyFilter();
        this.toastr.success('Event published successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.publishing.delete(eventId);
        this.toastr.error(err.error?.error || 'Failed to publish event');
      }
    });
  }

  cancelEvent(eventId: number) {
    if (this.cancelling.has(eventId)) return;
    if (!confirm('Cancel this event? Registered students will be notified.')) return;
    this.cancelling.add(eventId);
    this.eventService.cancelEvent(eventId).subscribe({
      next: () => {
        const event = this.events.find(e => e.eventId === eventId);
        if (event) event.status = 'CANCELLED';
        this.cancelling.delete(eventId);
        this.applyFilter();
        this.toastr.success('Event cancelled');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancelling.delete(eventId);
        this.toastr.error(err.error?.error || 'Failed to cancel event');
      }
    });
  }

  cancel(eventId: number) {
    this.cancelEvent(eventId);
  }

  get draftCount()     { return this.events.filter(e => e.status === 'DRAFT').length; }
  get publishedCount() { return this.events.filter(e => e.status === 'PUBLISHED').length; }
  get cancelledCount() { return this.events.filter(e => e.status === 'CANCELLED').length; }

  formatDate(date: string): string {
    if (!date) return 'Date TBA';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getBannerColor(id: number): string {
    return ['bv1','bv2','bv3','bv4','bv5','bv6'][(id || 0) % 6];
  }
}
