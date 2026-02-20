export type Weekday = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'

export interface TareaSchedule {
  ejecucionId?: number
  ejecucion?: string
  dia?: Weekday
  hora?: string
  configurada?: boolean
}

export interface TareaCampanaStageIds {
  carga?: number
  validacion?: number
  envio?: number
}

export interface TareaCampanaStages {
  carga?: TareaCampanaConfig
  validacion?: TareaCampanaConfig
  envio?: TareaCampanaConfig
}

export interface TareaRefTipo {
  id: number
  nombre?: string
}

export interface TareaRefCampana {
  id: number
}

export interface TareaRefLinea {
  id: number
  campana?: TareaRefCampana | null
  catCampana?: TareaRefCampana | null
}

export interface TareaAsignacion {
  mapeo?: {
    id?: number
    nombre?: string
    descripcion?: string
  }
  ingesta?: {
    nombre?: string
  }
  nombreMapeo?: string
}

export interface TareaCampanaConfig {
  idABCConfigTareaCampana?: number
  id?: number
  linea: TareaRefLinea
  mapeo?: {
    id?: number
    nombre?: string
    descripcion?: string
  }
  ingesta?: string
  asignacion?: TareaAsignacion
  tipo: TareaRefTipo
  ejecucion: TareaRefTipo
  bolActivo: boolean
  fechaCreacion: string
  fechaUltimaModificacion: string
}

export interface TareaCampanaHorario {
  idABCConfigHorarioTareaCampana: number
  idABCConfigTareaCampana: number
  tarea?: { id: number }
  tipoHorario?: TareaRefTipo
  dia: {
    id: number
    nombre?: string
    hora: {
      id: number
      nombre?: string
    }
  }
  activo?: boolean
  bolActivo?: boolean
  fechaCreacion?: string
  fechaUltimaModificacion?: string
}

export interface TareaCampanaData {
  idABCConfigTareaCampana: number
  idABCCatLineaNegocio: number
  idABCCatCampana: number
  ingesta?: string
  carga: TareaSchedule
  validacion: TareaSchedule
  envio: TareaSchedule
  bolActivo: boolean
  fechaCreacion: string
  fechaUltimaModificacion: string
  tarea?: TareaCampanaConfig
  tareasPorTipo?: TareaCampanaStages
  idsTarea?: TareaCampanaStageIds
  horarios?: TareaCampanaHorario[]
}

export interface CreateTareaCampanaPayload {
  tarea: {
    mapeo: { id: number }
    tipo: { id: number }
    ejecucion: { id: number }
    bolActivo?: boolean
  }
  horarios: TareaCampanaHorarioPostItem[]
  idABCUsuario: number
  idUsuario?: number
}

export interface TareaCampanaHorarioPostItem {
  dia: {
    id: number
    hora: { id: number }
  }
}

export interface TareaCampanaHorariosPostPayload {
  horarios: TareaCampanaHorarioPostItem[]
  idUsuario: number
}

export interface UpdateTareaCampanaPayload {
  tarea: {
    id: number
    mapeo?: { id: number }
    linea?: {
      id: number
      catCampana?: {
        id: number
      }
      campana?: {
        id: number
      }
    }
    tipo: { id: number }
    ejecucion: { id: number }
    bolActivo?: boolean
  }
  horarios: TareaCampanaHorarioPostItem[]
  idUsuario: number
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
}

export interface PatchTareaCampanaPayload {
  tarea: {
    idABCConfigTareaCampana: string | number
  }
  idABCUsuario: number
}
