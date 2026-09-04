export type ExecutionChannel = 'BVL' | 'CANACCORD' | 'VIEWTRADE';

export type ClientOrderStatus =
  | 'PENDIENTE'
  | 'PARCIAL'
  | 'EJECUTADA'
  | 'ANULADA';

export interface ClientOrder {
  id: number;
  clientCode: string;
  proposalDate: string;
  proposalTime: string | null;
  operationNumber: string;
  channel: ExecutionChannel;
  instrument: string;
  side: 'Compra' | 'Venta';
  proposedQuantity: number;
  executedQuantity: number;
  cancelledQuantity: number;
  pendingQuantity: number;
  price: number | null;
  status: ClientOrderStatus;
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
  { code: 'VIEWTRADE', name: 'Viewtrade' },
];

export const CLIENT_ORDER_STATUS_LABELS: Record<ClientOrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  EJECUTADA: 'Ejecutada',
  ANULADA: 'Anulada',
};
