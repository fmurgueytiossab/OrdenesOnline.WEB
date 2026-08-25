import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  finalize,
  of,
  Subject,
  switchMap,
  timeout,
} from 'rxjs';

import { ClienteSearchResult } from '../../../Model/ClienteSearchResult';
import { PropuestaCliente } from '../../../Model/PropuestaCliente';
import { ClienteService } from '../../../services/ClienteService';
import { PropuestaClienteService } from '../../../services/PropuestaClienteService';
import { OrderFormComponent } from '../../components/order-form/order-form';
import { MarketOption, OrderFormValue } from '../../models/order-form-value';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';

interface ClientIdentity {
  name: string;
  emails: string[];
  phones: string[];
  bloqueoMotivo: string;
}

@Component({
  selector: 'app-client-orders',
  standalone: true,
  templateUrl: './client-orders.html',
  styleUrls: ['./client-orders.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatSnackBarModule,
    OrderFormComponent,
  ],
})
export class ClientOrdersComponent {
  @ViewChild(OrderFormComponent) private orderForm?: OrderFormComponent;

  submitting = false;
  searchingClients = false;
  clientSearch: string | ClienteSearchResult = '';
  clientSearchError = false;
  hasSearchedClients = false;
  clientResults: ClienteSearchResult[] = [];
  readonly sourceOrderId: string | null;
  readonly initialOrder: Partial<OrderFormValue> | null;
  private readonly clientSearchTerms = new Subject<string>();

  client: ClientIdentity | null = null;
  recipientEmail = '';
  selectedClientCode = '';
  orderBlockMessage = '';

  readonly markets: MarketOption[] = [
    { code: '01', name: 'BVL' },
    { code: '98', name: 'Canaccord' },
    { code: '16', name: 'Euroclear' },
  ];

  get orderFormDisabled(): boolean {
    return this.orderBlockMessage.length > 0;
  }

  constructor(
    private readonly propuestaClienteService: PropuestaClienteService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
    private readonly clienteService: ClienteService,
    destroyRef: DestroyRef,
    trackingService: ClientOrderTrackingService,
  ) {
    this.sourceOrderId = this.router.parseUrl(this.router.url).queryParams['sourceOrderId'] ?? null;
    const sourceOrder = this.sourceOrderId ? trackingService.getById(this.sourceOrderId) : undefined;
    this.initialOrder = sourceOrder
      ? {
          tipo: sourceOrder.side,
          cantidad: sourceOrder.quantity,
          instrumento: sourceOrder.instrument,
          tipoOrden: sourceOrder.orderType,
          precio: sourceOrder.price,
          monto: sourceOrder.price === null ? null : sourceOrder.quantity * sourceOrder.price,
          mercado: sourceOrder.channel,
          moneda: sourceOrder.currency === 'USD' ? 'Dólares' : 'Soles',
          vigencia: sourceOrder.validity,
        }
      : null;

    this.clientSearchTerms
      .pipe(
        debounceTime(300),
        switchMap((query) => {
          const normalizedQuery = query.trim();
          this.clientSearchError = false;

          if (normalizedQuery.length < 3) {
            this.searchingClients = false;
            this.hasSearchedClients = false;
            return of([]);
          }

          this.searchingClients = true;
          this.hasSearchedClients = false;
          return this.clienteService.buscar(normalizedQuery).pipe(
            catchError(() => {
              this.clientSearchError = true;
              return of([]);
            }),
            finalize(() => {
              this.searchingClients = false;
              this.cdr.detectChanges();
            }),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((clients) => {
        this.clientResults = clients;
        const searchText = typeof this.clientSearch === 'string' ? this.clientSearch : '';
        this.hasSearchedClients = searchText.trim().length >= 3;
        this.cdr.detectChanges();
      });
  }

  submitOrder(order: OrderFormValue): void {
    if (!this.client || !this.selectedClientCode) {
      this.showMessage('Debe buscar y seleccionar un cliente', true);
      return;
    }

    if (this.client.bloqueoMotivo) {
      this.showBlockedClientMessage(this.client.bloqueoMotivo);
      return;
    }

    if (this.client.phones.length === 0) {
      this.showMissingPhoneMessage();
      return;
    }

    if (!this.recipientEmail) {
      this.showMessage('El cliente no cuenta con un correo electrónico', true, 6000);
      return;
    }

    const propuesta: PropuestaCliente = {
      correoCliente: this.recipientEmail,
      cosabcli: this.selectedClientCode,
      tipo: order.tipo,
      tipoOrden: order.tipoOrden,
      cantidad: order.cantidad,
      instrumento: order.instrumento,
      precio: order.precio,
      monto: order.monto,
      mercado: order.mercado,
      moneda: order.moneda.toLocaleLowerCase('es-PE'),
      vigencia: order.vigencia,
    };

    this.submitting = true;
    this.propuestaClienteService
      .registrar(propuesta)
      .pipe(
        timeout(8000),
        finalize(() => {
          this.submitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.showMessage('✅ Orden de cliente enviada correctamente');
          this.orderForm?.reset();
        },
        error: () => this.showMessage('❌ No hay respuesta del servidor', true),
      });
  }

  clearOrderForm(): void {
    this.orderForm?.reset();
  }

  onClientSearchChange(value: string | ClienteSearchResult): void {
    this.clientSearch = value;
    if (typeof value !== 'string') {
      this.selectClient(value);
      return;
    }

    if (this.client?.name !== value) {
      this.clearSelectedClient();
    }
    this.clientResults = [];
    this.clientSearchTerms.next(value);
  }

  selectClient(result: ClienteSearchResult): void {
    const phones = (result.nucel ?? []).map((phone) => phone.trim()).filter(Boolean);
    const bloqueoMotivo = result.bloqueoMotivo?.trim() ?? '';

    this.client = {
      name: result.nombreCompleto,
      emails: result.emails,
      phones,
      bloqueoMotivo,
    };
    this.clientSearch = result;
    this.recipientEmail = result.emails[0] ?? '';
    this.selectedClientCode = result.cosabcli;
    this.clientResults = [];
    this.hasSearchedClients = false;

    if (bloqueoMotivo) {
      this.showBlockedClientMessage(bloqueoMotivo);
    } else if (phones.length === 0) {
      this.showMissingPhoneMessage();
    } else {
      this.orderBlockMessage = '';
      this.snackBar.dismiss();
    }
  }

  displayClientName(value: string | ClienteSearchResult | null): string {
    if (typeof value === 'string') return value;
    return value?.nombreCompleto ?? '';
  }

  private clearSelectedClient(): void {
    this.client = null;
    this.recipientEmail = '';
    this.selectedClientCode = '';
  }

  private showBlockedClientMessage(reason: string): void {
    this.orderBlockMessage =
      `El cliente se encuentra bloqueado por el siguiente motivo: ${reason}`;
  }

  private showMissingPhoneMessage(): void {
    this.orderBlockMessage =
      'No se puede proseguir porque el cliente no cuenta con número de celular';
  }

  private showMessage(message: string, isError = false, duration = 4000): void {
    this.snackBar.open(message, '', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: isError ? ['snack-error'] : undefined,
    });
  }
}
