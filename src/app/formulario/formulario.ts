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

import { RepresentanteService } from '../services/RepresentanteService';
import { PropuestaService } from '../services/PropuestaService';
import { ValorService } from '../services/ValorService';

import { Propuesta } from '../Model/Propuesta';
import { Valor } from '../Model/Valor';

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
    MatSnackBarModule
  ]
})
export class FormularioComponent implements OnInit {

  NombreOperador = '';
  CorreoCorporativo = '';
  Cosabcli = '';

  Tipo = '';
  Cantidad: number | null = null;
  Instrumento = '';
  Precio: number | null = null;
  Mercado = '';

  valores: Valor[] = [];
  valoresFiltrados: Valor[] = [];

  bloqueado = false; // controla si los inputs y el botón están deshabilitados

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
  get monto(): number {
    if (this.Cantidad === null || this.Precio === null) return 0;
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

  grabar(): void {
    // Validaciones
    if (!this.Tipo || !this.Instrumento || this.Cantidad === null || this.Precio === null || !this.Mercado) {
      this.snackBar.open('⚠️ Complete todos los campos obligatorios', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-error']
      });
      return;
    }

    if (this.Cantidad <= 0 || this.Precio <= 0) {
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
      Precio: this.Precio,
      Mercado: this.Mercado
    };

    // Bloqueamos inputs y botón temporalmente
    this.bloqueado = true;

    this.propuestaService.registrar(propuesta).subscribe({
      next: () => {
        const snack = this.snackBar.open('✅ Propuesta enviada correctamente', '', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snack-success']
        });

        snack.afterDismissed().subscribe(() => {
          this.limpiarFormulario();
        });
      },
      error: () => {
        const snack = this.snackBar.open('❌ Error al enviar la propuesta', '', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snack-error']
        });
        snack.afterDismissed().subscribe(() => {
          this.bloqueado = false; // desbloqueamos si hubo error
        });
      }
    });
  }

  limpiarFormulario(): void {
    this.Tipo = '';
    this.Cantidad = null;
    this.Instrumento = '';
    this.Precio = null;
    this.Mercado = '';
    this.valoresFiltrados = [];
    this.bloqueado = false; // desbloquea todo

    this.cdr.detectChanges();
  }

  filtrarValores(texto: string): void {
    if (!texto) {
      this.valoresFiltrados = [];
      return;
    }
    const filtro = texto.toLowerCase();
    this.valoresFiltrados = this.valores.filter(v => v.mnemo.toLowerCase().includes(filtro));
  }

  validarInstrumento(): void {
    const existe = this.valores.some(v => v.mnemo.toLowerCase() === this.Instrumento.toLowerCase());
    if (!existe) this.Instrumento = '';
  }

  onInstrumentoSeleccionado(valor: string): void {
    this.Instrumento = valor;
    this.valoresFiltrados = [];
  }

  onInstrumentoFocus(): void {
    this.valoresFiltrados = [];
  }
  volverLogin() {
    this.router.navigate(['/']);
  }
  
}
