import type {
  CreateTareaLineaPayload,
  UpdateTareaLineaPayload
} from '@/types/tareas/linea'

export interface TareaLineaFormModel {
  idABCCatLineaNegocio?: number | ''
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

export function toCreateTareaLineaPayload(form: TareaLineaFormModel): CreateTareaLineaPayload {
  return {
    tarea: {
      idABCCatLineaNegocio: Number(form.idABCCatLineaNegocio ?? 0),
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

export function toUpdateTareaLineaPayload(
  form: TareaLineaFormModel,
  tareaId: number
): UpdateTareaLineaPayload {
  return {
    tarea: {
      id: tareaId,
      idABCCatLineaNegocio: Number(form.idABCCatLineaNegocio ?? 0),
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
