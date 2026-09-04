import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ClientOrder,
  ClientOrderStatus,
  ExecutionChannel,
  TrackingItemResponse,
  TrackingPageResponse,
} from '../models/client-order';

const TRACKING_PAGE_SIZE = 100;
const TRACKING_STATUSES: ReadonlySet<string> = new Set([
  'PENDIENTE',
  'PARCIAL',
  'EJECUTADA',
  'ANULADA',
]);

@Injectable({ providedIn: 'root' })
export class ClientOrderTrackingService {
  private readonly apiUrl = environment.apiUrl;
  private readonly orderState = signal<ClientOrder[]>([]);
  private readonly lastUpdatedState = signal<string | null>(null);

  readonly orders = this.orderState.asReadonly();
  readonly lastUpdatedAt = this.lastUpdatedState.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadOrders(): Observable<ClientOrder[]> {
    return this.getTrackingPage(1).pipe(
      expand((response) => {
        const loadedCount = response.page * response.pageSize;
        return loadedCount < response.totalCount
          ? this.getTrackingPage(response.page + 1)
          : EMPTY;
      }),
      map((response) => ({
        orders: response.items.map((item) => this.mapOrder(item)),
        lastUpdatedAt: response.lastUpdatedAt,
      })),
      reduce(
        (result, page) => ({
          orders: [...result.orders, ...page.orders],
          lastUpdatedAt: page.lastUpdatedAt,
        }),
        { orders: [] as ClientOrder[], lastUpdatedAt: null as string | null },
      ),
      tap((result) => {
        this.orderState.set(result.orders);
        this.lastUpdatedState.set(result.lastUpdatedAt);
      }),
      map((result) => result.orders),
    );
  }

  getById(id: string): ClientOrder | undefined {
    return this.orderState().find(
      (order) => order.id.toString() === id || order.operationNumber === id,
    );
  }

  private getTrackingPage(page: number): Observable<TrackingPageResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', TRACKING_PAGE_SIZE.toString());

    return this.http.get<TrackingPageResponse>(
      `${this.apiUrl}/PropuestaCliente/seguimiento`,
      { params },
    );
  }

  private mapOrder(item: TrackingItemResponse): ClientOrder {
    const normalizedSide = item.tipo.trim().toUpperCase();
    const normalizedStatus = item.estado.trim().toUpperCase();
    const normalizedChannel = item.mercado.trim().toUpperCase() as ExecutionChannel;

    return {
      id: item.codigoOrden,
      clientCode: item.cosabcli.trim(),
      proposalDate: item.fechaPropuesta,
      proposalTime: item.horaPropuesta,
      operationNumber: item.numeroOperacion.trim(),
      channel: normalizedChannel,
      instrument: item.instrumento.trim(),
      side: normalizedSide === 'V' || normalizedSide === 'VENTA' ? 'Venta' : 'Compra',
      proposedQuantity: item.cantidadPropuesta,
      executedQuantity: item.cantidadEjecutada,
      cancelledQuantity: item.cantidadAnulada,
      pendingQuantity: item.cantidadPendiente,
      price: item.precio,
      status: TRACKING_STATUSES.has(normalizedStatus)
        ? normalizedStatus as ClientOrderStatus
        : 'PENDIENTE',
    };
  }
}
