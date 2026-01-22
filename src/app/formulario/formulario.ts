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
    MatAutocompleteModule
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

  bloqueado = false;

  constructor(
    private representanteService: RepresentanteService,
    private propuestaService: PropuestaService,
    private valorService: ValorService,
    private cdr: ChangeDetectorRef,
    private router: Router
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
    if (this.Cantidad === null || this.Precio === null) {
      return 0;
    }

    const monto = this.Cantidad * this.Precio;
    return Number(monto.toFixed(2));
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

    // Validar campos obligatorios
    if (
      !this.Tipo ||
      !this.Instrumento ||
      this.Cantidad === null ||
      this.Precio === null ||
      !this.Mercado
    ) {
      alert('Debe completar todos los campos obligatorios');
      return;
    }

    // Validar valores positivos
    if (this.Cantidad <= 0 || this.Precio <= 0) {
      alert('Cantidad y Precio deben ser mayores a cero');
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

    this.propuestaService.registrar(propuesta).subscribe({
      next: () => alert('Propuesta enviada correctamente'),
      error: () => alert('Error al enviar la propuesta')
    });
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
    const existe = this.valores.some(
      v => v.mnemo.toLowerCase() === this.Instrumento.toLowerCase()
    );

    if (!existe) {
      this.Instrumento = '';
    }
  }

  onInstrumentoSeleccionado(valor: string): void {
    this.Instrumento = valor;
    this.valoresFiltrados = [];
  }

  onInstrumentoFocus(): void {
    this.valoresFiltrados = [];
  }
}
