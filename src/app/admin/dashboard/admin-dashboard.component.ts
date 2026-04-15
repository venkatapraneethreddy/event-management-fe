import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective, ButtonModule, TagModule, AvatarModule, SkeletonModule, MessageModule, TooltipModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  stats: any = {};
  loading = true;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Approved', 'Pending'],
    datasets: [{ data: [], backgroundColor: ['#059669', '#f59e0b'], borderWidth: 0 }]
  };

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Users', 'Events', 'Registrations'],
    datasets: [{
      data: [], label: 'Count',
      backgroundColor: ['#4f46e5', '#7c3aed', '#059669'],
      borderRadius: 6, borderSkipped: false
    }]
  };
  
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  plugins: {
    legend: {
      display: true
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#6b7280'
      },
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#6b7280'
      },
      grid: {
        color: '#e5e7eb'
      }
    }
  }
};

  private intervalIds: any[] = [];

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  this.startActivityFeed();
    this.adminService.getStats().subscribe({
      next: (data) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.runAnimation(data);
        this.pieChartData.datasets[0].data = [data.totalClubs - data.pendingClubs, data.pendingClubs];
        this.barChartData.datasets[0].data = [data.totalUsers, data.totalEvents, data.totalRegistrations];
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy(): void { this.intervalIds.forEach(id => clearInterval(id)); }

  private animateValue(final: number, update: (v: number) => void) {
    let cur = 0;
    const frames = 40;
    const inc = final / frames;
    const id = setInterval(() => {
      cur = Math.min(cur + inc, final);
      update(Math.floor(cur));
      this.cdr.detectChanges();
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
  
  activities: any[] = [];

private sampleActivities = [
  { text: 'New registration for Coding Event', type: 'green' },
  { text: 'Tech Club created a new event', type: 'violet' },
  { text: 'User registered as Organizer', type: 'blue' },
  { text: 'Event "Hackathon" reached full capacity', type: 'amber' }
];

startActivityFeed() {
  setInterval(() => {
    const random = this.sampleActivities[
      Math.floor(Math.random() * this.sampleActivities.length)
    ];

    this.activities.unshift({
      ...random,
      time: 'Just now'
    });

    // keep only last 6
    if (this.activities.length > 6) {
      this.activities.pop();
    }
  }, 3000);
}
}
