import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, AvatarModule, SkeletonModule, TableModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, TooltipModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  loading = true;
  searchTerm = '';
  roleFilter: 'ALL' | 'STUDENT' | 'ORGANIZER' | 'ADMIN' = 'ALL';
  deletingId: number | null = null;

  currentPage = 1;
  readonly pageSize = 15;

  get pagedUsers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) { this.currentPage = page; }

  constructor(private adminService: AdminService, private toastr: ToastrService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Failed to load users');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    let result = this.users;
    if (this.roleFilter !== 'ALL') result = result.filter(u => u.role === this.roleFilter);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.fullName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    this.filteredUsers = result;
    this.currentPage = 1;
  }

  deleteUser(userId: number, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    this.deletingId = userId;
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.userId !== userId);
        this.applyFilter();
        this.deletingId = null;
        this.cdr.detectChanges();
        this.toastr.success('User deleted');
      },
      error: (err) => {
        this.deletingId = null;
        this.toastr.error(err.error?.error || 'Failed to delete user');
      }
    });
  }

  get studentCount() { return this.users.filter(u => u.role === 'STUDENT').length; }
  get organizerCount() { return this.users.filter(u => u.role === 'ORGANIZER').length; }
  get adminCount() { return this.users.filter(u => u.role === 'ADMIN').length; }

  getAvatarClass(role: string): string { return role.toLowerCase(); }
}
