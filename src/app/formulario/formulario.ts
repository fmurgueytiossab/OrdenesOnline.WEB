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

  NombreOperador = '';
  CorreoCorporativo = '';
  Cosabcli = '';

  Tipo = '';
  Cantidad: number | null = null;
  Instrumento = '';
  Precio: number | null = null;
  Mercado = '';
  
  bloqueado: boolean = false;

  get monto(): number {
  return (this.Cantidad || 0) * (this.Precio || 0);
}

  constructor(
    private representanteService: RepresentanteService,
    private propuestaService: PropuestaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    // 🚨 Si no hay token → login
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // ✅ El backend sabe quién eres por el token
    this.representanteService.getMe()
      .subscribe({
        next: (rep) => {
          this.NombreOperador = rep.nombre;
          this.CorreoCorporativo = rep.correoCorporativo;
          this.Cosabcli = rep.cosabcli;

          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
          }
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
}
