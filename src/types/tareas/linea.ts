export interface TareaSchedule {
  ejecucion: string
  dia: string
  hora: string
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
}

export interface CreateTareaLineaPayload {
  tarea: {
    idABCCatLineaNegocio: number
    ingesta: string
    carga: TareaSchedule
    validacion: TareaSchedule
    envio: TareaSchedule
  }
  idABCUsuario: number
  idUsuario?: number
}

export interface UpdateTareaLineaPayload {
  tarea: {
    id: number
    idABCCatLineaNegocio: number
    ingesta: string
    carga: TareaSchedule
    validacion: TareaSchedule
    envio: TareaSchedule
  }
  idUsuario: number
}

export interface PatchTareaLineaPayload {
  tarea: {
    idABCConfigTareaLinea: string | number
  }
  idABCUsuario: number
}
