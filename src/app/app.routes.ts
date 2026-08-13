import { Routes } from '@angular/router';
import { AuthGuard } from './Auth/auth.guard';
import { ChangePasswordComponent } from './ChangePassword/ChangePassword';
import { ForgotPasswordComponent } from './ForgotPassword/ForgotPassword';
import { FormularioComponent } from './formulario/formulario';
import { LoginComponent } from './login/login';
import { ClientPortalLayoutComponent } from './orders/layouts/client-portal-layout/client-portal-layout';
import { ClientOrdersComponent } from './orders/pages/client-orders/client-orders';
import { OrderTrackingComponent } from './orders/pages/order-tracking/order-tracking';
import { PruebaComponent } from './prueba/prueba';

export const routes: Routes = [
  { path: '', redirectTo: 'Representantes', pathMatch: 'full' },

  {
    path: 'Representantes',
    component: LoginComponent,
    data: { portal: 'representantes' },
    pathMatch: 'full',
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
    path: 'Representantes',
    component: ClientPortalLayoutComponent,
    canActivate: [AuthGuard],
    data: { portal: 'representantes' },
    children: [
      { path: 'ordenes', component: FormularioComponent },
      {
        path: 'cuenta/contrasena',
        component: ChangePasswordComponent,
        data: { portal: 'representantes' },
      },
    ],
  },

  {
    path: 'Clientes',
    component: LoginComponent,
    data: { portal: 'clientes' },
    pathMatch: 'full',
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
  {
    path: 'Clientes',
    component: ClientPortalLayoutComponent,
    canActivate: [AuthGuard],
    data: { portal: 'clientes' },
    children: [
      { path: 'ordenes', component: ClientOrdersComponent },
      { path: 'seguimiento', component: OrderTrackingComponent },
      {
        path: 'cuenta/contrasena',
        component: ChangePasswordComponent,
        data: { portal: 'clientes' },
      },
    ],
  },

  { path: 'ordenes/representantes', redirectTo: 'Representantes/ordenes', pathMatch: 'full' },
  { path: 'ordenes/clientes', redirectTo: 'Clientes/ordenes', pathMatch: 'full' },
  { path: 'seguimiento', redirectTo: 'Clientes/seguimiento', pathMatch: 'full' },
  { path: 'formulario', redirectTo: 'Representantes/ordenes', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: 'Representantes/forgot-password', pathMatch: 'full' },
  { path: 'change-password', redirectTo: 'Representantes/change-password', pathMatch: 'full' },
  { path: 'prueba', component: PruebaComponent },
  { path: '**', redirectTo: 'Representantes' },
];
