import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { FormsModule } from '@angular/forms';
import { ClubService } from '../../core/services/club.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-club-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, TableModule, IconFieldModule, InputIconModule, InputTextModule, AvatarModule, SkeletonModule, MessageModule],
  templateUrl: './club-approvals.component.html',
  styleUrl: './club-approvals.component.scss'
})
export class ClubApprovalsComponent implements OnInit {

  clubs: any[] = [];
  filteredClubs: any[] = [];
  loading = true;
  processingId: number | null = null;
  statusFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  searchTerm = '';

  constructor(
    private clubService: ClubService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs() {
    this.loading = true;
    this.clubService.getAllAdminClubs().subscribe({
      next: (data: any[]) => {
        this.clubs = data;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Failed to load clubs');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    let result = this.clubs;
    if (this.statusFilter !== 'ALL') {
      result = result.filter(c => c.status === this.statusFilter);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.clubName?.toLowerCase().includes(term) ||
        c.createdBy?.fullName?.toLowerCase().includes(term) ||
        c.createdBy?.email?.toLowerCase().includes(term)
      );
    }
    this.filteredClubs = result;
  }

  setFilter(f: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') {
    this.statusFilter = f;
    this.applyFilter();
  }

  approve(clubId: number) {
    this.processingId = clubId;
    this.clubService.approveClub(clubId).subscribe({
      next: () => {
        const club = this.clubs.find(c => c.clubId === clubId);
        if (club) club.status = 'APPROVED';
        this.applyFilter();
        this.processingId = null;
        this.cdr.detectChanges();
        this.toastr.success('Club approved successfully');
      },
      error: () => {
        this.processingId = null;
        this.toastr.error('Approval failed');
      }
    });
  }

  reject(clubId: number) {
    this.processingId = clubId;
    this.clubService.rejectClub(clubId).subscribe({
      next: () => {
        const club = this.clubs.find(c => c.clubId === clubId);
        if (club) club.status = 'REJECTED';
        this.applyFilter();
        this.processingId = null;
        this.cdr.detectChanges();
        this.toastr.warning('Club rejected');
      },
      error: () => {
        this.processingId = null;
        this.toastr.error('Rejection failed');
      }
    });
  }

  resetToPending(clubId: number) {
    this.processingId = clubId;
    this.clubService.resetClubToPending(clubId).subscribe({
      next: () => {
        const club = this.clubs.find(c => c.clubId === clubId);
        if (club) club.status = 'PENDING';
        this.applyFilter();
        this.processingId = null;
        this.cdr.detectChanges();
        this.toastr.info('Club reset to pending review');
      },
      error: () => {
        this.processingId = null;
        this.toastr.error('Reset failed');
      }
    });
  }

  get pendingCount()  { return this.clubs.filter(c => c.status === 'PENDING').length; }
  get approvedCount() { return this.clubs.filter(c => c.status === 'APPROVED').length; }
  get rejectedCount() { return this.clubs.filter(c => c.status === 'REJECTED').length; }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  }

  getAvatarColor(id: number): string {
    return ['av1','av2','av3','av4','av5','av6'][id % 6];
  }
}
