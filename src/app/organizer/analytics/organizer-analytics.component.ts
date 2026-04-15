import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-organizer-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, ButtonModule, TagModule, TableModule, SkeletonModule, MessageModule],
  templateUrl: './organizer-analytics.component.html',
  styleUrl: './organizer-analytics.component.scss'
})
export class OrganizerAnalyticsComponent implements OnInit, OnDestroy {
  private intervalIds: any[] = [];

  stats: any = { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0, eventStats: [] };
  loading = true;
  get hasPaidEvents(): boolean {
    return this.stats.eventStats?.some((e: any) => e.paid) ?? false;
  }

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Registrations per Event',
      backgroundColor: '#3b82f6'
    }]
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  constructor(private eventService: EventService, private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void { this.intervalIds.forEach(id => clearInterval(id)); }

  ngOnInit(): void {
    this.eventService.getAnalytics().subscribe({
      next: (data) => {
        this.animateValue(data.totalEvents, v => this.stats = { ...this.stats, totalEvents: v });
        this.animateValue(data.totalRegistrations, v => this.stats = { ...this.stats, totalRegistrations: v });
        this.animateValue(data.totalRevenue ?? 0, v => this.stats = { ...this.stats, totalRevenue: v });

        this.barChartData = {
          labels: data.eventStats?.map((e: any) => e.eventTitle || 'Untitled') ?? [],
          datasets: [{
            data: data.eventStats?.map((e: any) => e.registrations) ?? [],
            label: 'Registrations per Event',
            backgroundColor: '#3b82f6'
          }]
        };

        // Preserve eventStats for revenue table (not animated)
        this.stats = { ...this.stats, eventStats: data.eventStats ?? [] };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  animateValue(finalValue: number, update: (val: number) => void) {
    let current = 0;
    const totalFrames = 50;
    const increment = finalValue / totalFrames;
    const id = setInterval(() => {
      current += increment;
      if (current >= finalValue) {
        current = finalValue;
        clearInterval(id);
      }
      update(Math.floor(current));
      this.cdr.detectChanges();
    }, 16);
    this.intervalIds.push(id);
  }
}
