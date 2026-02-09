export interface BitacoraPayload {
  bitacora: {
    evento: {
      id: number
    }
    objeto: {
      id: number
    }
    detalle?: string
    ip?: string
    navegador?: string
  }
}