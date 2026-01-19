import { ChangeDetectorRef, Component,LOCALE_ID } from '@angular/core';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatCardModule} from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { PropuestaService } from '../services/PropuestaService';
import { Propuesta } from '../Model/Propuesta';

registerLocaleData(localeEs);

@Component({
  selector: 'app-pagina-form',
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatRadioModule
  ],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
})
export class Formulario {

constructor(
  private route: ActivatedRoute,
  private propuestaService: PropuestaService,
  private cdr: ChangeDetectorRef
) {}

NombreOperador = '';
Dni = '';
CorreoCorporativo = '';
Cosabcli = '';
Tipo = '';
Cantidad : number =  0;
Instrumento = '';
Precio: number =  0;
Moneda = '';

mensaje = '';
bloqueado = false;
mostrarDatos = false;

grabar() {

  const propuesta :Propuesta = {
  NombreOperador : this.NombreOperador,
  Dni : this.Dni,
  CorreoCorporativo : this.CorreoCorporativo,
  Cosabcli : this.Cosabcli,
  Tipo : this.Tipo,
  Cantidad : this.Cantidad,
  Instrumento : this.Instrumento,
  Precio : this.Precio,
  Moneda : this.Moneda
  }

  const peticion = this.propuestaService.registrar(propuesta); // no existe → insertar

  peticion.subscribe({
    next: () => {
      this.mensaje = "Se enviaron los datos correctamente";
    },
    error: err => {
      console.error(err);
      console.error(propuesta);
      alert("Error al guardar");
    }
  });
}
}
