import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { RepresentanteService } from '../services/RepresentanteService';
import { PropuestaService } from '../services/PropuestaService';
import { ValorService } from '../services/ValorService';

import { Propuesta } from '../Model/Propuesta';
import { Valor } from '../Model/Valor';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-pagina-form',
  standalone: true,
  templateUrl: './formulario.html',
  styleUrls: ['./formulario.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatCardModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatCheckboxModule
  ]
})
export class FormularioComponent implements OnInit {

  NombreOperador = '';
  CorreoCorporativo = '';
  Cosabcli = '';
  Dni = '';

  Tipo = 'Compra';
  Cantidad: number | null = null;
  Instrumento = '';

  esAMercado = false;
  TipoOrden = "Limite"
  Precio: number | null = null;
  Mercado = 'Local';

  Moneda = '';              // 01 / 02
  DescripcionMoneda = '';   // Soles / Dólares

  valores: Valor[] = [];
  valoresFiltrados: Valor[] = [];

  bloqueado = false;

  constructor(
    private representanteService: RepresentanteService,
    private propuestaService: PropuestaService,
    private valorService: ValorService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.representanteService.getMe().subscribe({
      next: (rep) => {
        this.NombreOperador = rep.nombre;
        this.CorreoCorporativo = rep.correoCorporativo;
        this.Cosabcli = rep.cosabcli;
        this.Dni = rep.dni;
        this.cdr.detectChanges();
      }
    });

    this.valorService.getAll().subscribe({
      next: (data) => {
        this.valores = data;
        this.valoresFiltrados = [];
      }
    });
  }

  // 👉 Monto con máximo 2 decimales
  get monto(): number | null {
  if (this.Cantidad === null || this.Precio === null) return null;
  return Number((this.Cantidad * this.Precio).toFixed(2));
}

  // 👉 Precio con máximo 6 decimales
  validarPrecio(valor: number | null): void {
    if (valor === null) {
      this.Precio = null;
      return;
    }
    this.Precio = Number(valor.toFixed(6));
  }
  cambiarPassword(){
    this.router.navigate(['/change-password']);
  }

  grabar(): void {
    if (!this.Tipo || !this.Instrumento || this.Cantidad === null || (!this.esAMercado && this.Precio === null) || !this.Mercado){
      this.snackBar.open('⚠️ Complete todos los campos obligatorios', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-error']
      });
      this.cdr.detectChanges();
      return;
    }

    if (this.Cantidad <= 0 || (!this.esAMercado && (this.Precio ?? 0) <= 0)) {
      this.snackBar.open('⚠️ Cantidad y Precio deben ser mayores a cero', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-error']
      });
      return;
    }

    const propuesta: Propuesta = {
      NombreOperador: this.NombreOperador,
      CorreoCorporativo: this.CorreoCorporativo,
      Cosabcli: this.Cosabcli,
      Tipo: this.Tipo,
      Cantidad: this.Cantidad,
      Instrumento: this.Instrumento,
      TipoOrden: this.TipoOrden,
      Precio: this.Precio,
      Mercado: this.Mercado,
      Moneda: this.DescripcionMoneda,
      Dni: this.Dni
    };

    this.bloqueado = true;

  this.propuestaService.registrar(propuesta)
  .pipe(
    timeout(8000),          // ⬅️ clave
    finalize(() => {
      this.bloqueado = false;
      this.cdr.detectChanges();
    })
  )
  .subscribe({
    next: () => {
      this.snackBar.open('✅ Propuesta enviada correctamente', '', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-success']
      });
      this.limpiarFormulario();
    },
    error: () => {
      this.snackBar.open('❌ No hay respuesta del servidor', '', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-error']
      });
    }
  });
  }

  limpiarFormulario(): void {
    this.Tipo = 'Compra';
    this.Cantidad = null;
    this.Instrumento = '';
    this.Precio = null;
    this.Mercado = 'Local';
    this.Moneda = '';
    this.DescripcionMoneda = '';
    this.valoresFiltrados = [];
    this.bloqueado = false;

    this.cdr.detectChanges();
  }

  filtrarValores(texto: string): void {
    if (!texto) {
      this.valoresFiltrados = [];
      return;
    }
    const filtro = texto.toLowerCase();
    this.valoresFiltrados = this.valores.filter(v =>
      v.mnemo.toLowerCase().includes(filtro)
    );
  }

  validarInstrumento(): void {
    const existe = this.valores.some(v =>
      v.mnemo.toLowerCase() === this.Instrumento.toLowerCase()
    );
    if (!existe) {
      this.Instrumento = '';
      this.Moneda = '';
      this.DescripcionMoneda = '';
    }
  }

  onInstrumentoSeleccionado(mnemo: string): void {
    this.Instrumento = mnemo;
    this.valoresFiltrados = [];

    const seleccionado = this.valores.find(v => v.mnemo === mnemo);

    if (seleccionado) {
      this.Moneda = seleccionado.comon;

      if (this.Moneda === '01') {
        this.DescripcionMoneda = 'Soles';
      } else if (this.Moneda === '02') {
        this.DescripcionMoneda = 'Dólares';
      } else {
        this.DescripcionMoneda = '';
      }
    }
  }

  onInstrumentoFocus(): void {
    this.valoresFiltrados = [];
  }

  volverLogin(): void {
    this.router.navigate(['/']);
  }

  onTipoOrdenChange(): void {
  if (this.esAMercado) {
    this.TipoOrden = 'Mercado';
    this.Precio = null;
  } else {
    this.TipoOrden = 'Limite';
  }
}
}
