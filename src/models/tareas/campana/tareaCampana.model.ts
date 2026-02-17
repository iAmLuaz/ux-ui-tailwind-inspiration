import type {
  CreateTareaCampanaPayload,
  UpdateTareaCampanaPayload
} from '@/types/tareas/campana'

export interface TareaCampanaFormModel {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  ingesta: string
  ejecucionIngesta: string
  diaIngesta: string
  horaIngesta: string
  ejecucionValidacion: string
  diaValidacion: string
  horaValidacion: string
  ejecucionEnvio: string
  diaEnvio: string
  horaEnvio: string
  idUsuario?: number | ''
}

const toSchedule = (ejecucion: string, dia: string, hora: string) => {
  const isComplete = Boolean(ejecucion && dia && hora)
  return {
    ejecucion: isComplete ? ejecucion : null,
    dia: isComplete ? dia : null,
    hora: isComplete ? hora : null
  }
}

export function toCreateTareaCampanaPayload(form: TareaCampanaFormModel): CreateTareaCampanaPayload {
  return {
    tarea: {
      idABCCatLineaNegocio: Number(form.idABCCatLineaNegocio ?? 0),
      idABCCatCampana: Number(form.idABCCatCampana ?? 0),
      ingesta: form.ingesta,
      carga: toSchedule(form.ejecucionIngesta, form.diaIngesta, form.horaIngesta),
      validacion: toSchedule(form.ejecucionValidacion, form.diaValidacion, form.horaValidacion),
      envio: toSchedule(form.ejecucionEnvio, form.diaEnvio, form.horaEnvio)
    },
    idABCUsuario: Number(form.idUsuario ?? 1),
    idUsuario: form.idUsuario === '' ? undefined : Number(form.idUsuario ?? 1)
  }
}

export function toUpdateTareaCampanaPayload(
  form: TareaCampanaFormModel,
  tareaId: number
): UpdateTareaCampanaPayload {
  return {
    tarea: {
      id: tareaId,
      idABCCatLineaNegocio: Number(form.idABCCatLineaNegocio ?? 0),
      idABCCatCampana: Number(form.idABCCatCampana ?? 0),
      ingesta: form.ingesta,
      carga: toSchedule(form.ejecucionIngesta, form.diaIngesta, form.horaIngesta),
      validacion: toSchedule(form.ejecucionValidacion, form.diaValidacion, form.horaValidacion),
      envio: toSchedule(form.ejecucionEnvio, form.diaEnvio, form.horaEnvio)
    },
    idUsuario: Number(form.idUsuario ?? 1)
  }
}
