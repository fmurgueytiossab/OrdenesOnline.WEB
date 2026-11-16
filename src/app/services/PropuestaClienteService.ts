import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, defer, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PropuestaCliente } from '../Model/PropuestaCliente';

export interface PropuestaClienteResponse {
  success: boolean;
  propuestaId: number;
  message: string;
  warning: string | null;
  docuSignEnviado: boolean;
  reutilizada: boolean;
}
interface PendingRequest { id: string; content: string; }

@Injectable({providedIn: 'root'})
export class PropuestaClienteService {
  constructor(private readonly http: HttpClient) {}

  registrar(propuesta: PropuestaCliente): Observable<PropuestaClienteResponse> {
    return defer(() => {
      // Una revision de permisos nueva no convierte el reintento en otra orden.
      const {revisionResponsables, ...intent} = propuesta;
      const content = JSON.stringify(intent);
      const storageKey = this.storageKey();
      const pending: PendingRequest[] = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
      let request = pending.find(item => item.content === content);
      if (!request) {
        request = {id: crypto.randomUUID(), content};
        pending.push(request);
        // Si no se puede conservar la identidad del envio, no se inicia el POST.
        sessionStorage.setItem(storageKey, JSON.stringify(pending));
      }
      const id = request.id;
      return this.http.post<PropuestaClienteResponse>(`${environment.apiUrl}/PropuestaCliente`, {...propuesta, solicitudId: id}).pipe(
        tap(() => {
          const current: PendingRequest[] = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
          sessionStorage.setItem(storageKey, JSON.stringify(current.filter(item => item.id !== id)));
        }),
      );
    });
  }

  private storageKey(): string {
    const token = localStorage.getItem('token');
    const actor = token ? jwtDecode<{sub: string}>(token).sub : 'sin-sesion';
    return `ordenes:propuestas-pendientes:${actor}`;
  }
}
