import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {

  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  getAllEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/events`);
  }

  publishEvent(eventId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${eventId}/publish`, {});
  }

  cancelEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}`);
  }
}
