import type { MapeoLineaRef } from './shared'

export interface MapeoCampanaData {
  idABCConfigMapeoLinea: number
  linea: MapeoLineaRef
  idABCCatLineaNegocio?: number
  idABCCatCampana?: number
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

export interface CreateMapeoCampanaPayload {
  mapeo: {
    nombre: string
    descripcion: string
    validar?: boolean
    enviar?: boolean
  }
  idABCUsuario: number
  idUsuario?: number
}

export interface UpdateMapeoCampanaPayload {
  mapeo: {
    id: number
    nombre: string
    descripcion: string
    validar?: boolean
    enviar?: boolean
  }
  idUsuario: number
}

export interface PatchMapeoCampanaPayload {
  mapeo: {
    idABCConfigMapeoLinea: string | number
  }
  idABCUsuario: number
}
