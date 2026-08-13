export type ExecutionChannel = 'BVL' | 'CANACCORD' | 'RENTA4' | 'PERSHING';

export type ClientOrderStatus =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'EJECUTADA'
  | 'RECHAZADA'
  | 'ANULADA';

export interface ClientOrder {
  id: string;
  submittedAt: string;
  updatedAt: string;
  clientName: string;
  clientCode: string;
  channel: ExecutionChannel;
  instrument: string;
  side: 'Compra' | 'Venta';
  quantity: number;
  orderType: 'Límite' | 'Mercado';
  price: number | null;
  currency: 'PEN' | 'USD';
  validity: string;
  status: ClientOrderStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  sourceOrderId?: string;
}

export const EXECUTION_CHANNELS: ReadonlyArray<{
  code: ExecutionChannel;
  name: string;
}> = [
  { code: 'BVL', name: 'BVL' },
  { code: 'CANACCORD', name: 'Canaccord' },
  { code: 'RENTA4', name: 'Renta 4' },
  { code: 'PERSHING', name: 'Pershing' },
];

export const CLIENT_ORDER_STATUS_LABELS: Record<ClientOrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  EJECUTADA: 'Ejecutada',
  RECHAZADA: 'Rechazada',
  ANULADA: 'Anulada',
};
