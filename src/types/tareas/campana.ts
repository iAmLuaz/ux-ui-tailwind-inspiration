export interface TareaSchedule {
  ejecucion: string | null
  dia: string | null
  hora: string | null
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
}

export interface CreateTareaCampanaPayload {
  tarea: {
    idABCCatLineaNegocio: number
    idABCCatCampana: number
    ingesta: string
    carga: TareaSchedule
    validacion: TareaSchedule
    envio: TareaSchedule
  }
  idABCUsuario: number
  idUsuario?: number
}

export interface UpdateTareaCampanaPayload {
  tarea: {
    id: number
    idABCCatLineaNegocio: number
    idABCCatCampana: number
    ingesta: string
    carga: TareaSchedule
    validacion: TareaSchedule
    envio: TareaSchedule
  }
  idUsuario: number
}

export interface PatchTareaCampanaPayload {
  tarea: {
    idABCConfigTareaCampana: string | number
  }
  idABCUsuario: number
}
