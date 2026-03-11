export interface Propuesta {
  NombreOperador: string;
  CorreoCorporativo: string;
  Cosabcli: string;
  Tipo: string;
  Cantidad: number | null;
  Instrumento: string;
  TipoOrden: string;
  Precio: number | null;
  Monto: number | null;
  Mercado: string;
  Moneda: string;
  Dni: string;
  Vigencia: string | Date;
}