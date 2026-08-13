import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Valor } from '../../../Model/Valor';
import { ValorService } from '../../../services/ValorService';
import { MarketOption, OrderFormValue } from '../../models/order-form-value';

@Component({
  selector: 'app-order-form',
  standalone: true,
  templateUrl: './order-form.html',
  styleUrls: ['./order-form.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
})
export class OrderFormComponent implements OnInit {
  @Input() markets: MarketOption[] = [];
  @Input() marketControl: 'radio' | 'select' = 'radio';
  @Input() submitting = false;

  @Output() orderSubmitted = new EventEmitter<OrderFormValue>();
  @Output() cancelled = new EventEmitter<void>();

  tipo = 'Compra';
  cantidad: number | null = null;
  instrumento = '';
  esAMercado = false;
  tipoOrden = 'Limite';
  precio: number | null = null;
  mercado = '';
  montoManual: number | null = null;
  moneda = '';
  descripcionMoneda = '';
  tipoVigencia = 'Hoy';
  fechaSeleccionada: Date | null = null;
  readonly minFecha = new Date(new Date().setDate(new Date().getDate() + 1));

  valores: Valor[] = [];
  valoresFiltrados: Valor[] = [];

  constructor(
    private readonly valorService: ValorService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.mercado = this.markets[0]?.code ?? '';

    this.valorService.getAll().subscribe({
      next: (data) => {
        this.valores = data;
      },
      error: () => this.showError('No se pudo cargar el catálogo de instrumentos'),
    });
  }

  get monto(): number | null {
    if (this.cantidad === null) return null;
    if (this.cantidad === 0) return this.montoManual;
    if (this.cantidad > 0 && this.esAMercado) return null;
    if (this.cantidad > 0 && this.precio !== null) {
      return Number((this.cantidad * this.precio).toFixed(2));
    }
    return null;
  }

  submit(): void {
    if (!this.mercado) {
      this.showError('Debe seleccionar un mercado');
      return;
    }

    if (!this.tipo || !this.instrumento || this.cantidad === null || (!this.esAMercado && this.precio === null)) {
      this.showError('Complete todos los campos obligatorios');
      return;
    }

    if (this.tipoVigencia === 'Fecha' && !this.fechaSeleccionada) {
      this.showError('Debe seleccionar la fecha de vigencia');
      return;
    }

    if (this.cantidad < 0 || (!this.esAMercado && (this.precio ?? 0) <= 0)) {
      this.showError('Cantidad y precio deben ser mayores a cero');
      return;
    }

    if (this.cantidad === 0 && this.montoManual === null) {
      this.showError('Debe ingresar un monto');
      return;
    }

    if (this.cantidad === 0 && this.precio !== null && (this.montoManual ?? 0) < this.precio) {
      this.showError('El monto debe ser mayor o igual al precio');
      return;
    }

    this.orderSubmitted.emit({
      tipo: this.tipo,
      cantidad: this.cantidad,
      instrumento: this.instrumento,
      tipoOrden: this.tipoOrden,
      precio: this.precio,
      monto: this.monto,
      mercado: this.mercado,
      moneda: this.descripcionMoneda,
      vigencia: this.buildValidity(),
    });
  }

  reset(): void {
    this.tipo = 'Compra';
    this.cantidad = null;
    this.instrumento = '';
    this.esAMercado = false;
    this.tipoOrden = 'Limite';
    this.precio = null;
    this.mercado = this.markets[0]?.code ?? '';
    this.montoManual = null;
    this.moneda = '';
    this.descripcionMoneda = '';
    this.tipoVigencia = 'Hoy';
    this.fechaSeleccionada = null;
    this.valoresFiltrados = [];
  }

  filterValues(text: string): void {
    if (!text) {
      this.valoresFiltrados = [];
      return;
    }
    const filter = text.toLowerCase();
    this.valoresFiltrados = this.valores.filter((value) => value.mnemo.toLowerCase().includes(filter));
  }

  validateInstrument(): void {
    const selected = this.valores.find(
      (value) => value.mnemo.toLowerCase() === this.instrumento.toLowerCase(),
    );
    if (!selected) {
      this.instrumento = '';
      this.moneda = '';
      this.descripcionMoneda = '';
    }
  }

  selectInstrument(mnemo: string): void {
    this.instrumento = mnemo;
    this.valoresFiltrados = [];
    const selected = this.valores.find((value) => value.mnemo === mnemo);
    this.moneda = selected?.comon ?? '';
    this.descripcionMoneda = this.moneda === '01' ? 'Soles' : this.moneda === '02' ? 'Dólares' : '';
  }

  updateAmount(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.montoManual = value < 0 ? 0 : value;
  }

  formatPrice(): void {
    if (this.precio === null) return;
    this.precio = this.precio <= 0 || Number.isNaN(this.precio) ? null : Number(this.precio.toFixed(3));
  }

  updateOrderType(): void {
    this.tipoOrden = this.esAMercado ? 'Mercado' : 'Limite';
    if (this.esAMercado) this.precio = null;
  }

  updateValidity(): void {
    if (this.tipoVigencia !== 'Fecha') this.fechaSeleccionada = null;
  }

  private buildValidity(): string {
    if (this.tipoVigencia === 'Permanente') return 'Permanente';
    if (this.tipoVigencia === 'Fecha' && this.fechaSeleccionada) {
      const day = this.fechaSeleccionada.getDate().toString().padStart(2, '0');
      const month = (this.fechaSeleccionada.getMonth() + 1).toString().padStart(2, '0');
      return `Hasta el ${day}/${month}/${this.fechaSeleccionada.getFullYear()}`;
    }
    return `Por hoy : ${new Date().toLocaleDateString('es-PE')}`;
  }

  private showError(message: string): void {
    this.snackBar.open(`⚠️ ${message}`, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snack-error'],
    });
  }
}
