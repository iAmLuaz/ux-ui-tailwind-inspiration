export interface BitacoraPayload {
  idUsuario: number
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