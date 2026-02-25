export interface TareaMonitorBase {
  id: number
  idABCCatLineaNegocio: number
  idABCConfigMapeo: number
  nombreMapeo: string
  bolActivo: boolean
  actividad: {
    id?: number
    codigo: string
    nombre?: string
  }
  ejecucion?: {
    id?: number
  }
  dia?: {
    id?: number
  }
  hora?: {
    id?: number
  }
  estatus: {
    id?: number
    codigo: string
    nombre?: string
  }
  fechaInicio: string
  fechaFin: string
  fechaCreacion: string
  numeroRegistros: number
  numeroRegistrosProcesados: number
}

export interface TareaMonitorLineaData extends TareaMonitorBase {}

export interface TareaMonitorCampanaData extends TareaMonitorBase {
  idABCCatCampana: number
}

export type TareaMonitorData = TareaMonitorLineaData | TareaMonitorCampanaData

export interface TareaMonitorLineaApiPayload {
  id: number
  linea: { id: number }
  mapeo: { id: number }
  activo: boolean
  actividad: { id: number }
  ejecucion?: { id: number }
  dia?: { id: number }
  hora?: { id: number }
  estatus: { id: number }
  fechaInico: string
  fechaFin: string
  registros: number
  procesados: number
  fechaCreacion: string
}

export interface TareaMonitorCampanaApiPayload {
  id: number
  linea: {
    id: number
    campana?: { id: number }
  }
  mapeo: { id: number }
  activo: boolean
  actividad: { id: number }
  ejecucion?: { id: number }
  dia?: { id: number }
  hora?: { id: number }
  horario?: {
    dia?: {
      id?: number
      hora?: { id?: number }
    }
  }
  estatus: { id: number }
  fechaInico: string
  fechaFin: string
  registros: number
  procesados: number
  fechaCreacion: string
}
