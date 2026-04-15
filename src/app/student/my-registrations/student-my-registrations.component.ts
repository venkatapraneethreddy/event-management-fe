import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrationService } from '../../core/services/registration.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-my-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent, SelectButtonModule, TagModule, AvatarModule, ButtonModule, MessageModule, IconFieldModule, InputIconModule, InputTextModule, DialogModule, DividerModule, TooltipModule],
  templateUrl: './student-my-registrations.component.html',
  styleUrls: ['./student-my-registrations.component.scss']
})
export class StudentMyRegistrationsComponent implements OnInit, OnDestroy {

  registrations: any[] = [];
  filteredRegistrations: any[] = [];
  loading = true;
  selectedRegistration: any = null;
  cancelling = new Set<number>();
  paying = new Set<number>();
  downloadingTicket = false;

  searchTerm = '';
  timeFilter: 'all' | 'upcoming' | 'past' = 'all';
  showTicketDialog = false;
  timeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Past', value: 'past' }
  ];

  private destroy$ = new Subject<void>();
  private paymentsApiUrl = `${environment.apiUrl}/api/payments`;

  constructor(
    private registrationService: RegistrationService,
    private toastr: ToastrService,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadRegistrations(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pendingCount(): number {
    return this.registrations.filter(r => r.status === 'PENDING_PAYMENT').length;
  }

  loadRegistrations() {
    this.loading = true;
    this.registrationService.getMyRegistrations()
      .subscribe({
        next: (data) => {
          this.registrations = data.sort((a: any, b: any) =>
            (new Date(a.event?.eventDate).getTime() || 0) -
            (new Date(b.event?.eventDate).getTime() || 0)
          );
          this.applyFilter();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.toastr.error('Failed to load registrations'); this.loading = false; this.cdr.detectChanges(); }
      });
  }

  applyFilter() {
    let result = this.registrations;
    const now = new Date();
    if (this.timeFilter === 'upcoming') result = result.filter(r => r.event?.eventDate && new Date(r.event.eventDate) >= now);
    if (this.timeFilter === 'past')     result = result.filter(r => r.event?.eventDate && new Date(r.event.eventDate) < now);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.event?.title?.toLowerCase().includes(term) ||
        r.event?.club?.clubName?.toLowerCase().includes(term) ||
        r.event?.location?.toLowerCase().includes(term)
      );
    }
    this.filteredRegistrations = result;
  }

  openTicket(reg: any) { this.selectedRegistration = reg; this.showTicketDialog = true; }
  closeTicket() { this.selectedRegistration = null; this.showTicketDialog = false; }

  pay(registrationId: number) {
    if (this.paying.has(registrationId)) return;
    this.paying.add(registrationId);
    this.http.post(`${this.paymentsApiUrl}/${registrationId}`, {}).subscribe({
      next: () => {
        const reg = this.registrations.find(r => r.registrationId === registrationId);
        if (reg) reg.status = 'CONFIRMED';
        this.paying.delete(registrationId);
        this.cdr.detectChanges();
        this.toastr.success('Payment confirmed! Check your email.');
      },
      error: (err) => {
        this.paying.delete(registrationId);
        this.toastr.error(err.error?.error || 'Payment failed. Please try again.');
      }
    });
  }

  cancelRegistration(registrationId: number) {
    if (this.cancelling.has(registrationId)) return;
    if (!confirm('Cancel this registration? This action cannot be undone.')) return;
    this.cancelling.add(registrationId);
    this.registrationService.cancelRegistration(registrationId).subscribe({
      next: () => {
        this.registrations = this.registrations.filter(r => r.registrationId !== registrationId);
        this.applyFilter();
        this.cancelling.delete(registrationId);
        this.cdr.detectChanges();
        this.toastr.success('Registration cancelled');
      },
      error: (err) => {
        this.cancelling.delete(registrationId);
        this.toastr.error(err.error?.error || 'Failed to cancel');
      }
    });
  }

  // PDF ticket download — builds a printable HTML ticket and triggers browser print
  downloadTicket(reg: any) {
    if (this.downloadingTicket) return;
    this.downloadingTicket = true;

    const studentName = this.authService.getFullName() || 'Student';
    const eventTitle  = reg.event?.title?.toUpperCase() || 'EVENT';
    const venue       = reg.event?.location?.toUpperCase() || 'VENUE TBA';
    const date        = this.formatDate(reg.event?.eventDate);
    const club        = reg.event?.club?.clubName || 'EventClub';
    const ticketId    = `#EC-${reg.registrationId}`;
    const fee         = reg.event?.paid ? `₹${reg.event.fee}` : 'FREE';

    // Open a blank popup window with a styled ticket and auto-print
    const win = window.open('', '_blank', 'width=700,height=600');
    if (!win) { this.toastr.warning('Please allow popups to download tickets'); this.downloadingTicket = false; return; }

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket — ${eventTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Inter',sans-serif; background:#f3f4f6; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; }
          .ticket { background:#fff; border-radius:16px; overflow:hidden; width:580px; box-shadow:0 8px 32px rgba(0,0,0,.12); }
          .ticket-top { background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:32px 28px; color:#fff; }
          .ticket-top .badge { display:inline-block; background:rgba(255,255,255,.2); border-radius:20px; padding:4px 14px; font-size:12px; margin-bottom:12px; }
          .ticket-top h1 { font-size:22px; font-weight:700; margin-bottom:6px; }
          .ticket-top p { font-size:14px; opacity:.85; }
          .divider { display:flex; align-items:center; background:#f9fafb; }
          .dot { width:28px; height:28px; border-radius:50%; background:#f3f4f6; flex-shrink:0; }
          .dot.l { margin-left:-14px; }
          .dot.r { margin-right:-14px; }
          .dash { flex:1; border-top:2px dashed #e5e7eb; margin:0 8px; }
          .ticket-body { padding:24px 28px; }
          .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
          .field { }
          .field .lbl { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; margin-bottom:4px; }
          .field .val { font-size:14px; font-weight:600; color:#111827; }
          .qr-section { text-align:center; padding:16px 0; }
          .qr-section img { width:140px; height:140px; }
          .qr-note { font-size:11px; color:#9ca3af; margin-top:8px; }
          .footer { background:#f9fafb; padding:12px 28px; text-align:center; font-size:11px; color:#9ca3af; border-top:1px solid #e5e7eb; }
          @media print { body { background:#fff; padding:0; } .ticket { box-shadow:none; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-top">
            <div class="badge">CONFIRMED TICKET</div>
            <h1>${eventTitle}</h1>
            <p>Organized by ${club}</p>
          </div>
          <div class="divider"><div class="dot l"></div><div class="dash"></div><div class="dot r"></div></div>
          <div class="ticket-body">
            <div class="grid">
              <div class="field"><div class="lbl">Attendee</div><div class="val">${studentName}</div></div>
              <div class="field"><div class="lbl">Ticket ID</div><div class="val">${ticketId}</div></div>
              <div class="field"><div class="lbl">Date & Time</div><div class="val">${date}</div></div>
              <div class="field"><div class="lbl">Venue</div><div class="val">${venue}</div></div>
              <div class="field"><div class="lbl">Fee</div><div class="val">${fee}</div></div>
              <div class="field"><div class="lbl">Club</div><div class="val">${club}</div></div>
            </div>
            <div class="qr-section">
              <p style="font-size:12px;color:#6b7280;margin-bottom:8px">Scan at entrance</p>
              <p style="font-size:10px;color:#9ca3af;font-family:monospace">${reg.qrCode || ticketId}</p>
              <p class="qr-note">Show this ticket at the entrance. Valid for single use only.</p>
            </div>
          </div>
          <div class="footer">EventClub · Your campus event platform · ${ticketId}</div>
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
    this.downloadingTicket = false;
  }

  isPast(date: string): boolean { return date ? new Date(date) < new Date() : false; }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getBandColor(id: number): string {
    return ['b1','b2','b3','b4','b5','b6'][id % 6];
  }
}