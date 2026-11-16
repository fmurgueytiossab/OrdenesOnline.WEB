import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AusenciaRegistro {
  ausenciaId: number; representanteId: number; nombre: string; motivo: string;
  desdeUtc: string; hastaUtc: string; estado: 'VIGENTE' | 'PROGRAMADA' | 'FINALIZADA' | 'CANCELADA';
  puedeCancelar: boolean; detalle?: string | null; modificadoPorId: number; fechaModificacionUtc: string;
}
export interface AusenciasConsulta {
  revision: string; hoyLima: string; representanteId: number; nombre: string; disponible: boolean;
  motivos: {motivoAusenciaId: number; nombre: string; codigo?: string}[];
  representantes: {representanteId: number; nombre: string}[]; ausencias: AusenciaRegistro[];
}
export interface RegistrarMiAusencia {
  revision: string; motivoAusenciaId: number; periodo: 'HOY' | 'FECHAS'; desde?: string; hasta?: string; detalle?: string;
}
export interface AusenciasFiltro { representanteId?: number; desde?: string; hasta?: string; estado?: string; }
@Injectable({providedIn: 'root'})
export class RepresentantesAusenciasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/Representantes/ausencias`;
  mias() { return this.http.get<AusenciasConsulta>(`${this.url}/mias`); }
  registrar(request: RegistrarMiAusencia) { return this.http.post<AusenciasConsulta>(`${this.url}/mias`, request); }
  cancelar(id: number, revision: string) { return this.http.post<AusenciasConsulta>(`${this.url}/mias/${id}/cancelar`, {revision}); }
  registro(filter: AusenciasFiltro = {}) {
    let params = new HttpParams();
    if (filter.representanteId) params = params.set('representanteId', filter.representanteId);
    if (filter.desde) params = params.set('desde', filter.desde);
    if (filter.hasta) params = params.set('hasta', filter.hasta);
    if (filter.estado) params = params.set('estado', filter.estado);
    return this.http.get<AusenciasConsulta>(this.url, {params});
  }
}
