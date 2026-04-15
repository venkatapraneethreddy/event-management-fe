import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {

  private apiUrl = `${environment.apiUrl}/api/events`;

  constructor(private http: HttpClient) {}

  getPublishedEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getEventById(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${eventId}`);
  }

  createEvent(clubId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clubId}`, data);
  }

  getMyEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`);
  }

  publishEvent(eventId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${eventId}/publish`, {});
  }

  updateEvent(eventId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${eventId}`, data);
  }

  cancelEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${eventId}`);
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/organizer/analytics`);
  }

  uploadEventImage(eventId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/image`, formData);
  }
}
