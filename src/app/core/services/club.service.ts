import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClubService {

  private apiUrl = `${environment.apiUrl}/api/clubs`;
  private adminUrl = `${environment.apiUrl}/api/admin/clubs`;

  private myClub$ = new BehaviorSubject<any>(undefined);

  constructor(private http: HttpClient) {}

  getAllClubs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getMyClub(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`).pipe(
      tap(res => this.myClub$.next(res))
    );
  }

  getMyClubStream(): Observable<any> {
    return this.myClub$.asObservable();
  }

  refreshMyClub(): void {
    this.getMyClub().subscribe();
  }

  clearClubCache(): void {
    this.myClub$.next(undefined);
  }

  createClub(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      tap(() => this.refreshMyClub())
    );
  }

  // Admin
  getPendingClubs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}/pending`);
  }

  getAllAdminClubs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminUrl}`);
  }

  approveClub(clubId: number): Observable<any> {
    return this.http.put(`${this.adminUrl}/${clubId}/approve`, {});
  }

  rejectClub(clubId: number): Observable<any> {
    return this.http.put(`${this.adminUrl}/${clubId}/reject`, {});
  }

  resetClubToPending(clubId: number): Observable<any> {
    return this.http.put(`${this.adminUrl}/${clubId}/reset`, {});
  }
}
