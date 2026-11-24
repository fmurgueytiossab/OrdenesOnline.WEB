import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PortalDropdownComponent } from '../../../shared/portal-dropdown';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  finalize,
  of,
  Subject,
  switchMap,
} from 'rxjs';

import { ClienteSearchResult } from '../../../Model/ClienteSearchResult';
import { PropuestaCliente } from '../../../Model/PropuestaCliente';
import { ClienteService } from '../../../services/ClienteService';
import { PropuestaClienteService } from '../../../services/PropuestaClienteService';
import { RepresentantesConfiguracionService, Responsable, Responsables, Titular } from '../../../services/representantes-configuracion.service';
import { PortalFeedbackService } from '../../../shared/portal-feedback.service';
import { OrderFormComponent } from '../../components/order-form/order-form';
import { MarketOption, OrderFormValue } from '../../models/order-form-value';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';
import { MarketHoursService } from '../../services/market-hours.service';

interface ClientIdentity {
  name: string;
  phones: string[];
  bloqueoMotivo: string;
}

@Component({
  selector: 'app-client-orders',
  standalone: true,
  templateUrl: './client-orders.html',
  styleUrls: ['./client-orders.css'],
  providers: [MarketHoursService],
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PortalDropdownComponent,
    MatSnackBarModule,
    OrderFormComponent,
  ],
})
export class ClientOrdersComponent {
  private readonly marketHours = inject(MarketHoursService);
  private readonly feedback = inject(PortalFeedbackService);
  @ViewChild(OrderFormComponent) private orderForm?: OrderFormComponent;

  submitting = false;
  searchingClients = false;
  clientSearch: string | ClienteSearchResult = '';
  clientSearchError = false;
  hasSearchedClients = false;
  clientResults: ClienteSearchResult[] = [];
  readonly sourceOrderId: string | null;
  readonly initialOrder: Partial<OrderFormValue> | null;
  configurationLoaded = false;
  configurationEnabled = false;
  responsibleLoading = false;
  responsibleError = '';
  responsibleOptions: Responsables | null = null;
  titularId = 0;
  orderResponsibleId = 0;
  operationResponsibleId = 0;
  modalidadReferencia: 'Inmediata' | 'Manual' = 'Inmediata';
  private currentInstrument = '';
  get hasSelectedInstrument() { return !!this.currentInstrument; }
  private readonly responsibleRequests = new Subject<void>();
  get selectedTitular(): Titular | undefined { return this.responsibleOptions?.titulares.find(t => t.representanteId === this.titularId); }
  private readonly clientSearchTerms = new Subject<string>();

  client: ClientIdentity | null = null;
  selectedClientCode = '';
  orderBlockMessage = '';
  submissionError = '';

  readonly markets: MarketOption[] = [
    { code: '01', name: 'BVL' },
    { code: '98', name: 'Canaccord' },
    { code: '16', name: 'Euroclear' },
  ];

  get orderFormDisabled(): boolean {
    return this.orderBlockMessage.length > 0;
  }

  constructor(
    private readonly propuestaClienteService: PropuestaClienteService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly clienteService: ClienteService,
    destroyRef: DestroyRef,
    trackingService: ClientOrderTrackingService,
    private readonly configurationApi: RepresentantesConfiguracionService,
  ) {
    this.responsibleRequests.pipe(switchMap(() => {
      this.responsibleOptions = null; this.titularId = 0; this.orderResponsibleId = 0; this.operationResponsibleId = 0;
      this.responsibleError = ''; this.responsibleLoading = false;
      if (!this.configurationEnabled || !this.selectedClientCode || !this.currentInstrument) return of(null);
      this.responsibleLoading = true;
      return this.configurationApi.responsables(this.selectedClientCode, this.currentInstrument).pipe(
        catchError(error => {
          this.responsibleError = error.error?.detail || error.error?.title || 'No se pudieron resolver los responsables.';
          this.feedback.error(this.responsibleError);
          return of(null);
        }));
    }), takeUntilDestroyed(destroyRef)).subscribe(options => {
      this.responsibleLoading = false; this.responsibleOptions = options;
      if (options && !options.titulares.length) this.feedback.error('No hay titulares de cartera configurados para este cliente.');
      if (options?.titulares.length === 1) {this.titularId = options.titulares[0].representanteId; this.selectTitular();}
      this.cdr.markForCheck();
    });
    this.configurationApi.sesion().pipe(takeUntilDestroyed(destroyRef)).subscribe({next: session => {
      this.configurationEnabled = session.enabled; this.configurationLoaded = true; this.responsibleRequests.next(); this.cdr.markForCheck();
    }, error: () => {this.responsibleError = 'No se pudo comprobar la configuración. Recarga la página antes de enviar.'; this.feedback.error(this.responsibleError); this.cdr.markForCheck();}});
    this.sourceOrderId = this.router.parseUrl(this.router.url).queryParams['sourceOrderId'] ?? null;
    const sourceOrder = this.sourceOrderId ? trackingService.getById(this.sourceOrderId) : undefined;
    this.initialOrder = sourceOrder
      ? {
          tipo: sourceOrder.side,
          cantidad: sourceOrder.proposedQuantity,
          instrumento: sourceOrder.instrument,
          precio: sourceOrder.price,
          monto: sourceOrder.price === null
            ? null
            : sourceOrder.proposedQuantity * sourceOrder.price,
          mercado: '01',
        }
      : null;

    this.clientSearchTerms
      .pipe(
        debounceTime(300),
        switchMap((query) => {
          const normalizedQuery = query.trim();
          this.clientSearchError = false;

          if (normalizedQuery.length < 3) {
            this.searchingClients = false;
            this.hasSearchedClients = false;
            return of([]);
          }

          this.searchingClients = true;
          this.hasSearchedClients = false;
          return this.clienteService.buscar(normalizedQuery).pipe(
            catchError(() => {
              this.clientSearchError = true;
              return of([]);
            }),
            finalize(() => {
              this.searchingClients = false;
              this.cdr.detectChanges();
            }),
          );
        }),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((clients) => {
        this.clientResults = clients;
        const searchText = typeof this.clientSearch === 'string' ? this.clientSearch : '';
        this.hasSearchedClients = searchText.trim().length >= 3;
        this.cdr.detectChanges();
      });
  }

  submitOrder(order: OrderFormValue): void {
    if (this.submitting) return;
    if (!this.configurationLoaded) {this.feedback.error('Espera a que se compruebe la configuración de responsables.'); return;}
    if (!this.client || !this.selectedClientCode) {
      this.feedback.error('Debe buscar y seleccionar un cliente');
      return;
    }

    if (this.client.bloqueoMotivo) {
      this.showBlockedClientMessage(this.client.bloqueoMotivo);
      return;
    }

    if (this.client.phones.length === 0) {
      this.showMissingPhoneMessage();
      return;
    }

    const propuesta: PropuestaCliente = {
      cosabcli: this.selectedClientCode,
      tipo: order.tipo,
      tipoOrden: order.tipoOrden,
      cantidad: order.cantidad,
      instrumento: order.instrumento,
      precio: order.precio,
      monto: order.monto,
      mercado: order.mercado,
      moneda: order.moneda.toLocaleLowerCase('es-PE'),
      vigencia: order.vigencia,
    };
    if (this.configurationEnabled) {
      if (order.instrumento !== this.currentInstrument || this.responsibleSubmissionBlocked || !this.modalidadReferencia) {
        this.feedback.error(this.responsibleSelectionError || this.responsibleError || 'Selecciona titular, responsables y modalidad para este instrumento.'); return;
      }
      Object.assign(propuesta, {titularRepresentanteId: this.titularId, responsableOrdenRepresentanteId: this.orderResponsibleId,
        responsableOperacionRepresentanteId: this.operationResponsibleId, modalidadReferencia: this.modalidadReferencia,
        revisionResponsables: this.responsibleOptions!.revision});
    }

    this.submissionError = '';
    this.submitting = true;
    this.propuestaClienteService
      .registrar(propuesta)
      .pipe(
        finalize(() => {
          this.submitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: result => {
          if (result.warning || !result.docuSignEnviado) {
            this.feedback.error(`Propuesta #${result.propuestaId} guardada. ${result.warning || 'El envío para firma aún no está confirmado. Revisa Mis órdenes antes de repetir.'}`);
          } else {
            this.feedback.success(result.reutilizada ? result.message : `Propuesta #${result.propuestaId} creada y envío aceptado para firma.`);
          }
          this.modalidadReferencia = 'Inmediata';
          this.orderForm?.reset();
        },
        error: (error) => {
          if (error.status === 409) {this.marketHours.refresh(); this.responsibleRequests.next();}
          const uncertain = error.status === 0 || error.status >= 500 || error.name === 'TimeoutError';
          this.submissionError = (!uncertain && (error.error?.detail || error.error?.title)) ||
            'No se pudo confirmar el resultado del envío. La propuesta puede haberse guardado. Si reintentas la misma orden, se comprobará el registro existente.';
          this.feedback.error(this.submissionError);
        },
      });
  }

  clearOrderForm(): void {
    this.modalidadReferencia = 'Inmediata';
    this.orderForm?.reset();
  }
  onInstrumentChanged(instrument: string): void { if (instrument === this.currentInstrument) return; this.currentInstrument = instrument; this.responsibleRequests.next(); }
  refreshResponsibles(): void { this.responsibleRequests.next(); }
  get responsibleSubmissionBlocked(): boolean {
    if (!this.configurationLoaded) return true;
    if (!this.configurationEnabled) return false;
    const titular = this.selectedTitular;
    return this.responsibleLoading || !!this.responsibleError || !this.responsibleOptions
      || !titular?.puedeCrear || !!titular.error
      || !titular.orden.some(r => r.representanteId === this.orderResponsibleId && r.disponible !== false)
      || !titular.operacion.some(r => r.representanteId === this.operationResponsibleId && r.disponible !== false);
  }
  responsibleLabel(person: Responsable): string {
    return person.disponible === false ? `${person.nombre} — ${this.unavailabilityLabel(person)}` : person.nombre;
  }
  unavailabilityLabel(person: Responsable | undefined): string {
    return person?.motivoNoDisponible ? `No disponible — ${person.motivoNoDisponible}` : 'No disponible';
  }
  get responsibleSelectionError(): string | null {
    const titular = this.selectedTitular;
    if (!titular) return null;
    if (!titular.puedeCrear) return titular.error || 'Tienes permiso para consultar esta cartera. La creación de propuestas requiere permiso operativo.';
    return titular.error;
  }
  selectTitular(): void {
    const t = this.selectedTitular;
    const orders = t?.orden.filter(r => r.disponible !== false) ?? [];
    const operations = t?.operacion.filter(r => r.disponible !== false) ?? [];
    this.orderResponsibleId = orders.length === 1 ? orders[0].representanteId : 0;
    this.operationResponsibleId = operations.length === 1 ? operations[0].representanteId : 0;
    if (this.responsibleSelectionError) this.feedback.error(this.responsibleSelectionError);
  }

  onClientSearchChange(value: string | ClienteSearchResult): void {
    this.clientSearch = value;
    this.clientSearchError = false;
    this.hasSearchedClients = false;
    if (typeof value !== 'string') {
      this.selectClient(value);
      return;
    }

    if (this.client?.name !== value) {
      this.clearSelectedClient();
    }
    this.clientResults = [];
    this.searchingClients = value.trim().length >= 3;
    this.clientSearchTerms.next(value);
  }

  selectClient(result: ClienteSearchResult): void {
    this.searchingClients = false;
    this.clientSearchError = false;
    const phones = (result.nucel ?? []).map((phone) => phone.trim()).filter(Boolean);
    const bloqueoMotivo = result.bloqueoMotivo?.trim() ?? '';

    this.client = {
      name: result.nombreCompleto,
      phones,
      bloqueoMotivo,
    };
    this.clientSearch = result;
    this.submissionError = '';
    this.selectedClientCode = result.cosabcli;
    this.clientResults = [];
    this.hasSearchedClients = false;

    if (bloqueoMotivo) {
      this.showBlockedClientMessage(bloqueoMotivo);
    } else if (phones.length === 0) {
      this.showMissingPhoneMessage();
    } else {
      this.orderBlockMessage = '';
      this.feedback.dismiss();
    }
    this.responsibleRequests.next();
  }

  displayClientName(value: string | ClienteSearchResult | null): string {
    if (typeof value === 'string') return value;
    return value?.nombreCompleto ?? '';
  }

  private clearSelectedClient(): void {
    this.client = null;
    this.submissionError = '';
    this.selectedClientCode = '';
    this.responsibleRequests.next();
  }

  private showBlockedClientMessage(reason: string): void {
    this.orderBlockMessage =
      `El cliente se encuentra bloqueado por el siguiente motivo: ${reason}`;
  }

  private showMissingPhoneMessage(): void {
    this.orderBlockMessage =
      'No se puede proseguir porque el cliente no cuenta con número de celular';
  }

}
