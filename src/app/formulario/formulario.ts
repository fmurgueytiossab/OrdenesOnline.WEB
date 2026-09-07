import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { Propuesta } from '../Model/Propuesta';
import { OrderFormComponent } from '../orders/components/order-form/order-form';
import { MarketOption, OrderFormValue } from '../orders/models/order-form-value';
import { PropuestaService } from '../services/PropuestaService';
import { RepresentanteService } from '../services/RepresentanteService';
import { MarketHoursService } from '../orders/services/market-hours.service';

@Component({
  selector: 'app-pagina-form',
  standalone: true,
  templateUrl: './formulario.html',
  styleUrls: ['./formulario.css'],
  providers: [MarketHoursService],
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatSnackBarModule,
    OrderFormComponent,
  ],
})
export class FormularioComponent {
  private readonly marketHours = inject(MarketHoursService);
  @ViewChild(OrderFormComponent) private orderForm?: OrderFormComponent;

  nombreOperador = '';
  correoCorporativo = '';
  codigosCliente: string[] = [];
  codigoClienteSeleccionado = '';
  dni = '';
  enviando = false;

  readonly markets: MarketOption[] = [
    { code: 'BVL', name: 'BVL' },
    { code: 'Canaccord', name: 'Canaccord' },
    { code: 'Euroclear', name: 'Euroclear' },
  ];

  constructor(
    private readonly representanteService: RepresentanteService,
    private readonly propuestaService: PropuestaService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.loadRepresentative();
  }

  submitOrder(order: OrderFormValue): void {
    const hours = this.marketHours.current();
    if (!hours || !hours.isOpen && (hours.applyToAllMarkets || ['BVL', '01', 'LOCAL'].includes(order.mercado.toUpperCase()))) {
      this.marketHours.refresh();
      return;
    }
    if (!this.codigoClienteSeleccionado) {
      this.showMessage('⚠️ Debe seleccionar un código de cliente', true);
      return;
    }

    const propuesta: Propuesta = {
      NombreOperador: this.nombreOperador,
      CorreoCorporativo: this.correoCorporativo,
      Cosabcli: this.codigoClienteSeleccionado,
      Tipo: order.tipo,
      Cantidad: order.cantidad,
      Instrumento: order.instrumento,
      TipoOrden: order.tipoOrden,
      Precio: order.precio,
      Monto: order.monto,
      Mercado: order.mercado,
      Moneda: order.moneda,
      Dni: this.dni,
      Vigencia: order.vigencia,
    };

    this.sendProposal(propuesta);
  }

  clearOrderForm(): void {
    this.orderForm?.reset();
  }

  private loadRepresentative(): void {
    this.representanteService.getMe().subscribe({
      next: (representative) => {
        this.nombreOperador = representative.nombre;
        this.correoCorporativo = representative.correoCorporativo;
        this.codigosCliente = representative.cosabcli;
        this.codigoClienteSeleccionado = representative.cosabcli[0] ?? '';
        this.dni = representative.dni;
        this.cdr.detectChanges();
      },
      error: () => this.showMessage('❌ No se pudieron cargar los datos del representante', true),
    });
  }

  private sendProposal(propuesta: Propuesta): void {
    this.enviando = true;
    this.propuestaService.registrar(propuesta).pipe(
      timeout(8000),
      finalize(() => {
        this.enviando = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: () => {
        this.showMessage('✅ Propuesta enviada correctamente');
        this.orderForm?.reset();
      },
      error: (error) => {
        if (error.status === 409) this.marketHours.refresh();
        this.showMessage(error.error?.title || 'No se pudo registrar la orden. Inténtalo de nuevo.', true);
      },
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
