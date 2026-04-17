import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SkeletonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('barCanvas')  barCanvasRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvasRef!: ElementRef<HTMLCanvasElement>;

  stats: any = {};
  loading = true;
  rawData: any = null;
  activities: any[] = [];
  private intervalIds: any[] = [];
  private chartsDrawn = false;

  private sampleActivities = [
    { text: 'New student registered for Coding Event', type: 'green' },
    { text: 'Tech Club created a new workshop', type: 'violet' },
    { text: 'New organizer account approved', type: 'blue' },
    { text: '"Hackathon 2025" reached full capacity', type: 'amber' },
    { text: 'Cultural Fest registration closed', type: 'amber' },
    { text: 'Admin approved Science Club', type: 'green' },
  ];

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.startActivityFeed();
    this.adminService.getStats().subscribe({
      next: (data) => {
        this.rawData = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.runAnimation(data);
        if (this.chartsDrawn === false) setTimeout(() => this.drawCharts(data), 120);
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  ngAfterViewInit(): void {
    if (this.rawData && !this.chartsDrawn) this.drawCharts(this.rawData);
  }

  ngOnDestroy(): void { this.intervalIds.forEach(id => clearInterval(id)); }

  // ── Animated bar chart ──────────────────────────────────────────
  private drawCharts(data: any) {
    this.chartsDrawn = true;
    this.drawBarChart(data);
    this.drawDonutChart(data);
  }

  private drawBarChart(data: any) {
    const canvas = this.barCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth; const H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);

    const labels = ['Students', 'Events', 'Registrations'];
    const values = [data.totalUsers, data.totalEvents, data.totalRegistrations];
    const gradients = [['#2563eb','#60a5fa'], ['#7c3aed','#a78bfa'], ['#059669','#6ee7b7']];
    const maxVal = Math.max(...values, 1);
    const pad = { top:28, right:20, bottom:48, left:48 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barW = Math.min(70, chartW / labels.length * 0.55);
    const gap  = (chartW - barW * labels.length) / (labels.length + 1);
    const gridLines = 4;

    let progress = 0; const dur = 900; const t0 = performance.now();
    const draw = (now: number) => {
      progress = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      for (let i = 0; i <= gridLines; i++) {
        const y = pad.top + chartH - (i / gridLines) * chartH;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '11px Inter,system-ui,sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round((maxVal / gridLines) * i).toString(), pad.left - 8, y + 4);
      }

      // Bars
      values.forEach((val, i) => {
        const x = pad.left + gap + i * (barW + gap);
        const bh = (val / maxVal) * chartH * ease;
        const y = pad.top + chartH - bh;
        const [c1, c2] = gradients[i];

        // Glow behind bar
        if (ease > 0.2) {
          const glow = ctx.createRadialGradient(x + barW/2, y + bh/2, 0, x + barW/2, y + bh/2, barW);
          glow.addColorStop(0, c1 + '33'); glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow; ctx.fillRect(x - barW*.6, y - 10, barW * 2.2, bh + 20);
        }

        // Bar
        const grad = ctx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, c2); grad.addColorStop(1, c1 + 'bb');
        ctx.fillStyle = grad;
        const r = Math.min(10, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, y + bh); ctx.lineTo(x, y + bh);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath(); ctx.fill();

        // Top shine
        if (bh > 20) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x, y, barW, Math.min(6, bh * 0.08));
        }

        // Value label
        if (ease > 0.75) {
          ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 13px Inter,system-ui,sans-serif';
          ctx.textAlign = 'center'; ctx.fillText(val.toString(), x + barW / 2, y - 8);
        }

        // X label
        ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = '12px Inter,system-ui,sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(labels[i], x + barW / 2, pad.top + chartH + 22);
      });

      if (progress < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  private drawDonutChart(data: any) {
    const canvas = this.donutCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth; const H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);

    const approved = Math.max(0, data.totalClubs - data.pendingClubs);
    const pending  = data.pendingClubs;
    const total    = approved + pending || 1;
    const slices = [
      { label: 'Approved', value: approved, color: '#10b981', glow: '#10b98144' },
      { label: 'Pending',  value: pending,  color: '#f59e0b', glow: '#f59e0b44' },
    ];

    const cx = W / 2; const cy = H / 2;
    const outerR = Math.min(cx, cy) - 20;
    const innerR = outerR * 0.58;
    const dur = 900; const t0 = performance.now();
    let progV = 0;

    const draw = (now: number) => {
      progV = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - progV, 3);
      ctx.clearRect(0, 0, W, H);

      let startAngle = -Math.PI / 2;
      slices.forEach(s => {
        const sweep = (s.value / total) * Math.PI * 2 * ease;
        // Glow
        ctx.shadowColor = s.color; ctx.shadowBlur = 18;
        // Arc
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
        ctx.closePath(); ctx.fillStyle = s.color; ctx.fill();
        ctx.shadowBlur = 0;
        startAngle += sweep;
      });

      // Donut hole
      ctx.beginPath(); ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0f20'; ctx.fill();

      // Center text
      if (progV > 0.6) {
        ctx.fillStyle = '#f1f5f9'; ctx.font = `bold ${Math.round(innerR * 0.4)}px Inter,system-ui,sans-serif`;
        ctx.textAlign = 'center'; ctx.fillText(data.totalClubs.toString(), cx, cy + 5);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `${Math.round(innerR * 0.22)}px Inter,system-ui,sans-serif`;
        ctx.fillText('clubs', cx, cy + innerR * 0.35);
      }

      // Legend
      if (progV > 0.8) {
        slices.forEach((s, i) => {
          const lx = 16, ly = H - 36 + i * 20;
          ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px Inter,system-ui,sans-serif';
          ctx.textAlign = 'left'; ctx.fillText(`${s.label}: ${s.value}`, lx + 12, ly + 4);
        });
      }

      if (progV < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ── KPI animation ─────────────────────────────────────────────
  private animateValue(final: number, update: (v: number) => void) {
    let cur = 0; const frames = 40; const inc = final / frames;
    const id = setInterval(() => {
      cur = Math.min(cur + inc, final); update(Math.floor(cur)); this.cdr.detectChanges();
      if (cur >= final) clearInterval(id);
    }, 16);
    this.intervalIds.push(id);
  }

  private runAnimation(data: any) {
    this.stats = { totalUsers: 0, totalClubs: 0, pendingClubs: 0, totalEvents: 0, totalRegistrations: 0 };
    this.animateValue(data.totalUsers,         v => this.stats = { ...this.stats, totalUsers: v });
    this.animateValue(data.totalClubs,         v => this.stats = { ...this.stats, totalClubs: v });
    this.animateValue(data.pendingClubs,       v => this.stats = { ...this.stats, pendingClubs: v });
    this.animateValue(data.totalEvents,        v => this.stats = { ...this.stats, totalEvents: v });
    this.animateValue(data.totalRegistrations, v => this.stats = { ...this.stats, totalRegistrations: v });
  }

  // ── Live activity feed ────────────────────────────────────────
  startActivityFeed() {
    const id = setInterval(() => {
      const random = this.sampleActivities[Math.floor(Math.random() * this.sampleActivities.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      this.activities.unshift({ ...random, time: timeStr });
      if (this.activities.length > 6) this.activities.pop();
      this.cdr.detectChanges();
    }, 3500);
    this.intervalIds.push(id);
  }
}
