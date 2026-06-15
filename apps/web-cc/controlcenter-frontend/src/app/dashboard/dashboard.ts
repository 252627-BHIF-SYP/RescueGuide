import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardEmergency, DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private refreshInterval?: ReturnType<typeof setInterval>;

  readonly emergencies = signal<DashboardEmergency[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal('');
  readonly activeEmergencies = computed(() =>
    this.emergencies().filter((emergency) => emergency.status === 'Active'),
  );
  readonly completedEmergencies = computed(() =>
    this.emergencies().filter((emergency) => emergency.status === 'Completed'),
  );

  getLocationLabel(emergency: DashboardEmergency): string {
    if (emergency.address?.trim()) {
      return emergency.address;
    }

    return 'Adresse nicht erfasst';
  }

  ngOnInit(): void {
    this.loadEmergencies();
    this.refreshInterval = setInterval(() => this.loadEmergencies(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadEmergencies(silent = false): void {
    silent ? this.refreshing.set(true) : this.loading.set(true);

    this.dashboardService.getEmergencies().subscribe({
      next: (emergencies) => {
        this.emergencies.set(emergencies);
        this.error.set('');
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.error.set('Notrufe konnten nicht geladen werden.');
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }
}
