import type { TareaLineaData } from '@/types/tareas/linea'
import { normalizeWeekdayInputValue, weekdayById, toHoraLabel } from '@/composables/tareas/tareaScheduleUtils'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  return Number(v ?? 0) === 1
}

function toWeekdayOrNull(value: unknown) {
  const normalized = normalizeWeekdayInputValue(value)
  return normalized || undefined
}

type StageKey = 'carga' | 'validacion' | 'envio'

function getStageKeyByTypeId(typeId: unknown): StageKey | null {
  const id = Number(typeId)
  if (id === 1) return 'carga'
  if (id === 2) return 'validacion'
  if (id === 3) return 'envio'
  return null
}

function getStageKeyByType(type: any): StageKey | null {
  const byId = getStageKeyByTypeId(type?.id)
  if (byId) return byId

  const code = String(type?.codigo ?? '').trim().toUpperCase()
  if (code === 'CAG') return 'carga'
  if (code === 'VLD') return 'validacion'
  if (code === 'ENV') return 'envio'

  const name = String(type?.nombre ?? '').trim().toUpperCase()
  if (name === 'CARGA') return 'carga'
  if (name === 'VALIDACION' || name === 'VALIDACIÓN') return 'validacion'
  if (name === 'ENVIO' || name === 'ENVÍO') return 'envio'
  return null
}

const executionById: Record<number, string> = {
  1: 'Automatica',
  2: 'Manual',
  3: 'Híbrido'
}

const executionByCode: Record<string, string> = {
  AUT: 'Automatica',
  MAN: 'Manual',
  HIB: 'Híbrido',
  HYB: 'Híbrido'
}

function toExecutionName(value: unknown): string {
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return '-'
    const normalizedCode = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
    if (executionByCode[normalizedCode]) {
      return executionByCode[normalizedCode]
    }
    return raw
  }

  const rawId = Number(value)
  if (!Number.isNaN(rawId) && executionById[rawId]) {
    return executionById[rawId]
  }
  return '-'
}

function resolveMapeoId(tarea: any, item: any): number {
  return Number(
    tarea?.mapeo?.id
    ?? tarea?.asignacion?.mapeo?.id
    ?? item?.asignacion?.mapeo?.id
    ?? item?.mapeo?.id
    ?? item?.idABCConfigMapeoLinea
    ?? 0
  )
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
  const normalized = normalizeTareasLinea([item])
  return normalized[0] ?? {
    idABCConfigTareaLinea: 0,
    idABCCatLineaNegocio: 0,
    ingesta: '',
    carga: { configurada: false },
    validacion: { configurada: false },
    envio: { configurada: false },
    bolActivo: false,
    fechaCreacion: '',
    fechaUltimaModificacion: '',
    horarios: []
  }
}

export function normalizeTareasLinea(data: any): TareaLineaData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  const grouped = new Map<string, TareaLineaData>()

  for (const item of list) {
    const tarea = item?.tarea ?? item ?? {}
    const stageType = tarea?.tipo ?? item?.tipo ?? {}
    const stageTypeId = Number(stageType?.id ?? 0)
    const stageKey = getStageKeyByType(stageType)
    const mapeoId = resolveMapeoId(tarea, item)
    const lineaId = Number(tarea?.linea?.id ?? tarea?.idABCCatLineaNegocio ?? item?.idABCCatLineaNegocio ?? item?.idLinea ?? 0)
    const taskId = Number(tarea?.idABCConfigTareaLinea ?? tarea?.id ?? item?.idABCConfigTareaLinea ?? item?.id ?? 0)
    const key = `${lineaId}|${mapeoId || taskId || resolveIngestaName(tarea, item)}`

    const existing = grouped.get(key)
    const base: TareaLineaData = existing ?? {
      idABCConfigTareaLinea: taskId,
      idABCCatLineaNegocio: lineaId,
      ingesta: resolveIngestaName(tarea, item),
      carga: { configurada: false },
      validacion: { configurada: false },
      envio: { configurada: false },
      bolActivo: false,
      fechaCreacion: String(tarea?.fechaCreacion ?? item?.fechaCreacion ?? item?.fec_creacion ?? ''),
      fechaUltimaModificacion: String(tarea?.fechaUltimaModificacion ?? item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? ''),
      tarea,
      tareasPorTipo: {},
      idsTarea: {},
      horarios: []
    }

    const executionId = Number(
      tarea?.ejecucion?.id
      ?? item?.ejecucion?.id
      ?? tarea?.idABCCatTipoEjecucion
      ?? item?.idABCCatTipoEjecucion
      ?? 0
    )
    const executionName = toExecutionName(
      tarea?.ejecucion?.nombre
      ?? item?.ejecucion?.nombre
      ?? tarea?.ejecucion?.codigo
      ?? item?.ejecucion?.codigo
      ?? executionId
    )

    if (stageKey) {
      const stageSchedule = {
        ejecucionId: executionId || undefined,
        ejecucion: executionName,
        configurada: true
      }
      if (stageKey === 'carga') base.carga = stageSchedule
      if (stageKey === 'validacion') base.validacion = stageSchedule
      if (stageKey === 'envio') base.envio = stageSchedule

      base.idsTarea = {
        ...(base.idsTarea ?? {}),
        [stageKey]: taskId || undefined
      }

      base.tareasPorTipo = {
        ...(base.tareasPorTipo ?? {}),
        [stageKey]: tarea
      }
    }

    const horarios = normalizeHorarios(item)
    if (horarios.length) {
      const stageHorarios = stageKey
        ? horarios.map((h: any) => ({
          ...h,
          tipoHorario: h?.tipoHorario ?? h?.tipo ?? { id: stageTypeId }
        }))
        : horarios
      base.horarios = [...(base.horarios ?? []), ...stageHorarios]

      if (stageKey) {
        const stageSummary = pickStageSchedule(stageHorarios, stageTypeId)
        if (stageKey === 'carga') {
          base.carga = { ...base.carga, dia: stageSummary.dia, hora: stageSummary.hora, configurada: true }
        } else if (stageKey === 'validacion') {
          base.validacion = { ...base.validacion, dia: stageSummary.dia, hora: stageSummary.hora, configurada: true }
        } else if (stageKey === 'envio') {
          base.envio = { ...base.envio, dia: stageSummary.dia, hora: stageSummary.hora, configurada: true }
        }
      }
    }

    base.bolActivo = base.bolActivo || toBool(tarea?.bolActivo ?? item?.bolActivo ?? item?.status ?? false)

    const createdAt = String(tarea?.fechaCreacion ?? item?.fechaCreacion ?? item?.fec_creacion ?? '')
    const updatedAt = String(tarea?.fechaUltimaModificacion ?? item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? '')
    if (!base.fechaCreacion || (createdAt && createdAt < base.fechaCreacion)) {
      base.fechaCreacion = createdAt
    }
    if (!base.fechaUltimaModificacion || (updatedAt && updatedAt > base.fechaUltimaModificacion)) {
      base.fechaUltimaModificacion = updatedAt
    }

    grouped.set(key, base)
  }

  return Array.from(grouped.values())
}
