import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timer } from 'rxjs';

import {
  CLIENT_ORDER_STATUS_LABELS,
  ClientOrder,
  ClientOrderStatus,
  EXECUTION_CHANNELS,
  ExecutionChannel,
} from '../../models/client-order';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';

type ChannelFilter = ExecutionChannel | 'ALL';
type StatusFilter = ClientOrderStatus | 'ALL';
type SideFilter = ClientOrder['side'] | 'ALL';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css',
})
export class OrderTrackingComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshIntervalMs = 30_000;

  readonly channels = EXECUTION_CHANNELS;
  readonly statusLabels = CLIENT_ORDER_STATUS_LABELS;
  readonly pageSize = 5;

  selectedChannel: ChannelFilter = 'ALL';
  selectedStatus: StatusFilter = 'ALL';
  selectedSide: SideFilter = 'ALL';
  orderNumber = '';
  instrument = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  currentPage = 1;

  loading = false;
  loadError = '';
  lastUpdatedAt: Date | null = null;
  selectedOrder: ClientOrder | null = null;

  constructor(
    readonly trackingService: ClientOrderTrackingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.restoreFiltersFromUrl();
  }

  ngOnInit(): void {
    timer(0, this.refreshIntervalMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshOrders());
  }

  get filteredOrders(): ClientOrder[] {
    const orderNumber = this.orderNumber.trim().toLowerCase();
    const instrument = this.instrument.trim().toLowerCase();
    const startDate = this.formatDateQuery(this.startDate);
    const endDate = this.formatDateQuery(this.endDate);

    return this.trackingService.orders().filter((order) => {
      if (this.selectedChannel !== 'ALL' && order.channel !== this.selectedChannel) return false;
      if (this.selectedStatus !== 'ALL' && order.status !== this.selectedStatus) return false;
      if (this.selectedSide !== 'ALL' && order.side !== this.selectedSide) return false;
      if (
        orderNumber
        && !order.id.toString().includes(orderNumber)
        && !order.operationNumber.toLowerCase().includes(orderNumber)
      ) return false;
      if (instrument && !order.instrument.toLowerCase().includes(instrument)) return false;
      if (startDate && order.proposalDate < startDate) return false;
      if (endDate && order.proposalDate > endDate) return false;
      return true;
    });
  }

  get visibleOrders(): ClientOrder[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
  }

  get resultStart(): number {
    return this.filteredOrders.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get resultEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredOrders.length);
  }

  channelCount(channel: ChannelFilter): number {
    if (channel === 'ALL') return this.trackingService.orders().length;
    return this.trackingService.orders().filter((order) => order.channel === channel).length;
  }

  refreshOrders(): void {
    if (this.loading) return;

    this.loading = true;
    this.loadError = '';
    this.trackingService.loadOrders()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          const updatedAt = this.trackingService.lastUpdatedAt();
          this.lastUpdatedAt = updatedAt ? new Date(updatedAt) : new Date();
          if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        },
        error: () => {
          this.loadError = 'No se pudieron cargar las órdenes.';
        },
      });
  }

  selectChannel(channel: ChannelFilter): void {
    this.selectedChannel = channel;
    this.currentPage = 1;
    this.updateUrl();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.updateUrl();
  }

  clearFilters(): void {
    this.selectedChannel = 'ALL';
    this.selectedStatus = 'ALL';
    this.selectedSide = 'ALL';
    this.orderNumber = '';
    this.instrument = '';
    this.startDate = null;
    this.endDate = null;
    this.currentPage = 1;
    this.updateUrl();
  }

  previousPage(): void {
    if (this.currentPage === 1) return;
    this.currentPage -= 1;
    this.updateUrl();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage += 1;
    this.updateUrl();
  }

  openDetail(order: ClientOrder): void {
    this.selectedOrder = order;
  }

  closeDialog(): void {
    this.selectedOrder = null;
  }

  statusLabel(status: ClientOrderStatus): string {
    return this.statusLabels[status];
  }

  formatChannel(channel: ExecutionChannel): string {
    return this.channels.find((item) => item.code === channel)?.name ?? channel;
  }

  formatPrice(price: number | null): string {
    if (price === null) return '—';
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(price);
  }

  proposalTimestamp(order: ClientOrder): string {
    return `${order.proposalDate}T${order.proposalTime ?? '00:00:00'}`;
  }

  private restoreFiltersFromUrl(): void {
    const query = this.route.snapshot.queryParamMap;
    const channel = query.get('channel');
    const status = query.get('status');
    const side = query.get('side');
    const page = Number(query.get('page'));

    if (channel === 'ALL' || this.channels.some((item) => item.code === channel)) {
      this.selectedChannel = channel as ChannelFilter;
    }
    if (status === 'ALL' || status && status in this.statusLabels) {
      this.selectedStatus = status as StatusFilter;
    }
    if (side === 'ALL' || side === 'Compra' || side === 'Venta') {
      this.selectedSide = side;
    }

    this.orderNumber = query.get('order') ?? '';
    this.instrument = query.get('instrument') ?? '';
    this.startDate = this.parseDateQuery(query.get('from'));
    this.endDate = this.parseDateQuery(query.get('to'));
    this.currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  }

  private updateUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        channel: this.selectedChannel === 'ALL' ? null : this.selectedChannel,
        status: this.selectedStatus === 'ALL' ? null : this.selectedStatus,
        side: this.selectedSide === 'ALL' ? null : this.selectedSide,
        order: this.orderNumber.trim() || null,
        instrument: this.instrument.trim() || null,
        from: this.formatDateQuery(this.startDate),
        to: this.formatDateQuery(this.endDate),
        page: this.currentPage > 1 ? this.currentPage : null,
      },
      replaceUrl: true,
    });
  }

  private formatDateQuery(date: Date | null): string | null {
    if (!date || Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateQuery(value: string | null): Date | null {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day
      ? date
      : null;
  }
}
