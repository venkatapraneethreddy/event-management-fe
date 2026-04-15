import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  ButtonModule,
  MessageModule,
  CheckboxModule,
  InputTextModule,
  IconFieldModule,
  InputIconModule,
  DividerModule
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  showRegister = false;
  
  showPassword: boolean = false;
  showRegPassword: boolean = false;
  
  loginError = '';
  registerError = '';
  registerSuccess = '';
  isLoading = false;
  sessionExpired = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['STUDENT', Validators.required]
    });

    // Feature 1: detect session expiry redirect
    this.route.queryParams.subscribe(params => {
      this.sessionExpired = params['reason'] === 'session_expired';
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loginError = '';
    this.sessionExpired = false;
    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        const role = res.role;
        if (role === 'STUDENT') this.router.navigate(['/student/dashboard']);
        else if (role === 'ORGANIZER') this.router.navigate(['/organizer/dashboard']);
        else if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = err.error?.error || 'Invalid email or password';
      }
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.registerError = '';
    this.registerSuccess = '';
    this.isLoading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.registerSuccess = 'Account created! You can now log in.';
        this.registerForm.reset({ role: 'STUDENT' });
        setTimeout(() => this.showRegister = false, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.registerError = err.error?.message || 'Registration failed. Try a different email.';
      }
    });
  }

  setRole(role: string) {
    this.registerForm.get('role')?.setValue(role);
  }
}
