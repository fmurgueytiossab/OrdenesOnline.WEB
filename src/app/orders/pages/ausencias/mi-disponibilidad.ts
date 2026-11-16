import { PortalFeedbackService } from '../../../shared/portal-feedback.service';
import { REPRESENTANTES_UI, calendarDate, calendarIso } from '../../../shared/representantes-ui';
import { PortalModalComponent } from '../../../shared/portal-modal';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AusenciasConsulta, RegistrarMiAusencia, RepresentantesAusenciasService } from '../../../services/representantes-ausencias.service';

@Component({selector: 'app-mi-disponibilidad', standalone: true, imports: [...REPRESENTANTES_UI, PortalModalComponent],
  templateUrl: './mi-disponibilidad.html', styleUrl: './ausencias.css'})
export class MiDisponibilidadComponent implements OnInit {
  private readonly feedback = inject(PortalFeedbackService);
  private readonly api = inject(RepresentantesAusenciasService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy = inject(DestroyRef);
  data: AusenciasConsulta | null = null;
  busy = false; error = ''; message = ''; confirmarId = 0;
  detalle = '';
  get hoyDate() { return calendarDate(this.data?.hoyLima ?? ''); }
  get esOtro() { return this.data?.motivos.find(m => m.motivoAusenciaId === this.motivoId)?.codigo === 'OTRO'; }
  motivoCambiado() { if (!this.esOtro) this.detalle = ''; }
  periodo: 'HOY' | 'FECHAS' = 'HOY'; motivoId = 0; desde = ''; hasta = '';
  get desdeDate() { return calendarDate(this.desde); }
  set desdeDate(value: Date | null) { this.desde = calendarIso(value); }
  get hastaDate() { return calendarDate(this.hasta); }
  set hastaDate(value: Date | null) { this.hasta = calendarIso(value); }
  ngOnInit() { this.reload(); }
  reload() {
    this.busy = true; this.error = '';
    this.api.mias().pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => this.data = data, error: e => this.reportError(e.error?.title ?? 'No se pudo cargar tu disponibilidad.')});
  }
  guardar() {
    if (!this.data || this.busy || !this.motivoId) return;
    if (this.periodo === 'FECHAS' && (!this.desde || !this.hasta || this.desde < this.data.hoyLima || this.hasta < this.desde)) {
      this.reportError('Selecciona un rango válido, desde hoy y con fecha final igual o posterior a la inicial.'); return;
    }
    if (this.esOtro && !this.detalle.trim()) {this.reportError('Explica el motivo de tu ausencia.'); return;}
    const request: RegistrarMiAusencia = {revision: this.data.revision, motivoAusenciaId: this.motivoId, periodo: this.periodo};
    if (this.esOtro) request.detalle = this.detalle.trim();
    if (this.periodo === 'FECHAS') {request.desde = this.desde; request.hasta = this.hasta;}
    this.busy = true; this.error = ''; this.message = '';
    this.api.registrar(request).pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.feedback.success('Ausencia registrada. Volverás a estar disponible al finalizar el período.'); this.detalle = '';}, error: e => this.reportError(e.error?.title ?? 'No se pudo registrar la ausencia.')});
  }
  cancelar(id: number) {
    if (!this.data || this.busy) return;
    this.busy = true; this.error = ''; this.message = '';
    this.api.cancelar(id, this.data.revision).pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.confirmarId = 0; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.feedback.success('Ausencia cancelada.');}, error: e => this.reportError(e.error?.title ?? 'No se pudo cancelar la ausencia.')});
  }
  private reportError(message: string) { this.error = message; this.feedback.error(message); }
  ultimoDia(end: string) { return new Date(Date.parse(end) - 1).toISOString(); }
  estado(value: string) { return ({VIGENTE: 'Vigente', PROGRAMADA: 'Programada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada'} as Record<string, string>)[value] ?? value; }
}
