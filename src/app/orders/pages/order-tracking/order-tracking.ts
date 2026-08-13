import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';

import {
  CLIENT_ORDER_STATUS_LABELS,
  ClientOrder,
  ClientOrderStatus,
  EXECUTION_CHANNELS,
  ExecutionChannel,
} from '../../models/client-order';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';
import { PORTAL_ROUTES } from '../../../shared/portal-routes';

type ChannelFilter = ExecutionChannel | 'ALL';
type StatusFilter = ClientOrderStatus | 'ALL';
type SideFilter = ClientOrder['side'] | 'ALL';
type DialogMode = 'detail' | 'annul' | null;

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
export class OrderTrackingComponent implements OnDestroy {
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

  dialogMode: DialogMode = null;
  selectedOrder: ClientOrder | null = null;
  cancellationReason = '';
  toastMessage = '';
  toastIsError = false;
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly trackingService: ClientOrderTrackingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.restoreFiltersFromUrl();
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
      if (orderNumber && !order.id.toLowerCase().includes(orderNumber)) return false;
      if (instrument && !order.instrument.toLowerCase().includes(instrument)) return false;

      const submittedDate = order.submittedAt.slice(0, 10);
      if (startDate && submittedDate < startDate) return false;
      if (endDate && submittedDate > endDate) return false;
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
    this.dialogMode = 'detail';
  }

  openAnnul(order: ClientOrder): void {
    if (!this.trackingService.canAnnul(order)) {
      this.showToast('Esta orden ya no puede anularse.', true);
      return;
    }
    this.selectedOrder = order;
    this.cancellationReason = '';
    this.dialogMode = 'annul';
  }

  closeDialog(): void {
    this.dialogMode = null;
    this.selectedOrder = null;
    this.cancellationReason = '';
  }

  confirmAnnul(): void {
    if (!this.selectedOrder || this.cancellationReason.trim().length < 5) return;

    const wasAnnulled = this.trackingService.annul(
      this.selectedOrder.id,
      this.cancellationReason,
    );
    this.closeDialog();
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.showToast(
      wasAnnulled ? 'La orden fue anulada correctamente.' : 'La orden ya no puede anularse.',
      !wasAnnulled,
    );
  }

  generateNewOrder(order: ClientOrder): void {
    this.router.navigate([PORTAL_ROUTES.clientes.orders], {
      queryParams: { sourceOrderId: order.id },
    });
  }

  statusLabel(status: ClientOrderStatus): string {
    return this.statusLabels[status];
  }

  formatChannel(channel: ExecutionChannel): string {
    return this.channels.find((item) => item.code === channel)?.name ?? channel;
  }

  formatMoney(order: ClientOrder): string {
    if (order.price === null) return 'A mercado';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: order.currency,
      minimumFractionDigits: 2,
    }).format(order.price);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
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
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
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

  private showToast(message: string, isError = false): void {
    this.toastMessage = message;
    this.toastIsError = isError;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 3500);
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
