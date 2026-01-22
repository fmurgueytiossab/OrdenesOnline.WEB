import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RepresentanteService } from '../services/RepresentanteService';
import { PropuestaService } from '../services/PropuestaService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { Propuesta } from '../Model/Propuesta';
import { Router } from '@angular/router';
import { Valor } from '../Model/Valor';
import { ValorService } from '../services/ValorService';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

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
    MatDatepickerModule,
    MatNativeDateModule,
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
  
  bloqueado: boolean = false;

  get monto(): number {
    return (this.Cantidad || 0) * (this.Precio || 0);
  }

 

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

  grabar(): void {

    if (this.Cantidad === null || this.Precio === null) {
      alert('Cantidad y Precio son obligatorios');
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

    this.propuestaService.registrar(propuesta)
      .subscribe({
        next: () => alert('Propuesta enviada correctamente'),
        error: () => alert('Error al enviar la propuesta')
      });
  }

filtrarValores(texto: string) {
  if (!texto) {
    this.valoresFiltrados = [];
    return;
  }

  const filtro = texto.toLowerCase();

  this.valoresFiltrados = this.valores.filter(v =>
    v.mnemo.toLowerCase().includes(filtro)
  );
}

  validarInstrumento() {
  const existe = this.valores.some(
    v => v.mnemo.toLowerCase() === this.Instrumento.toLowerCase()
  );

  if (!existe) {
    this.Instrumento = '';
  }
}

 onInstrumentoSeleccionado(valor: string) {
   this.Instrumento = valor;
  this.valoresFiltrados = [];
}

onInstrumentoFocus() {
  this.valoresFiltrados = [];
}
}
