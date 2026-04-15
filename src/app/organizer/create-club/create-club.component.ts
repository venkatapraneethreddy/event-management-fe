import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClubService } from '../../core/services/club.service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-create-club',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, TagModule, AvatarModule, MessageModule, InputTextModule, TextareaModule, IconFieldModule, InputIconModule],
  templateUrl: './create-club.component.html',
  styleUrl: './create-club.component.scss',
})
export class CreateClubComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  checking = true;
  success = false;
  error = '';

  existingClub: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private clubService: ClubService,
    public router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      clubName:    ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Always fetch fresh from server — never use stale cached state
    this.clubService.getMyClub().subscribe({
      next: (res: any) => {
        this.existingClub = res?.club ?? null;
        this.checking = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.existingClub = null;
        this.checking = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get errorMsg(): string {
    return this.error;
  }

  get successMsg(): string {
    return this.success ? 'Club submitted successfully. Redirecting to your dashboard...' : '';
  }

  get submitting(): boolean {
    return this.loading;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    this.clubService.createClub(this.form.value).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.toastr.success('Club submitted for approval!');
        // Refresh club data then navigate — so dashboard sees the new club immediately
        this.clubService.getMyClub().subscribe(() => {
          setTimeout(() => this.router.navigate(['/organizer/dashboard']), 1500);
        });
      },
      error: (err) => {
        this.error = err.error?.error || err.error?.message || err.error ||
          'Failed to create club. A club with this name may already exist.';
        this.loading = false;
      }
    });
  }
}
