export interface MapeoCampanaData {
  idABCConfigMapeoLinea: number
  idABCCatLineaNegocio: number
  idABCCatCampana: number
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

export interface CreateMapeoCampanaPayload {
  mapeo: {
    nombre: string
    descripcion: string
    validar?: boolean
    envio?: boolean
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
    envio?: boolean
  }
  idUsuario: number
}

export interface PatchMapeoCampanaPayload {
  mapeo: {
    idABCConfigMapeoLinea: string | number
  }
  idABCUsuario: number
}
