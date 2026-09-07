import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MarketHoursSnapshot {
  serverNow: string;
  today: string;
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
  nextOpenAt: string;
  validForDate: string;
  nextTransitionAt: string;
  applyToAllMarkets: boolean;
}

@Injectable({ providedIn: 'root' })
export class MarketHoursService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snapshot = signal<MarketHoursSnapshot | null>(null);
  private readonly elapsed = signal(0);
  private syncedAt = 0;
  private lastAttempt = -Infinity;
  private pending = false;
  readonly failed = signal(false);

  readonly current = computed(() => {
    const state = this.snapshot();
    if (!state) return null;
    const age = this.elapsed() - this.syncedAt;
    const now = Date.parse(state.serverNow) + age;
    return age < 90_000 && now < Date.parse(state.nextTransitionAt) ? state : null;
  });

  constructor() {
    timer(0, 1000).pipe(takeUntilDestroyed()).subscribe(() => {
      this.elapsed.set(performance.now());
      const sinceAttempt = performance.now() - this.lastAttempt;
      if (sinceAttempt >= 30_000 || !this.current() && sinceAttempt >= 1000 && !this.failed()) {
        this.refresh();
      }
    });
  }

  refresh(): void {
    if (this.pending) return;
    this.pending = true;
    this.lastAttempt = performance.now();
    this.failed.set(false);
    this.http.get<MarketHoursSnapshot>(`${environment.apiUrl}/MarketHours`)
      .pipe(timeout(8000), takeUntilDestroyed(this.destroyRef), finalize(() => { this.pending = false; }))
      .subscribe({
        next: state => {
          // The server is authoritative; elapsed time is monotonic, independent of the device's clock.
          this.syncedAt = performance.now();
          this.elapsed.set(this.syncedAt);
          this.snapshot.set(state);
        },
        error: () => {
          this.failed.set(true);
          this.snapshot.set(null);
        },
      });
  }
}
