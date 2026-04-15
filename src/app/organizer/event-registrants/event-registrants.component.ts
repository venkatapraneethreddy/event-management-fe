import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-registrants',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent, ButtonModule, TagModule, AvatarModule, TableModule, IconFieldModule, InputIconModule, InputTextModule, TooltipModule],
  templateUrl: './event-registrants.component.html',
  styleUrls: ['./event-registrants.component.scss']
})
export class EventRegistrantsComponent implements OnInit, OnDestroy {

  eventId!: number;
  eventTitle = '';
  registrants: any[] = [];
  filteredRegistrants: any[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = 'ALL';
  exportingCsv = false;
  attendanceCount: number | null = null;

  currentPage = 1;
  readonly pageSize = 20;

  private destroy$ = new Subject<void>();

  get pagedRegistrants(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRegistrants.slice(start, start + this.pageSize);
  }

  get confirmedCount(): number {
    return this.registrants.filter(r => r.status === 'CONFIRMED').length;
  }

  get pendingCount(): number {
    return this.registrants.filter(r => r.status === 'PENDING_PAYMENT').length;
  }

  onPageChange(page: number) { this.currentPage = page; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          this.eventId = Number(params['eventId']);
          this.loading = true;
          return this.http.get<any[]>(`${environment.apiUrl}/api/registrations/event/${this.eventId}`);
        })
      )
      .subscribe({
        next: (data) => {
          this.registrants = data;
          this.filteredRegistrants = data;
          // Grab event title from first registrant if available
          this.eventTitle = data[0]?.event?.title || '';
          this.loading = false;
          this.cdr.detectChanges();
          // Load attendance count independently
          this.http.get<any>(`${environment.apiUrl}/api/attendance/event/${this.eventId}/count`)
            .subscribe({
              next: (res) => { this.attendanceCount = res.attendanceCount; this.cdr.detectChanges(); },
              error: () => {}
            });
        },
        error: (err) => {
          this.toastr.error(err.error?.error || 'Failed to load registrants');
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  applyFilter() {
    this.currentPage = 1;
    const term = this.searchTerm.toLowerCase().trim();
    let result = this.registrants;
    if (this.statusFilter !== 'ALL') result = result.filter((r: any) => r.status === this.statusFilter);
    if (term) result = result.filter((r: any) =>
      r.studentName?.toLowerCase().includes(term) ||
      r.studentEmail?.toLowerCase().includes(term)
    );
    this.filteredRegistrants = result;
  }

  exportCsv() {
    if (this.exportingCsv) return;
    this.exportingCsv = true;
    this.http.get(`${environment.apiUrl}/api/registrations/event/${this.eventId}/export`,
      { responseType: 'blob' }
    ).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `registrants-event-${this.eventId}.csv`;
        a.click(); URL.revokeObjectURL(url);
        this.exportingCsv = false;
      },
      error: () => { this.toastr.error('Failed to export CSV'); this.exportingCsv = false; }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  goBack() { this.router.navigate(['/organizer/my-events']); }
}