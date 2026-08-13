import { Routes } from '@angular/router';
import { AuthGuard } from './Auth/auth.guard';
import { ChangePasswordComponent } from './ChangePassword/ChangePassword';
import { ForgotPasswordComponent } from './ForgotPassword/ForgotPassword';
import { FormularioComponent } from './formulario/formulario';
import { LoginComponent } from './login/login';
import { ClientOrdersComponent } from './orders/pages/client-orders/client-orders';
import { PruebaComponent } from './prueba/prueba';

export const routes: Routes = [
  { path: '', redirectTo: 'Representantes', pathMatch: 'full' },

  {
    path: 'Representantes',
    component: LoginComponent,
    data: { portal: 'representantes' },
  },
  {
    path: 'Representantes/ordenes',
    component: FormularioComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'Representantes/forgot-password',
    component: ForgotPasswordComponent,
    data: { portal: 'representantes' },
  },
  {
    path: 'Representantes/change-password',
    component: ChangePasswordComponent,
    data: { portal: 'representantes' },
  },

  {
    path: 'Clientes',
    component: LoginComponent,
    data: { portal: 'clientes' },
  },
  {
    path: 'Clientes/ordenes',
    component: ClientOrdersComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'Clientes/forgot-password',
    component: ForgotPasswordComponent,
    data: { portal: 'clientes' },
  },
  {
    path: 'Clientes/change-password',
    component: ChangePasswordComponent,
    data: { portal: 'clientes' },
  },

  { path: 'ordenes/representantes', redirectTo: 'Representantes/ordenes', pathMatch: 'full' },
  { path: 'ordenes/clientes', redirectTo: 'Clientes/ordenes', pathMatch: 'full' },
  { path: 'formulario', redirectTo: 'Representantes/ordenes', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: 'Representantes/forgot-password', pathMatch: 'full' },
  { path: 'change-password', redirectTo: 'Representantes/change-password', pathMatch: 'full' },
  { path: 'prueba', component: PruebaComponent },
  { path: '**', redirectTo: 'Representantes' },
];
