import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ResponsableAdmin { representanteId: number; nombre: string; correoCorporativo: string; activo: boolean; disponibleEjecutar: boolean; }
export interface ReglaAdmin { reglaId: number; titularRepresentanteId: number; titular: string; tipoRenta: string; accion: string; modoResolucion: 'TITULAR' | 'LISTA'; activo: boolean; opciones: ResponsableAdmin[]; modificadoPorId: number; modificadoPor: string; fechaModificacionUtc: string; }
export interface ReglasConsulta { revision: string; representantes: ResponsableAdmin[]; reglas: ReglaAdmin[]; }
export interface GuardarRegla { revision: string; modoResolucion: 'TITULAR' | 'LISTA'; opciones: number[]; activo: boolean; }
@Injectable({providedIn: 'root'})
export class ReglasResponsablesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/Representantes/reglas-responsables`;
  consultar() { return this.http.get<ReglasConsulta>(this.url); }
  guardar(titularId: number, renta: string, accion: string, request: GuardarRegla) {
    return this.http.post<ReglasConsulta>(`${this.url}/${titularId}/${encodeURIComponent(renta)}/${encodeURIComponent(accion)}`, request);
  }
}
