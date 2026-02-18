export type Weekday = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'

export interface TareaSchedule {
  ejecucion?: string
  dia?: Weekday
  hora?: string
}

export interface TareaRefTipo {
  id: number
  nombre?: string
}

export interface TareaRefLinea {
  id: number
  campana: null
}

export interface TareaLineaConfig {
  idABCConfigTareaLinea: number
  linea: TareaRefLinea
  ingesta: string
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
  ingesta: string
  carga: TareaSchedule
  validacion: TareaSchedule
  envio: TareaSchedule
  bolActivo: boolean
  fechaCreacion: string
  fechaUltimaModificacion: string
  tarea?: TareaLineaConfig
  horarios?: TareaLineaHorario[]
}

export interface CreateTareaLineaPayload {
  tarea: {
    linea: { id: number }
    ingesta: string
    tipo: { id: number }
    ejecucion: { id: number }
    bolActivo?: boolean
  }
  horarios: Array<{
    tarea?: { id: number }
    tipoHorario?: { id: number; nombre?: string }
    dia: {
      id: number
      hora: { id: number }
    }
    activo?: boolean
  }>
  idABCUsuario: number
  idUsuario?: number
}

export interface UpdateTareaLineaPayload {
  tarea: {
    id: number
    linea: { id: number }
    ingesta: string
    tipo: { id: number }
    ejecucion: { id: number }
    bolActivo?: boolean
  }
  horarios: Array<{
    tarea?: { id: number }
    tipoHorario?: { id: number; nombre?: string }
    dia: {
      id: number
      hora: { id: number }
    }
    activo?: boolean
  }>
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
