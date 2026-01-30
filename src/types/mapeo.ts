export interface MapeoData {
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

export interface CreateMapeoPayload {
  mapeo: {
    nombre: string
    descripcion: string
    validar?: boolean
    envio?: boolean
  }
  idABCUsuario: number
  idUsuario?: number
}

export interface UpdateMapeoPayload {
  mapeo: {
    id: number
    nombre: string
    descripcion: string
    validar?: boolean
    envio?: boolean
  }
  idUsuario: number
}

export interface PatchMapeoPayload {
  mapeo: {
    idABCConfigMapeoLinea: string | number
  }
  idABCUsuario: number
}

export interface FieldConfig {
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'date' | 'toggle'
  options?: { label: string; value: any }[] | string[]
  required?: boolean
  placeholder?: string
  rows?: number
  label?: string
}

export type FieldsConfig = Record<string, FieldConfig>