import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, PaginationComponent,
    ButtonModule, InputTextModule, TagModule, TableModule,
    IconFieldModule, InputIconModule, SkeletonModule, ChipModule,
    TooltipModule, AvatarModule
  ],
  template: `
<div class="admin-events">
  <div class="page-header">
    <div>
      <h1>All Events</h1>
      <p>View and moderate all events across every club on the platform.</p>
    </div>
  </div>

  <ng-container *ngIf="loading">
    <div class="stats-row"><p-skeleton *ngFor="let i of [1,2,3,4]" height="76px" borderRadius="14px"></p-skeleton></div>
    <p-skeleton height="400px" borderRadius="14px"></p-skeleton>
  </ng-container>

  <ng-container *ngIf="!loading">
    <div class="stats-row">
      <div class="stat-card" [class.active]="statusFilter==='ALL'" (click)="statusFilter='ALL'; applyFilter()">
        <div class="stat-icon brand"><i class="pi pi-calendar"></i></div>
        <div><span class="stat-num">{{ events.length }}</span><span class="stat-lbl">All Events</span></div>
      </div>
      <div class="stat-card" [class.active]="statusFilter==='PUBLISHED'" (click)="statusFilter='PUBLISHED'; applyFilter()">
        <div class="stat-icon green"><i class="pi pi-globe"></i></div>
        <div><span class="stat-num">{{ publishedCount }}</span><span class="stat-lbl">Published</span></div>
      </div>
      <div class="stat-card" [class.active]="statusFilter==='DRAFT'" (click)="statusFilter='DRAFT'; applyFilter()">
        <div class="stat-icon amber"><i class="pi pi-file-edit"></i></div>
        <div><span class="stat-num">{{ draftCount }}</span><span class="stat-lbl">Draft</span></div>
      </div>
      <div class="stat-card" [class.active]="statusFilter==='CANCELLED'" (click)="statusFilter='CANCELLED'; applyFilter()">
        <div class="stat-icon danger"><i class="pi pi-ban"></i></div>
        <div><span class="stat-num">{{ cancelledCount }}</span><span class="stat-lbl">Cancelled</span></div>
      </div>
    </div>

    <div class="card table-card" style="padding:0; overflow:hidden;">
      <div class="tbl-header">
        <p-iconfield>
          <p-inputicon styleClass="pi pi-search" />
          <input pInputText type="text" placeholder="Search events or clubs…"
            [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
        </p-iconfield>
        <span class="count-badge">{{ filteredEvents.length }} events</span>
      </div>

      <p-table [value]="pagedEvents" styleClass="p-datatable-sm" [tableStyle]="{'min-width':'700px'}">
        <ng-template pTemplate="header">
          <tr>
            <th style="width:44px">#</th>
            <th>Event</th>
            <th>Club</th>
            <th>Date</th>
            <th style="text-align:center">Registrations</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-ev let-i="rowIndex">
          <tr>
            <td class="row-num">{{ (currentPage-1)*pageSize + i + 1 }}</td>
            <td>
              <div class="ev-name">{{ ev.title }}</div>
              <div class="ev-meta-sm">{{ ev.paid ? '₹' + ev.fee : 'Free' }} &middot; {{ ev.location || 'TBA' }}</div>
            </td>
            <td>
              <p-chip [label]="ev.club?.clubName || '—'" styleClass="club-chip"></p-chip>
            </td>
            <td class="date-cell">{{ formatDate(ev.eventDate) }}</td>
            <td style="text-align:center;font-weight:700;color:var(--n-700)">{{ ev.registrationCount ?? 0 }}</td>
            <td>
              <p-tag
                [value]="ev.status"
                [severity]="ev.status === 'PUBLISHED' ? 'success' : ev.status === 'DRAFT' ? 'warning' : 'danger'"
              ></p-tag>
            </td>
            <td>
              <div class="action-btns">
                <p-button *ngIf="ev.status === 'DRAFT'" label="Publish" icon="pi pi-send" size="small" severity="success"
                  [loading]="processingId === ev.eventId" (onClick)="publishEvent(ev.eventId)"></p-button>
                <p-button *ngIf="ev.status !== 'CANCELLED'" icon="pi pi-ban" size="small" severity="danger"
                  [text]="true" pTooltip="Cancel event" tooltipPosition="top"
                  [loading]="processingId === ev.eventId" (onClick)="cancelEvent(ev.eventId, ev.title)"></p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--n-400)">No events match your filter.</td></tr>
        </ng-template>
      </p-table>

      <div class="tbl-footer">
        <app-pagination [totalItems]="filteredEvents.length" [pageSize]="pageSize"
          [currentPage]="currentPage" (pageChange)="onPageChange($event)"></app-pagination>
      </div>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    .admin-events { animation: pageFadeIn .28s cubic-bezier(.4,0,.2,1) both; }
    @keyframes pageFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .page-header { margin-bottom:24px; }
    .page-header h1 { font-size:22px; font-weight:700; color:var(--n-800); letter-spacing:-.025em; }
    .page-header p  { font-size:13.5px; color:var(--n-400); margin-top:4px; }
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    .stat-card { background:var(--surface); border:1.5px solid var(--border); border-radius:14px; padding:16px 18px; cursor:pointer; transition:all .12s cubic-bezier(.4,0,.2,1); display:flex; align-items:center; gap:12px; }
    .stat-card:hover { border-color:var(--n-300); box-shadow:0 1px 3px rgba(15,23,42,.08); }
    .stat-card.active { border-color:var(--brand); background:var(--brand-bg); }
    .stat-card.active .stat-num { color:var(--brand); }
    .stat-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon i { font-size:17px; }
    .stat-icon.brand  { background:var(--brand-bg); } .stat-icon.brand i { color:var(--brand); }
    .stat-icon.green  { background:var(--success-bg); } .stat-icon.green i { color:var(--success); }
    .stat-icon.amber  { background:var(--warning-bg); } .stat-icon.amber i { color:var(--warning); }
    .stat-icon.danger { background:var(--danger-bg); } .stat-icon.danger i { color:var(--danger); }
    .stat-num { display:block; font-size:22px; font-weight:800; color:var(--n-800); letter-spacing:-.04em; line-height:1; }
    .stat-lbl { display:block; font-size:11.5px; color:var(--n-400); font-weight:500; margin-top:2px; }
    .tbl-header { display:flex; align-items:center; gap:16px; padding:16px 20px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
    .count-badge { font-size:12.5px; color:var(--n-400); font-weight:500; }
    .ev-name { font-size:14px; font-weight:600; color:var(--n-800); }
    .ev-meta-sm { font-size:12px; color:var(--n-400); margin-top:2px; }
    ::ng-deep .club-chip { font-size:11.5px !important; padding:3px 10px !important; background:var(--n-100) !important; }
    .date-cell { font-size:12.5px; color:var(--n-500); }
    .row-num { font-size:12px; color:var(--n-300); }
    .action-btns { display:flex; gap:6px; align-items:center; }
    .tbl-footer { padding:12px 20px; border-top:1px solid var(--border); }
  `]
})
export class AdminEventsComponent implements OnInit {
  events: any[] = [];
  filteredEvents: any[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = 'ALL';
  processingId: number | null = null;
  currentPage = 1;
  readonly pageSize = 15;

  constructor(private adminService: AdminService, private toastr: ToastrService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadEvents(); }

  loadEvents() {
    this.loading = true;
    this.adminService.getAllEvents().subscribe({
      next: (data) => { this.events = data; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.toastr.error('Failed to load events'); this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter() {
    this.currentPage = 1;
    let result = this.events;
    if (this.statusFilter !== 'ALL') result = result.filter(e => e.status === this.statusFilter);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e => e.title?.toLowerCase().includes(term) || e.club?.clubName?.toLowerCase().includes(term));
    }
    this.filteredEvents = result;
  }

  publishEvent(eventId: number) {
    this.processingId = eventId;
    this.adminService.publishEvent(eventId).subscribe({
      next: () => { const ev = this.events.find(e => e.eventId === eventId); if (ev) ev.status = 'PUBLISHED'; this.applyFilter(); this.processingId = null; this.toastr.success('Event published'); },
      error: () => { this.processingId = null; this.toastr.error('Failed to publish'); }
    });
  }

  cancelEvent(eventId: number, title: string) {
    if (!confirm(`Cancel event "${title}"? This cannot be undone.`)) return;
    this.processingId = eventId;
    this.adminService.cancelEvent(eventId).subscribe({
      next: () => { const ev = this.events.find(e => e.eventId === eventId); if (ev) ev.status = 'CANCELLED'; this.applyFilter(); this.processingId = null; this.toastr.warning('Event cancelled'); },
      error: () => { this.processingId = null; this.toastr.error('Failed to cancel'); }
    });
  }

  get pagedEvents() { const start = (this.currentPage - 1) * this.pageSize; return this.filteredEvents.slice(start, start + this.pageSize); }
  onPageChange(page: number) { this.currentPage = page; }
  get publishedCount() { return this.events.filter(e => e.status === 'PUBLISHED').length; }
  get draftCount() { return this.events.filter(e => e.status === 'DRAFT').length; }
  get cancelledCount() { return this.events.filter(e => e.status === 'CANCELLED').length; }
  formatDate(date: string): string { if (!date) return 'TBA'; return new Date(date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
}
