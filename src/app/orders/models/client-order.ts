export type ExecutionChannel = 'BVL' | 'CANACCORD' | 'EUROCLEAR';

export type ClientOrderStatus =
  | 'PENDIENTE' | 'ENVIADO' | 'FIRMADO' | 'INGRESADO' | 'CANCELADO' | 'DESCONOCIDO';

export interface ClientOrder {
  id: number;
  clientCode: string;
  proposalDate: string;
  proposalTime: string | null;
  operationNumber: string;
  channel: string;
  instrument: string;
  side: 'Compra' | 'Venta';
  proposedQuantity: number;
  executedQuantity: number;
  cancelledQuantity: number;
  pendingQuantity: number;
  price: number | null;
  status: ClientOrderStatus;
  canMarkEntered?: boolean;
}

export interface TrackingItemResponse {
  codigoOrden: number;
  cosabcli: string;
  fechaPropuesta: string;
  horaPropuesta: string | null;
  numeroOperacion: string;
  instrumento: string;
  tipo: string;
  cantidadPropuesta: number;
  cantidadEjecutada: number;
  cantidadAnulada: number;
  cantidadPendiente: number;
  precio: number | null;
  estado: string;
  mercado: string;
  puedeMarcarIngresado?: boolean;
}

export interface MarkOrderEnteredResponse {
  propuestaId: number;
  estado: 'INGRESADO';
}

export interface TrackingPageResponse {
  items: TrackingItemResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  lastUpdatedAt: string;
}

export const EXECUTION_CHANNELS: ReadonlyArray<{
  code: ExecutionChannel;
  name: string;
}> = [
  { code: 'BVL', name: 'BVL' },
  { code: 'CANACCORD', name: 'Canaccord' },
  { code: 'EUROCLEAR', name: 'Euroclear' },
];

export const CLIENT_ORDER_STATUS_LABELS: Record<ClientOrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  ENVIADO: 'Enviado',
  FIRMADO: 'Firmado',
  INGRESADO: 'Ingresado',
  CANCELADO: 'Cancelado',
  DESCONOCIDO: 'Sin información',
};

export const CLIENT_ORDER_STATUS_PRIORITY: Record<ClientOrderStatus, number> = {
  ENVIADO: 0,
  FIRMADO: 1,
  CANCELADO: 2,
  PENDIENTE: 3,
  DESCONOCIDO: 3,
  INGRESADO: 4,
};
