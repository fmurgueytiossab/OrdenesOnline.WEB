import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { Propuesta } from '../../../Model/Propuesta';
import { PropuestaService } from '../../../services/PropuestaService';
import { PORTAL_ROUTES } from '../../../shared/portal-routes';
import { OrderFormComponent } from '../../components/order-form/order-form';
import { MarketOption, OrderFormValue } from '../../models/order-form-value';

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
  imports: [MatButtonModule, MatSnackBarModule, OrderFormComponent],
})
export class ClientOrdersComponent {
  @ViewChild(OrderFormComponent) private orderForm?: OrderFormComponent;

  submitting = false;

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
    { code: 'OTRO', name: 'Otro' },
  ];

  constructor(
    private readonly propuestaService: PropuestaService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
  ) {}

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

  changePassword(): void {
    this.router.navigateByUrl(PORTAL_ROUTES.clientes.changePassword);
  }

  backToLogin(): void {
    this.router.navigateByUrl(PORTAL_ROUTES.clientes.login);
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
