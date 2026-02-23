export type Weekday = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'

export interface TareaSchedule {
  ejecucionId?: number
  ejecucion?: string
  dia?: Weekday
  hora?: string
  configurada?: boolean
}

export interface TareaLineaStageIds {
  carga?: number
  validacion?: number
  envio?: number
}

export interface TareaLineaStages {
  carga?: TareaLineaConfig
  validacion?: TareaLineaConfig
  envio?: TareaLineaConfig
}

export interface TareaRefTipo {
  id: number
  nombre?: string
}

export interface TareaRefLinea {
  id: number
  campana?: null | { id: number }
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

export interface TareaLineaConfig {
  idABCConfigTareaLinea?: number
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

export interface TareaLineaHorario {
  idABCConfigHorarioTareaLinea: number
  idABCConfigTareaLinea: number
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

export interface TareaLineaData {
  idABCConfigTareaLinea: number
  idABCCatLineaNegocio: number
  ingesta?: string
  carga: TareaSchedule
  validacion: TareaSchedule
  envio: TareaSchedule
  bolActivo: boolean
  fechaCreacion: string
  fechaUltimaModificacion: string
  tarea?: TareaLineaConfig
  tareasPorTipo?: TareaLineaStages
  idsTarea?: TareaLineaStageIds
  horarios?: TareaLineaHorario[]
}

export interface CreateTareaLineaPayload {
  tarea: {
    mapeo?: { id: number }
    tipo: { id: number }
    ejecucion: { id: number }
    bolActivo?: boolean
  }
  horarios: TareaLineaHorarioPostItem[]
  idABCUsuario: number
  idUsuario?: number
}

export interface TareaLineaHorarioPostItem {
  dia: {
    id: number
    hora: { id: number }
  }
}

export interface TareaLineaHorariosPostPayload {
  horarios: TareaLineaHorarioPostItem[]
  idUsuario: number
}

export interface UpdateTareaLineaPayload {
  tarea: {
    id: number
    mapeo?: { id: number }
    linea?: { id: number }
    tipo: { id: number }
    ejecucion: { id: number }
    bolActivo?: boolean
  }
  horarios: TareaLineaHorarioPostItem[]
  idUsuario: number
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
}

export interface PatchTareaLineaPayload {
  tarea: {
    idABCConfigTareaLinea: string | number
  }
  idABCUsuario: number
}
