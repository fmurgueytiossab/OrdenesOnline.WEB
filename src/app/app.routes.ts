import { Routes } from '@angular/router';
import { FormularioComponent } from './formulario/formulario';
import { LoginComponent } from './login/login';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'formulario', component: FormularioComponent }
];
