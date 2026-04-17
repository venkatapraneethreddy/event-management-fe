import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, SkeletonModule, TooltipModule],
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
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card" [class.active]="statusFilter==='ALL'" (click)="setFilter('ALL')">
        <div class="stat-icon brand"><i class="pi pi-calendar"></i></div>
        <div><span class="stat-num">{{ events.length }}</span><span class="stat-lbl">All Events</span></div>
      </div>
      <div class="stat-card" [class.active]="statusFilter==='PUBLISHED'" (click)="setFilter('PUBLISHED')">
        <div class="stat-icon green"><i class="pi pi-globe"></i></div>
        <div><span class="stat-num">{{ publishedCount }}</span><span class="stat-lbl">Published</span></div>
      </div>
      <div class="stat-card" [class.active]="statusFilter==='DRAFT'" (click)="setFilter('DRAFT')">
        <div class="stat-icon amber"><i class="pi pi-file-edit"></i></div>
        <div><span class="stat-num">{{ draftCount }}</span><span class="stat-lbl">Draft</span></div>
      </div>
      <div class="stat-card" [class.active]="statusFilter==='CANCELLED'" (click)="setFilter('CANCELLED')">
        <div class="stat-icon danger"><i class="pi pi-ban"></i></div>
        <div><span class="stat-num">{{ cancelledCount }}</span><span class="stat-lbl">Cancelled</span></div>
      </div>
    </div>

    <!-- Table card -->
    <div class="table-card">
      <div class="tbl-header">
        <div class="search-wrap">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Search events or clubs…" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
        </div>
        <span class="count-badge">{{ filteredEvents.length }} events</span>
      </div>

      <div class="tbl-scroll">
        <table class="ev-table">
          <thead>
            <tr>
              <th style="width:44px">#</th>
              <th>Event</th>
              <th>Club</th>
              <th>Date</th>
              <th class="center">Regs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ev of pagedEvents; let i = index" class="ev-row">
              <td class="row-num">{{ (currentPage-1)*pageSize + i + 1 }}</td>
              <td>
                <div class="ev-name">{{ ev.title }}</div>
                <div class="ev-sub">{{ ev.paid ? '₹' + ev.fee : 'Free' }} · {{ ev.location || 'TBA' }}</div>
              </td>
              <td><span class="club-chip">{{ ev.club?.clubName || '—' }}</span></td>
              <td class="date-cell">{{ formatDate(ev.eventDate) }}</td>
              <td class="center reg-count">{{ ev.registrationCount ?? 0 }}</td>
              <td>
                <span class="status-badge" [ngClass]="ev.status?.toLowerCase()">
                  {{ ev.status }}
                </span>
              </td>
              <td>
                <div class="action-btns">
                  <button *ngIf="ev.status === 'DRAFT'" class="act-btn green"
                    pTooltip="Publish Event" tooltipPosition="top"
                    [disabled]="publishing.has(ev.eventId)"
                    (click)="publishEvent(ev.eventId)">
                    <i class="pi" [class.pi-send]="!publishing.has(ev.eventId)" [class.pi-spin]="publishing.has(ev.eventId)" [class.pi-spinner]="publishing.has(ev.eventId)"></i>
                    <span *ngIf="!publishing.has(ev.eventId)">Publish</span>
                    <span *ngIf="publishing.has(ev.eventId)">Publishing…</span>
                  </button>
                  <button *ngIf="ev.status !== 'CANCELLED'" class="act-btn red"
                    pTooltip="Cancel Event" tooltipPosition="top"
                    [disabled]="cancelling.has(ev.eventId)"
                    (click)="confirmCancel(ev)">
                    <i class="pi" [class.pi-ban]="!cancelling.has(ev.eventId)" [class.pi-spin]="cancelling.has(ev.eventId)" [class.pi-spinner]="cancelling.has(ev.eventId)"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="pagedEvents.length === 0">
              <td colspan="7" class="empty-row">No events match your filter.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tbl-footer">
        <app-pagination [totalItems]="filteredEvents.length" [pageSize]="pageSize"
          [currentPage]="currentPage" (pageChange)="onPageChange($event)"></app-pagination>
      </div>
    </div>
  </ng-container>

  <!-- Confirm cancel modal -->
  <div class="modal-backdrop" *ngIf="cancelTarget" (click)="cancelTarget=null"></div>
  <div class="confirm-modal" *ngIf="cancelTarget">
    <div class="cm-icon"><i class="pi pi-exclamation-triangle"></i></div>
    <h3>Cancel Event?</h3>
    <p>Cancel <strong>"{{ cancelTarget.title }}"</strong>? This cannot be undone.</p>
    <div class="cm-actions">
      <button class="cm-btn secondary" (click)="cancelTarget=null">Keep</button>
      <button class="cm-btn danger" [disabled]="cancelling.has(cancelTarget.eventId)" (click)="doCancelEvent(cancelTarget.eventId, cancelTarget.title)">
        <i class="pi pi-ban"></i> Cancel Event
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .admin-events { min-height:100vh; padding:28px 32px; max-width:1260px; margin:0 auto; animation: pageIn .3s cubic-bezier(.22,1,.36,1) both; background:#080d1c; }
    @keyframes pageIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .page-header { margin-bottom:24px; h1 { font-size:24px; font-weight:800; color:#f1f5f9; letter-spacing:-.04em; } p { font-size:13.5px; color:rgba(255,255,255,.38); margin-top:5px; } }

    /* Stats */
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
    @media (max-width:640px) { .stats-row { grid-template-columns:repeat(2,1fr); } }
    .stat-card { background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.08); border-radius:16px; padding:16px 18px; cursor:pointer; transition:all .25s; display:flex; align-items:center; gap:12px; }
    .stat-card:hover { border-color:rgba(255,255,255,.15); transform:translateY(-2px); }
    .stat-card.active { border-color:rgba(99,102,241,.4); background:rgba(99,102,241,.1); .stat-num { color:#a5b4fc; } }
    .stat-icon { width:42px; height:42px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; i { font-size:18px; } }
    .stat-icon.brand  { background:rgba(99,102,241,.15); i { color:#a5b4fc; } }
    .stat-icon.green  { background:rgba(5,150,105,.15);  i { color:#6ee7b7; } }
    .stat-icon.amber  { background:rgba(217,119,6,.15);  i { color:#fcd34d; } }
    .stat-icon.danger { background:rgba(239,68,68,.15);  i { color:#fca5a5; } }
    .stat-num { display:block; font-size:22px; font-weight:900; color:#f1f5f9; letter-spacing:-.05em; line-height:1; transition:color .2s; }
    .stat-lbl { display:block; font-size:11.5px; color:rgba(255,255,255,.35); font-weight:500; margin-top:3px; }

    /* Table card */
    .table-card { background:rgba(15,20,40,.88); border:1px solid rgba(255,255,255,.08); border-radius:20px; overflow:hidden; }
    .tbl-header { display:flex; align-items:center; gap:16px; padding:16px 20px; border-bottom:1px solid rgba(255,255,255,.07); flex-wrap:wrap; }
    .search-wrap { flex:1; min-width:220px; position:relative; display:flex; align-items:center;
      i { position:absolute; left:12px; color:rgba(255,255,255,.28); font-size:13px; }
      input { width:100%; padding:9px 14px 9px 36px; background:rgba(255,255,255,.07); border:1.5px solid rgba(255,255,255,.1); border-radius:11px; color:#e2e8f0; font-size:13.5px; outline:none; transition:all .2s; font-family:inherit;
        &::placeholder { color:rgba(255,255,255,.28); }
        &:focus { background:rgba(255,255,255,.1); border-color:rgba(99,102,241,.55); box-shadow:0 0 0 3px rgba(99,102,241,.12); }
      }
    }
    .count-badge { font-size:12.5px; color:rgba(255,255,255,.35); font-weight:500; white-space:nowrap; }

    .tbl-scroll { overflow-x:auto; }
    .ev-table { width:100%; border-collapse:collapse; min-width:700px;
      th { padding:11px 14px; text-align:left; font-size:10.5px; font-weight:800; color:rgba(255,255,255,.3); letter-spacing:.07em; text-transform:uppercase; background:rgba(255,255,255,.02); border-bottom:1px solid rgba(255,255,255,.07); }
      td { padding:13px 14px; border-bottom:1px solid rgba(255,255,255,.05); }
    }
    .ev-row { transition:background .2s; &:hover { background:rgba(255,255,255,.03); } }
    .row-num { font-size:12px; color:rgba(255,255,255,.2); }
    .ev-name { font-size:14px; font-weight:600; color:#f1f5f9; }
    .ev-sub  { font-size:12px; color:rgba(255,255,255,.35); margin-top:2px; }
    .club-chip { padding:3px 10px; border-radius:99px; font-size:11.5px; background:rgba(99,102,241,.15); color:#a5b4fc; border:1px solid rgba(99,102,241,.2); }
    .date-cell { font-size:12.5px; color:rgba(255,255,255,.38); }
    .center { text-align:center; }
    .reg-count { font-weight:700; color:#f1f5f9; }
    .status-badge { padding:3px 10px; border-radius:99px; font-size:10.5px; font-weight:700;
      &.published { background:rgba(16,185,129,.15); color:#6ee7b7; border:1px solid rgba(16,185,129,.2); }
      &.draft     { background:rgba(245,158,11,.12);  color:#fcd34d; border:1px solid rgba(245,158,11,.2); }
      &.cancelled { background:rgba(239,68,68,.12);   color:#fca5a5; border:1px solid rgba(239,68,68,.2); }
    }
    .action-btns { display:flex; gap:7px; align-items:center; }
    .act-btn { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:9px; border:none; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .22s; font-family:inherit;
      &.green { background:rgba(16,185,129,.12); color:#6ee7b7; border:1px solid rgba(16,185,129,.2); &:hover { background:rgba(16,185,129,.22); } }
      &.red   { background:rgba(239,68,68,.1);  color:#fca5a5; border:1px solid rgba(239,68,68,.18); padding:6px; &:hover { background:rgba(239,68,68,.2); } }
      &:disabled { opacity:.4; cursor:not-allowed; }
    }
    .empty-row { text-align:center; padding:40px; color:rgba(255,255,255,.25); font-size:13.5px; }
    .tbl-footer { padding:12px 20px; border-top:1px solid rgba(255,255,255,.07); }

    /* Modal */
    .modal-backdrop { position:fixed; inset:0; z-index:400; background:rgba(0,0,0,.7); backdrop-filter:blur(8px); }
    .confirm-modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:401; background:rgba(15,20,40,.98); border:1px solid rgba(255,255,255,.12); border-radius:24px; padding:36px; width:400px; max-width:90vw; text-align:center; box-shadow:0 40px 100px rgba(0,0,0,.7); backdrop-filter:blur(28px); animation:modalIn .3s cubic-bezier(.22,1,.36,1); }
    @keyframes modalIn { from { opacity:0; transform:translate(-50%,-50%) scale(.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
    .cm-icon { width:56px; height:56px; border-radius:50%; background:rgba(239,68,68,.12); border:2px solid rgba(239,68,68,.25); display:flex; align-items:center; justify-content:center; margin:0 auto 18px; i { font-size:22px; color:#ef4444; } }
    .confirm-modal h3 { font-size:18px; font-weight:800; color:#f1f5f9; margin-bottom:10px; }
    .confirm-modal p { font-size:13.5px; color:rgba(255,255,255,.45); line-height:1.65; margin-bottom:24px; strong { color:rgba(255,255,255,.75); } }
    .cm-actions { display:flex; gap:10px; }
    .cm-btn { flex:1; padding:12px; border-radius:12px; border:none; font-size:14px; font-weight:700; cursor:pointer; transition:all .25s; display:flex; align-items:center; justify-content:center; gap:8px; font-family:inherit;
      &.secondary { background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); color:rgba(255,255,255,.6); &:hover { background:rgba(255,255,255,.12); } }
      &.danger { background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; box-shadow:0 6px 20px rgba(220,38,38,.35); &:hover { transform:translateY(-1px); } &:disabled { opacity:.5; cursor:not-allowed; transform:none; } }
    }
  `]
})
export class AdminEventsComponent implements OnInit {
  events: any[] = [];
  filteredEvents: any[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = 'ALL';

  publishing = new Set<number>();
  cancelling = new Set<number>();
  cancelTarget: any = null;

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

  setFilter(f: string) { this.statusFilter = f; this.applyFilter(); }

  applyFilter() {
    this.currentPage = 1;
    let result = this.events;
    if (this.statusFilter !== 'ALL') result = result.filter(e => e.status === this.statusFilter);
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase();
      result = result.filter(e => e.title?.toLowerCase().includes(t) || e.club?.clubName?.toLowerCase().includes(t));
    }
    this.filteredEvents = result;
    this.cdr.detectChanges();
  }

  publishEvent(eventId: number) {
    if (this.publishing.has(eventId)) return;
    this.publishing.add(eventId);
    this.cdr.detectChanges();
    this.adminService.publishEvent(eventId).subscribe({
      next: () => {
        const ev = this.events.find(e => e.eventId === eventId);
        if (ev) ev.status = 'PUBLISHED';
        this.publishing.delete(eventId);
        this.applyFilter();
        this.toastr.success('Event published');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.publishing.delete(eventId);
        this.toastr.error(err.error?.error || 'Failed to publish');
        this.cdr.detectChanges();
      }
    });
  }

  confirmCancel(event: any) { this.cancelTarget = event; }

  doCancelEvent(eventId: number, title: string) {
    if (this.cancelling.has(eventId)) return;
    this.cancelling.add(eventId);
    this.cdr.detectChanges();
    this.adminService.cancelEvent(eventId).subscribe({
      next: () => {
        const ev = this.events.find(e => e.eventId === eventId);
        if (ev) ev.status = 'CANCELLED';
        this.cancelling.delete(eventId);
        this.cancelTarget = null;
        this.applyFilter();
        this.toastr.warning('Event cancelled');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancelling.delete(eventId);
        this.toastr.error(err.error?.error || 'Failed to cancel');
        this.cdr.detectChanges();
      }
    });
  }

  get pagedEvents() { const s = (this.currentPage-1)*this.pageSize; return this.filteredEvents.slice(s,s+this.pageSize); }
  onPageChange(p: number) { this.currentPage = p; }
  get publishedCount() { return this.events.filter(e => e.status==='PUBLISHED').length; }
  get draftCount()     { return this.events.filter(e => e.status==='DRAFT').length; }
  get cancelledCount() { return this.events.filter(e => e.status==='CANCELLED').length; }
  formatDate(d: string) { if(!d) return 'TBA'; return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
}
