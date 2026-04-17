import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-organizer-analytics',
  standalone: true,
  imports: [CommonModule, TagModule, TableModule, SkeletonModule],
  templateUrl: './organizer-analytics.component.html',
  styleUrl: './organizer-analytics.component.scss'
})
export class OrganizerAnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('barCanvas') barCanvasRef!: ElementRef<HTMLCanvasElement>;

  private intervalIds: any[] = [];
  private chartInitialized = false;

  stats: any = { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0, eventStats: [] };
  loading = true;
  rawData: any = null;

  get hasPaidEvents(): boolean {
    return this.stats.eventStats?.some((e: any) => e.paid) ?? false;
  }

  constructor(private eventService: EventService, private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void { this.intervalIds.forEach(id => clearInterval(id)); }

  ngAfterViewInit(): void {
    if (this.rawData && !this.chartInitialized) {
      this.drawChart(this.rawData.eventStats ?? []);
    }
  }

  ngOnInit(): void {
    this.eventService.getAnalytics().subscribe({
      next: (data) => {
        this.rawData = data;
        this.animateValue(data.totalEvents, v => this.stats = { ...this.stats, totalEvents: v });
        this.animateValue(data.totalRegistrations, v => this.stats = { ...this.stats, totalRegistrations: v });
        this.animateValue(data.totalRevenue ?? 0, v => this.stats = { ...this.stats, totalRevenue: v });
        this.stats = { ...this.stats, eventStats: data.eventStats ?? [] };
        this.loading = false;
        this.cdr.detectChanges();

        // Draw custom animated chart after view renders
        setTimeout(() => this.drawChart(data.eventStats ?? []), 100);
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private drawChart(eventStats: any[]) {
    const canvas = this.barCanvasRef?.nativeElement;
    if (!canvas || !eventStats.length) return;
    this.chartInitialized = true;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const labels = eventStats.map(e => e.eventTitle ?? 'Untitled');
    const values = eventStats.map(e => e.registrations ?? 0);
    const maxVal = Math.max(...values, 1);

    const pad = { top: 28, right: 20, bottom: 52, left: 44 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barCount = values.length;
    const barW = Math.min(48, (chartW / barCount) * 0.55);
    const gap = (chartW - barW * barCount) / (barCount + 1);

    const colors = [
      ['#6366f1','#818cf8'],['#10b981','#34d399'],['#f59e0b','#fbbf24'],
      ['#3b82f6','#60a5fa'],['#8b5cf6','#a78bfa'],['#ef4444','#f87171']
    ];

    let progress = 0;
    const duration = 900;
    const startTime = performance.now();

    const gridLines = 4;
    const stepVal = maxVal / gridLines;

    const animate = (now: number) => {
      progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic

      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridLines; i++) {
        const y = pad.top + chartH - (i / gridLines) * chartH;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
        // Y axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(i * stepVal).toString(), pad.left - 8, y + 4);
      }

      // Bars
      values.forEach((val, i) => {
        const x = pad.left + gap + i * (barW + gap);
        const barH = (val / maxVal) * chartH * ease;
        const y = pad.top + chartH - barH;
        const [c1, c2] = colors[i % colors.length];

        // Glow
        if (ease > 0.3) {
          const glow = ctx.createRadialGradient(x + barW/2, y, 0, x + barW/2, y, barW * 1.2);
          glow.addColorStop(0, c1 + '44');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(x - barW * 0.3, y - 10, barW * 1.6, barH + 10);
        }

        // Bar gradient
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, c2);
        grad.addColorStop(1, c1 + 'aa');
        ctx.fillStyle = grad;
        const r = Math.min(8, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // Value label on top
        if (ease > 0.7 && val > 0) {
          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'bold 12px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(val.toString(), x + barW / 2, y - 7);
        }

        // X axis label
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        const lbl = labels[i].length > 12 ? labels[i].slice(0, 11) + '…' : labels[i];
        ctx.fillText(lbl, x + barW / 2, pad.top + chartH + 20);
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  animateValue(finalValue: number, update: (val: number) => void) {
    let current = 0;
    const totalFrames = 50;
    const increment = finalValue / totalFrames;
    const id = setInterval(() => {
      current += increment;
      if (current >= finalValue) { current = finalValue; clearInterval(id); }
      update(Math.floor(current));
      this.cdr.detectChanges();
    }, 16);
    this.intervalIds.push(id);
  }
}
