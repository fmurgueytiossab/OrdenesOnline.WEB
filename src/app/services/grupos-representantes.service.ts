import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface GrupoPersona { representanteId: number; nombre: string; correoCorporativo: string; activo: boolean; }
export interface GrupoMiembro { representanteId: number; nombre: string; correoCorporativo: string; usuarioActivo: boolean; activo: boolean; incluyeDescendientes: boolean; tieneAcceso: boolean; }
export interface GrupoDetalle { grupoId: number; nombre: string; grupoPadreId: number | null; activo: boolean; habilitadoEnJerarquia: boolean; puedeConsultarTodosClientes: boolean; miembros: GrupoMiembro[]; }
export interface GruposConsulta { revision: string; grupos: GrupoDetalle[]; representantes: GrupoPersona[]; }
export interface GuardarGrupo { revision: string; nombre: string; grupoPadreId: number | null; activo: boolean; puedeConsultarTodosClientes: boolean; }
@Injectable({providedIn: 'root'})
export class GruposRepresentantesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/Representantes/grupos`;
  consultar() { return this.http.get<GruposConsulta>(this.url); }
  guardar(id: number, request: GuardarGrupo) { return id ? this.http.post<GruposConsulta>(`${this.url}/${id}`, request) : this.http.post<GruposConsulta>(this.url, request); }
  miembro(grupoId: number, representanteId: number, request: {revision: string; activo: boolean; incluyeDescendientes: boolean}) {
    return this.http.post<GruposConsulta>(`${this.url}/${grupoId}/miembros/${representanteId}`, request);
  }
}
