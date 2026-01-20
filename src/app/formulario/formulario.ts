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
    MatCardModule
  ]
})
export class FormularioComponent implements OnInit {

  // 🔹 Datos del representante
  NombreOperador = '';
  CorreoCorporativo = '';
  Cosabcli = '';

  // 🔹 Datos del formulario
  Tipo = '';
  Cantidad: number | null = null;
  Instrumento = '';
  Precio: number | null = null;
  Moneda = '';

  bloqueado = false;

  constructor(
    private representanteService: RepresentanteService,
    private propuestaService: PropuestaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    console.error('No hay userId en localStorage');
    return;
  }

  this.representanteService.getById(Number(userId))
    .subscribe({
      next: (rep) => {
        console.log('Representante cargado:', rep);

        // ⚠️ nombres EXACTOS como vienen del backend
        this.NombreOperador = rep.nombre;
        this.CorreoCorporativo = rep.correoCorporativo;
        this.Cosabcli = rep.cosabcli;

        // 🔴 ESTO ES LA CLAVE
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando representante', err);
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
    Moneda: this.Moneda
  };

  console.log(propuesta)

  this.propuestaService.registrar(propuesta)
    .subscribe({
      next: () => alert('Propuesta enviada correctamente'),
      error: () => alert('Error al enviar la propuesta')
    });
}

}
