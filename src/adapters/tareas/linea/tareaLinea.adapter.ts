import type { TareaLineaData } from '@/types/tareas/linea'
import {
  normalizeWeekdayInputValue,
  weekdayById,
  toHoraLabel
} from '@/composables/tareas/tareaScheduleUtils'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  return Number(v ?? 0) === 1
}

function toWeekdayOrNull(value: unknown) {
  const normalized = normalizeWeekdayInputValue(value)
  return normalized || undefined
}

const executionById: Record<number, string> = {
  1: 'Automatica',
  2: 'Manual'
}

function toExecutionName(value: unknown): string {
  const rawId = Number(value)
  if (!Number.isNaN(rawId) && executionById[rawId]) {
    return executionById[rawId]
  }
  if (typeof value === 'string' && value.trim()) {
    return value
  }
  return 'Automatica'
}

function resolveIngestaName(tarea: any, item: any): string {
  const value =
    tarea?.mapeo?.nombre
    ?? tarea?.mapeo?.descripcion
    ?? tarea?.ingesta
    ?? tarea?.asignacion?.mapeo?.nombre
    ?? tarea?.asignacion?.mapeo?.descripcion
    ?? tarea?.asignacion?.ingesta?.nombre
    ?? tarea?.asignacion?.nombreMapeo
    ?? tarea?.mapeo?.nombre
    ?? tarea?.mapeo?.descripcion
    ?? tarea?.nombreMapeo
    ?? item?.ingesta
    ?? item?.asignacion?.mapeo?.nombre
    ?? item?.asignacion?.mapeo?.descripcion
    ?? item?.asignacion?.ingesta?.nombre
    ?? item?.asignacion?.nombreMapeo
    ?? item?.mapeo?.nombre
    ?? item?.mapeo?.descripcion
    ?? item?.nombreMapeo
    ?? ''
  return String(value)
}

function normalizeHorarios(item: any) {
  const rawHorarios = Array.isArray(item?.horarios)
    ? item.horarios
    : Array.isArray(item?.tarea?.horarios)
      ? item.tarea.horarios
      : []

  if (rawHorarios.length) {
    return rawHorarios
  }

  const legacyHorarios: any[] = []
  if (item?.carga?.dia || item?.carga?.hora) {
    legacyHorarios.push({
      tipo: { id: 1, nombre: 'Carga' },
      dia: { nombre: item?.carga?.dia },
      hora: { nombre: item?.carga?.hora }
    })
  }
  if (item?.validacion?.dia || item?.validacion?.hora) {
    legacyHorarios.push({
      tipo: { id: 2, nombre: 'Validación' },
      dia: { nombre: item?.validacion?.dia },
      hora: { nombre: item?.validacion?.hora }
    })
  }
  if (item?.envio?.dia || item?.envio?.hora) {
    legacyHorarios.push({
      tipo: { id: 3, nombre: 'Envío' },
      dia: { nombre: item?.envio?.dia },
      hora: { nombre: item?.envio?.hora }
    })
  }

  return legacyHorarios
}

function pickStageSchedule(horarios: any[], stageId: number) {
  const orderedIndex = stageId - 1
  const match = horarios.find(h => Number(h?.tipoHorario?.id ?? h?.tipo?.id ?? h?.idABCCatTipoHorario ?? 0) === stageId) ?? horarios[orderedIndex]
  const diaName = String(match?.dia?.nombre ?? weekdayById[Number(match?.dia?.id ?? 0)] ?? '')
  const horaName = String(match?.dia?.hora?.nombre ?? match?.hora?.nombre ?? toHoraLabel(match?.dia?.hora?.id ?? match?.hora?.id))
  return {
    dia: toWeekdayOrNull(diaName),
    hora: horaName || undefined
  }
}

export function normalizeTareaLinea(item: any): TareaLineaData {
  const tarea = item?.tarea ?? item ?? {}
  const horarios = normalizeHorarios(item)
  const cargaStage = pickStageSchedule(horarios, 1)
  const validacionStage = pickStageSchedule(horarios, 2)
  const envioStage = pickStageSchedule(horarios, 3)
  const executionName = toExecutionName(tarea?.ejecucion?.nombre ?? tarea?.ejecucion?.id)

  return {
    idABCConfigTareaLinea: Number(tarea?.idABCConfigTareaLinea ?? tarea?.id ?? item?.idABCConfigTareaLinea ?? item?.id ?? 0),
    idABCCatLineaNegocio: Number(tarea?.linea?.id ?? tarea?.idABCCatLineaNegocio ?? item?.idABCCatLineaNegocio ?? item?.idLinea ?? 0),
    ingesta: resolveIngestaName(tarea, item),
    carga: {
      ejecucion: executionName,
      dia: cargaStage.dia,
      hora: cargaStage.hora
    },
    validacion: {
      ejecucion: executionName,
      dia: validacionStage.dia,
      hora: validacionStage.hora
    },
    envio: {
      ejecucion: executionName,
      dia: envioStage.dia,
      hora: envioStage.hora
    },
    bolActivo: toBool(tarea?.bolActivo ?? item?.bolActivo ?? item?.status ?? false),
    fechaCreacion: String(tarea?.fechaCreacion ?? item?.fechaCreacion ?? item?.fec_creacion ?? ''),
    fechaUltimaModificacion: String(tarea?.fechaUltimaModificacion ?? item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? ''),
    tarea,
    horarios
  }
}

export function normalizeTareasLinea(data: any): TareaLineaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeTareaLinea)
}
