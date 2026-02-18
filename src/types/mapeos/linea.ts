import type { MapeoLineaRef } from './shared'

export interface MapeoLineaData {
  idABCConfigMapeoLinea: number
  linea: MapeoLineaRef
  idABCCatLineaNegocio?: number
  idABCUsuario: number
  nombre: string
  descripcion: string
  bolActivo: boolean
  bolDictaminacion?: boolean | null
  idABCUsuarioUltModificacion?: number
  validar?: boolean
  enviar?: boolean
  columnas?: number | any[]
  fechaCreacion: string
  fechaUltimaModificacion: string
}

export interface CreateMapeoLineaPayload {
  mapeo: {
    nombre: string
    descripcion: string
    validar?: boolean
    enviar?: boolean
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
    enviar?: boolean
  }
  idUsuario: number
}

export interface PatchMapeoLineaPayload {
  mapeo: {
    idABCConfigMapeoLinea: string | number
  }
  idABCUsuario: number
}
