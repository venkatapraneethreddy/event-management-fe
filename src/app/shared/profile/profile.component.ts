import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, TagModule, AvatarModule, MessageModule, DividerModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  profile: any = null;
  loading = true;

  nameForm!: FormGroup;
  passwordForm!: FormGroup;

  savingName = false;
  savingPassword = false;
  nameSuccess = '';
  passwordSuccess = '';
  passwordError = '';

  private apiUrl = `${environment.apiUrl}/api/profile`;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.nameForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });
  }

  private passwordsMatch(group: FormGroup) {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return np === cp ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (data) => {
        this.profile = data;
        this.nameForm.patchValue({ fullName: data.fullName });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Could not load profile');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveName() {
    if (this.nameForm.invalid) { this.nameForm.markAllAsTouched(); return; }
    this.savingName = true;
    this.nameSuccess = '';

    this.http.put<any>(`${this.apiUrl}/name`, this.nameForm.value).subscribe({
      next: (updated) => {
        this.profile.fullName = updated.fullName;
        // Keep localStorage in sync — AuthService method so sidebar updates everywhere
        this.authService.updateFullName(updated.fullName);
        this.savingName = false;
        this.nameSuccess = 'Name updated successfully';
        this.cdr.detectChanges();
        this.toastr.success('Name updated');
      },
      error: (err) => {
        this.savingName = false;
        this.toastr.error(err.error?.error || err.error || 'Failed to update name');
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.http.put(`${this.apiUrl}/password`, { currentPassword, newPassword },
      { responseType: 'text' }).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordSuccess = 'Password changed successfully';
        this.cdr.detectChanges();
        this.passwordForm.reset();
        this.toastr.success('Password changed');
      },
      error: (err) => {
        this.savingPassword = false;
        this.passwordError = err.error?.error || err.error || 'Failed to change password';
      }
    });
  }

  getRoleBadgeClass(): string {
    return this.profile?.role?.toLowerCase() ?? '';
  }
}
