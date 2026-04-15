import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginRequest { email: string; password: string; }
interface LoginResponse { token: string; role: string; userId: number; fullName: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);
        localStorage.setItem('userId', String(res.userId));
        localStorage.setItem('fullName', res.fullName);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  getRole(): string | null { return localStorage.getItem('role'); }
  getFullName(): string | null { return localStorage.getItem('fullName'); }
  getUserId(): string | null { return localStorage.getItem('userId'); }
  isLoggedIn(): boolean { return !!this.getToken(); }

  updateFullName(name: string): void {
    localStorage.setItem('fullName', name);
  }

  logout() {
    localStorage.clear();
  }
}
