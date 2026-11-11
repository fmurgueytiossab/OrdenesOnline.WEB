export interface PropuestaCliente {
  titularRepresentanteId?: number;
  responsableOrdenRepresentanteId?: number;
  responsableOperacionRepresentanteId?: number;
  modalidadReferencia?: string;
  revisionResponsables?: string;
  correoCliente?: string;
  cosabcli: string;
  tipo: string;
  tipoOrden: string;
  cantidad: number;
  instrumento: string;
  precio: number | null;
  monto: number | null;
  mercado: string;
  moneda: string;
  vigencia: string;
}
