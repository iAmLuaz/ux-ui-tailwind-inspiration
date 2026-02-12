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

export function toCreateTareaCampanaPayload(form: TareaCampanaFormModel): CreateTareaCampanaPayload {
  return {
    tarea: {
      idABCCatLineaNegocio: Number(form.idABCCatLineaNegocio ?? 0),
      idABCCatCampana: Number(form.idABCCatCampana ?? 0),
      ingesta: form.ingesta,
      carga: {
        ejecucion: form.ejecucionIngesta,
        dia: form.diaIngesta,
        hora: form.horaIngesta
      },
      validacion: {
        ejecucion: form.ejecucionValidacion,
        dia: form.diaValidacion,
        hora: form.horaValidacion
      },
      envio: {
        ejecucion: form.ejecucionEnvio,
        dia: form.diaEnvio,
        hora: form.horaEnvio
      }
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
      carga: {
        ejecucion: form.ejecucionIngesta,
        dia: form.diaIngesta,
        hora: form.horaIngesta
      },
      validacion: {
        ejecucion: form.ejecucionValidacion,
        dia: form.diaValidacion,
        hora: form.horaValidacion
      },
      envio: {
        ejecucion: form.ejecucionEnvio,
        dia: form.diaEnvio,
        hora: form.horaEnvio
      }
    },
    idUsuario: Number(form.idUsuario ?? 1)
  }
}
