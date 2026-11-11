import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Persona { representanteId: number; nombre: string; correoCorporativo: string; activo: boolean; }
export interface Gestor { representanteId: number; codigoGestor: string; activo: boolean; }
export interface Grupo { grupoId: number; nombre: string; grupoPadreId: number | null; activo: boolean; puedeConsultarTodosClientes: boolean; }
export interface Miembro { grupoId: number; representanteId: number; incluyeDescendientes: boolean; activo: boolean; }
export interface Regla { reglaId: number; titularRepresentanteId: number; tipoRenta: string; accion: string; modoResolucion: string; activo: boolean; }
export interface Ausencia { ausenciaId: number; representanteId: number; motivoAusenciaId: number; desdeUtc: string; hastaUtc: string; cancelada: boolean; }
export interface Configuracion { revision: string; usuarios: Persona[]; gestores: Gestor[]; grupos: Grupo[]; miembros: Miembro[]; reglas: Regla[]; opciones: {reglaId: number; responsableRepresentanteId: number}[]; motivos: {motivoAusenciaId: number; nombre: string; activo: boolean}[]; ausencias: Ausencia[]; perfiles: {representanteId: number; tipoRenta: string; esAsesor: boolean; esOperador: boolean}[]; }
export interface Responsable { representanteId: number; nombre: string; correoCorporativo: string; }
export interface Titular { representanteId: number; nombre: string; puedeCrear: boolean; orden: Responsable[]; operacion: Responsable[]; error: string | null; }
export interface Responsables { tipoRenta: string; revision: string; titulares: Titular[]; }
export interface Cambio { tipo: string; revision?: string; id?: number; representanteId?: number; nombre?: string; codigoGestor?: string; grupoPadreId?: number | null; puedeConsultarTodosClientes?: boolean; activo?: boolean; incluyeDescendientes?: boolean; tipoRenta?: string; esAsesor?: boolean; esOperador?: boolean; accion?: string; modoResolucion?: string; opciones?: number[]; motivoAusenciaId?: number; desde?: string; hasta?: string; }
@Injectable({providedIn: 'root'})
export class RepresentantesConfiguracionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/Representantes/configuracion`;
  sesion() { return this.http.get<{enabled: boolean; esAdmin: boolean}>(`${this.url}/sesion`); }
  configuracion() { return this.http.get<Configuracion>(this.url); }
  catalogo() { return this.http.get<{codigo: string; nombre: string}[]>(`${this.url}/gestores`); }
  auditoria() { return this.http.get<{auditoriaId: number; actorRepresentanteId: number; entidad: string; clave: string; fechaUtc: string}[]>(`${this.url}/auditoria`); }
  guardar(cambio: Cambio) { return this.http.post<Configuracion>(`${this.url}/cambios`, cambio); }
  responsables(cosabcli: string, instrumento: string) {
    return this.http.get<Responsables>(`${this.url}/responsables`, {params: new HttpParams().set('cosabcli', cosabcli).set('instrumento', instrumento)});
  }
}
