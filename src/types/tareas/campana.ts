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

export interface TareaRefCampana {
  id: number
}

export interface TareaRefLinea {
  id: number
  campana: TareaRefCampana
}

export interface TareaCampanaConfig {
  idABCConfigTareaCampana: number
  linea: TareaRefLinea
  ingesta: string
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
  ingesta: string
  carga: TareaSchedule
  validacion: TareaSchedule
  envio: TareaSchedule
  bolActivo: boolean
  fechaCreacion: string
  fechaUltimaModificacion: string
  tarea?: TareaCampanaConfig
  horarios?: TareaCampanaHorario[]
}

export interface CreateTareaCampanaPayload {
  tarea: {
    linea: {
      id: number
      campana: {
        id: number
      }
    }
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

export interface UpdateTareaCampanaPayload {
  tarea: {
    id: number
    linea: {
      id: number
      campana: {
        id: number
      }
    }
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

export interface PatchTareaCampanaPayload {
  tarea: {
    idABCConfigTareaCampana: string | number
  }
  idABCUsuario: number
}
