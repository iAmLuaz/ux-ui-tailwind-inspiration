import type {
  CreateTareaLineaPayload,
  Weekday,
  UpdateTareaLineaPayload
} from '@/types/tareas/linea'
import type { WeekdayValue } from '@/composables/tareas/tareaScheduleUtils'

export interface TareaLineaFormModel {
  idABCCatLineaNegocio?: number | ''
  idMapeo?: number | ''
  ingesta: string
  ejecucionIngesta: string
  diaIngesta: WeekdayValue
  horaIngesta: string
  cargaSlots?: Array<{ dia: WeekdayValue; hora: string }>
  ejecucionValidacion: string
  diaValidacion: WeekdayValue
  horaValidacion: string
  validacionSlots?: Array<{ dia: WeekdayValue; hora: string }>
  ejecucionEnvio: string
  diaEnvio: WeekdayValue
  horaEnvio: string
  envioSlots?: Array<{ dia: WeekdayValue; hora: string; activo?: boolean }>
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
  idUsuario?: number | ''
}

const weekdayIdByName: Record<Weekday, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5
}

const executionIdByName: Record<string, number> = {
  Automatica: 1,
  Manual: 2
}

function resolveExecutionId(value: string): number {
  const normalized = String(value ?? '').trim()
  return executionIdByName[normalized] ?? 1
}

function resolveHoraId(value: string): number {
  const [hours = '0', minutes = '0'] = String(value ?? '').split(':')
  const h = Number(hours)
  const m = Number(minutes)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 100 + m
}

function toHorarioByType(typeId: 1 | 2 | 3, dia: Weekday, hora: string, tareaId?: number) {
  const horario = {
    dia: {
      id: weekdayIdByName[dia] ?? 0,
      hora: { id: resolveHoraId(hora) }
    },
    activo: true,
    tipoHorario: {
      id: typeId,
      nombre: typeId === 1 ? 'Carga' : typeId === 2 ? 'Validación' : 'Envío'
    }
  }

  if (!tareaId) return horario
  return {
    tarea: { id: tareaId },
    ...horario
  }
}

const normalizeSlots = (slots: Array<{ dia: WeekdayValue; hora: string; activo?: boolean }> | undefined, dia: WeekdayValue, hora: string) => {
  const list = Array.isArray(slots)
    ? slots.filter(item => item?.dia && item?.hora && (item.activo ?? true) !== false)
    : []
  if (dia && hora && !list.some(item => item.dia === dia && item.hora === hora)) {
    list.unshift({ dia, hora })
  }
  return list.filter((item): item is { dia: Weekday; hora: string } => Boolean(item.dia))
}

export function toCreateTareaLineaPayloads(form: TareaLineaFormModel): CreateTareaLineaPayload[] {
  const cargaSlots = normalizeSlots(form.cargaSlots, form.diaIngesta, form.horaIngesta)
  const validacionSlots = normalizeSlots(form.validacionSlots, form.diaValidacion, form.horaValidacion)
  const envioSlots = normalizeSlots(form.envioSlots, form.diaEnvio, form.horaEnvio)
  const mapeoId = Number(form.idMapeo ?? 0)

  const horarios = [
    ...cargaSlots.map(slot => toHorarioByType(1, slot.dia, slot.hora)),
    ...validacionSlots.map(slot => toHorarioByType(2, slot.dia, slot.hora)),
    ...envioSlots.map(slot => toHorarioByType(3, slot.dia, slot.hora))
  ]

  return [{
    tarea: {
      mapeo: { id: mapeoId },
      tipo: { id: 1 },
      ejecucion: { id: resolveExecutionId(form.ejecucionIngesta) }
    },
    horarios,
    idABCUsuario: Number(form.idUsuario ?? 1),
    idUsuario: form.idUsuario === '' ? undefined : Number(form.idUsuario ?? 1)
  }]
}

export function toCreateTareaLineaPayload(form: TareaLineaFormModel): CreateTareaLineaPayload {
  const [payload] = toCreateTareaLineaPayloads(form)
  return payload!
}

export function toUpdateTareaLineaPayload(
  form: TareaLineaFormModel,
  tareaId: number
): UpdateTareaLineaPayload {
  const cargaSlots = normalizeSlots(form.cargaSlots, form.diaIngesta, form.horaIngesta)
  const validacionSlots = normalizeSlots(form.validacionSlots, form.diaValidacion, form.horaValidacion)
  const envioSlots = normalizeSlots(form.envioSlots, form.diaEnvio, form.horaEnvio)
  const mapeoId = Number(form.idMapeo ?? 0)

  return {
    tarea: {
      id: tareaId,
      ...(mapeoId > 0 ? { mapeo: { id: mapeoId } } : {}),
      linea: {
        id: Number(form.idABCCatLineaNegocio ?? 0)
      },
      tipo: { id: 1 },
      ejecucion: { id: resolveExecutionId(form.ejecucionIngesta) }
    },
    horarios: [
      ...cargaSlots.map(slot => toHorarioByType(1, slot.dia, slot.hora, tareaId)),
      ...validacionSlots.map(slot => toHorarioByType(2, slot.dia, slot.hora, tareaId)),
      ...envioSlots.map(slot => toHorarioByType(3, slot.dia, slot.hora, tareaId))
    ],
    idUsuario: Number(form.idUsuario ?? 1),
    horariosDesactivarIds: Array.isArray(form.horariosDesactivarIds)
      ? form.horariosDesactivarIds.map(Number).filter(id => !Number.isNaN(id) && id > 0)
      : [],
    horariosActivarIds: Array.isArray(form.horariosActivarIds)
      ? form.horariosActivarIds.map(Number).filter(id => !Number.isNaN(id) && id > 0)
      : []
  }
}
