import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { Propuesta } from '../../../Model/Propuesta';
import { PropuestaService } from '../../../services/PropuestaService';
import { OrderFormComponent } from '../../components/order-form/order-form';
import { MarketOption, OrderFormValue } from '../../models/order-form-value';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';

interface MockClient {
  name: string;
  email: string;
  phone: string;
  clientCode: string;
  documentNumber: string;
}

@Component({
  selector: 'app-client-orders',
  standalone: true,
  templateUrl: './client-orders.html',
  styleUrls: ['./client-orders.css'],
  imports: [MatSnackBarModule, OrderFormComponent],
})
export class ClientOrdersComponent {
  @ViewChild(OrderFormComponent) private orderForm?: OrderFormComponent;

  submitting = false;
  readonly sourceOrderId: string | null;
  readonly initialOrder: Partial<OrderFormValue> | null;

  readonly client: MockClient = {
    name: 'Cliente de prueba',
    email: 'cliente.prueba@correo.com',
    phone: '+51 999 999 999',
    clientCode: 'CLI-MOCK-001',
    documentNumber: '00000000',
  };

  readonly markets: MarketOption[] = [
    { code: 'BVL', name: 'BVL' },
    { code: 'CANACCORD', name: 'Canaccord' },
    { code: 'RENTA4', name: 'Renta 4' },
    { code: 'PERSHING', name: 'Pershing' },
  ];

  constructor(
    private readonly propuestaService: PropuestaService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
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
  }

  submitOrder(order: OrderFormValue): void {
    // Adaptador temporal al contrato actual. Se reemplazará por ClientOrderRequest
    // cuando esté disponible POST /api/client-orders.
    const propuesta: Propuesta = {
      NombreOperador: this.client.name,
      CorreoCorporativo: this.client.email,
      Cosabcli: this.client.clientCode,
      Tipo: order.tipo,
      Cantidad: order.cantidad,
      Instrumento: order.instrumento,
      TipoOrden: order.tipoOrden,
      Precio: order.precio,
      Monto: order.monto,
      Mercado: order.mercado,
      Moneda: order.moneda,
      Dni: this.client.documentNumber,
      Vigencia: order.vigencia,
      SourceOrderId: this.sourceOrderId ?? undefined,
    };

    this.submitting = true;
    this.propuestaService.registrar(propuesta).pipe(
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

  private showMessage(message: string, isError = false): void {
    this.snackBar.open(message, '', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: isError ? ['snack-error'] : undefined,
    });
  }
}
