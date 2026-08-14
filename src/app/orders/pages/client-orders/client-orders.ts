import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { PropuestaCliente } from '../../../Model/PropuestaCliente';
import { PropuestaClienteService } from '../../../services/PropuestaClienteService';
import { RepresentanteService } from '../../../services/RepresentanteService';
import { OrderFormComponent } from '../../components/order-form/order-form';
import { MarketOption, OrderFormValue } from '../../models/order-form-value';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';

interface ClientIdentity {
  name: string;
  email: string;
  phone: string;
  clientCodes: string[];
}

@Component({
  selector: 'app-client-orders',
  standalone: true,
  templateUrl: './client-orders.html',
  styleUrls: ['./client-orders.css'],
  imports: [CommonModule, FormsModule, MatSelectModule, MatSnackBarModule, OrderFormComponent],
})
export class ClientOrdersComponent {
  @ViewChild(OrderFormComponent) private orderForm?: OrderFormComponent;

  submitting = false;
  loadingClient = true;
  readonly sourceOrderId: string | null;
  readonly initialOrder: Partial<OrderFormValue> | null;

  client: ClientIdentity = {
    name: '',
    email: localStorage.getItem('correo') ?? '',
    phone: '997 332 635',
    clientCodes: [],
  };
  selectedClientCode = '';

  readonly markets: MarketOption[] = [
    { code: 'BVL', name: 'BVL' },
    { code: 'CANACCORD', name: 'Canaccord' },
    { code: 'RENTA4', name: 'Renta 4' },
    { code: 'PERSHING', name: 'Pershing' },
  ];

  constructor(
    private readonly propuestaClienteService: PropuestaClienteService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
    private readonly representanteService: RepresentanteService,
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

    this.loadClientIdentity();
  }

  submitOrder(order: OrderFormValue): void {
    if (!this.selectedClientCode) {
      this.showMessage('Debe seleccionar un código de cliente', true);
      return;
    }

    const propuesta: PropuestaCliente = {
      correoCliente: this.client.email,
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
    this.propuestaClienteService.registrar(propuesta).pipe(
      timeout(8000),
      finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
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

  private loadClientIdentity(): void {
    // Adaptador temporal: se reemplazará por GET /Cliente/me cuando el API lo exponga.
    this.representanteService.getMe().pipe(
      finalize(() => {
        this.loadingClient = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: (account) => {
        this.client = {
          name: account.nombre,
          email: account.correoCorporativo,
          phone: '997 332 635',
          clientCodes: account.cosabcli,
        };
        this.selectedClientCode = account.cosabcli[0] ?? '';
      },
      error: () => this.showMessage('No se pudieron cargar los datos del cliente', true),
    });
  }

  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, '', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: isError ? ['snack-error'] : undefined,
    });
  }
}
