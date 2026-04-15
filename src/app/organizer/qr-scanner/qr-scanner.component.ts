import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule, MessageModule, InputTextModule],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss']
})
export class QrScannerComponent implements OnDestroy {

  scanning = false;
  cameraError = '';
  stream: MediaStream | null = null;

  manualCode = '';
  submittingManual = false;

  lastResult: any = null;
  resultType: 'success' | 'error' | null = null;
  resultMessage = '';

  private cooldown = false;
  private apiUrl = `${environment.apiUrl}/api/attendance`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  async startCamera() {
    this.cameraError = '';
    this.lastResult = null;
    this.resultType = null;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.scanning = true;
      setTimeout(() => this.attachStreamAndScan(), 100);
    } catch (err: any) {
      this.cameraError = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access and try again.'
        : 'Could not access camera. Use manual entry below.';
    }
  }

  private attachStreamAndScan() {
    const video = document.getElementById('scanner-video') as HTMLVideoElement;
    if (!video || !this.stream) return;
    video.srcObject = this.stream;
    video.play();

    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      this.scanLoop(video, detector);
    } else {
      this.cameraError = 'QR detection not supported in this browser. Use manual entry or try Chrome.';
    }
  }

  private async scanLoop(video: HTMLVideoElement, detector: any) {
    if (!this.scanning) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length > 0 && !this.cooldown) {
        this.cooldown = true;
        await this.processQrCode(codes[0].rawValue);
        setTimeout(() => this.cooldown = false, 3000);
      }
    } catch {}
    if (this.scanning) {
      requestAnimationFrame(() => this.scanLoop(video, detector));
    }
  }

  stopCamera() {
    this.scanning = false;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  submitManual() {
    const code = this.manualCode.trim();
    if (!code) return;
    this.submittingManual = true;
    this.processQrCode(code).finally(() => {
      this.submittingManual = false;
      this.manualCode = '';
    });
  }

  private async processQrCode(qrCode: string): Promise<void> {
    return new Promise((resolve) => {
      this.http.post<any>(`${this.apiUrl}/scan?qrCode=${encodeURIComponent(qrCode)}`, {})
        .subscribe({
          next: (res) => {
            this.lastResult = res;
            this.resultType = 'success';
            this.resultMessage = `Check-in successful for ${res.registration?.user?.fullName || 'student'}`;
            this.toastr.success(this.resultMessage);
            resolve();
          },
          error: (err) => {
            this.resultType = 'error';
            this.resultMessage = err.error?.error || err.error?.message || err.error || 'Invalid or already used QR code';
            this.toastr.error(this.resultMessage);
            resolve();
          }
        });
    });
  }

  clearResult() {
    this.lastResult = null;
    this.resultType = null;
    this.resultMessage = '';
  }

  ngOnDestroy() { this.stopCamera(); }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN');
  }
}
