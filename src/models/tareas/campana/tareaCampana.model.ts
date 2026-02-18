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
  cargaSlots?: Array<{ dia: string; hora: string }>
  ejecucionValidacion: string
  diaValidacion: string
  horaValidacion: string
  validacionSlots?: Array<{ dia: string; hora: string }>
  ejecucionEnvio: string
  diaEnvio: string
  horaEnvio: string
  envioSlots?: Array<{ dia: string; hora: string }>
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

const normalizeSlots = (slots: Array<{ dia: string; hora: string }> | undefined, dia: string, hora: string) => {
  const list = Array.isArray(slots) ? slots.filter(item => item?.dia && item?.hora) : []
  if (dia && hora && !list.some(item => item.dia === dia && item.hora === hora)) {
    list.unshift({ dia, hora })
  }
  return list
}

const buildScheduleList = (ejecucion: string, slots: Array<{ dia: string; hora: string }>) => {
  return slots.map(slot => toSchedule(ejecucion, slot.dia, slot.hora))
}

const at = <T>(list: T[], index: number): T | null => (index >= 0 && index < list.length ? list[index] : null)

export function toCreateTareaCampanaPayloads(form: TareaCampanaFormModel): CreateTareaCampanaPayload[] {
  const cargaSlots = normalizeSlots(form.cargaSlots, form.diaIngesta, form.horaIngesta)
  const validacionSlots = normalizeSlots(form.validacionSlots, form.diaValidacion, form.horaValidacion)
  const envioSlots = normalizeSlots(form.envioSlots, form.diaEnvio, form.horaEnvio)

  const cargaList = buildScheduleList(form.ejecucionIngesta, cargaSlots)
  const validacionList = buildScheduleList(form.ejecucionValidacion, validacionSlots)
  const envioList = buildScheduleList(form.ejecucionEnvio, envioSlots)
  const maxItems = Math.max(cargaList.length, validacionList.length, envioList.length, 1)

  return Array.from({ length: maxItems }, (_, index) => ({
    tarea: {
      idABCCatLineaNegocio: Number(form.idABCCatLineaNegocio ?? 0),
      idABCCatCampana: Number(form.idABCCatCampana ?? 0),
      ingesta: form.ingesta,
      carga: at(cargaList, index) ?? at(cargaList, 0) ?? toSchedule('', '', ''),
      validacion: at(validacionList, index) ?? toSchedule('', '', ''),
      envio: at(envioList, index) ?? toSchedule('', '', '')
    },
    idABCUsuario: Number(form.idUsuario ?? 1),
    idUsuario: form.idUsuario === '' ? undefined : Number(form.idUsuario ?? 1)
  }))
}

export function toCreateTareaCampanaPayload(form: TareaCampanaFormModel): CreateTareaCampanaPayload {
  return toCreateTareaCampanaPayloads(form)[0]
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
