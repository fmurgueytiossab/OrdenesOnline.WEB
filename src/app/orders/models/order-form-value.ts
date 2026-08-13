export interface MarketOption {
  code: string;
  name: string;
}

export interface OrderFormValue {
  tipo: string;
  cantidad: number;
  instrumento: string;
  tipoOrden: string;
  precio: number | null;
  monto: number | null;
  mercado: string;
  moneda: string;
  vigencia: string;
}
