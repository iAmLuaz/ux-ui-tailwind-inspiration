export interface MapeoLineaData {
  idABCConfigMapeoLinea: number
  idABCCatLineaNegocio: number
  idABCUsuario: number
  nombre: string
  descripcion: string
  bolActivo: boolean
  bolDictaminacion?: boolean | null
  idABCUsuarioUltModificacion?: number
  validar?: boolean
  envio?: boolean
  columnas?: number | any[]
  fechaCreacion: string
  fechaUltimaModificacion: string
}

export interface CreateMapeoLineaPayload {
  mapeo: {
    nombre: string
    descripcion: string
    validar?: boolean
    envio?: boolean
  }
  idABCUsuario: number
  idUsuario?: number
}

export interface UpdateMapeoLineaPayload {
  mapeo: {
    id: number
    nombre: string
    descripcion: string
    validar?: boolean
    envio?: boolean
  }
  idUsuario: number
}

export interface PatchMapeoLineaPayload {
  mapeo: {
    idABCConfigMapeoLinea: string | number
  }
  idABCUsuario: number
}
