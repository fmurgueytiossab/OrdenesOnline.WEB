import { Routes } from '@angular/router';
import { FormularioComponent } from './formulario/formulario';
import { LoginComponent } from './login/login';
import { AuthGuard } from './Auth/auth.guard';
import { PruebaComponent } from './prueba/prueba';

export const routes: Routes =
 [
   { path: '', component: LoginComponent },
   { 
    path: 'formulario', 
    component: FormularioComponent,
    canActivate: [AuthGuard]   // <-- aquí
  },
  { 
    path: 'prueba', 
    component: PruebaComponent   
  }
 ];
