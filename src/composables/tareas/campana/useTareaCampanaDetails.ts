import { computed } from 'vue'
import {
  formatHourToAmPm,
  getWeekdayOrder,
  normalizeWeekdayInputValue,
  toHoraLabel,
  weekdayById,
  type Option as CatalogOption
} from '@/composables/tareas/tareaScheduleUtils'

type StageKey = 'carga' | 'validacion' | 'envio'

interface HorarioItem {
  stageKey?: StageKey
  tipoHorario?: { id?: number; nombre?: string }
  dia?: { id?: number; nombre?: string; hora?: { id?: number; nombre?: string } }
  hora?: { id?: number; nombre?: string }
  activo?: boolean
  bolActivo?: boolean
}

interface TareaCampanaRow {
  bolActivo: boolean
  carga?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string }
  validacion?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string }
  envio?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string }
  horarios?: HorarioItem[]
  tareasPorTipo?: {
    carga?: { id?: number; idABCConfigTareaCampana?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
    validacion?: { id?: number; idABCConfigTareaCampana?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
    envio?: { id?: number; idABCConfigTareaCampana?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
  }
  idsTarea?: { carga?: number; validacion?: number; envio?: number }
}

export function useTareaCampanaDetails(props: {
  item?: TareaCampanaRow | null
  ejecucionesDisponibles: CatalogOption[]
  horasDisponibles: CatalogOption[]
}) {
  const horarios = computed(() => props.item?.horarios ?? [])

  const STAGE_CONFIG: Array<{ key: StageKey; label: string }> = [
    { key: 'carga', label: 'Carga' },
    { key: 'validacion', label: 'Validación' },
    { key: 'envio', label: 'Envío' }
  ]

  const getHorarioActive = (horario: HorarioItem) => horario.activo ?? horario.bolActivo ?? true

  const getStageSchedule = (key: StageKey) => {
    return props.item?.[key] ?? {}
  }

  const executionLabelById = computed(() => {
    return new Map(
      (props.ejecucionesDisponibles ?? [])
        .map(option => [Number(option.value), String(option.label ?? '').trim()] as const)
        .filter(entry => entry[0] > 0 && Boolean(entry[1]))
    )
  })

  const hourLabelById = computed(() => {
    const normalizeHourLabel = (value: unknown) => {
      const raw = String(value ?? '').trim()
      if (!raw) return ''

      const hhmm = raw.match(/^(\d{1,2}):(\d{2})$/)
      if (hhmm) {
        const hours = Number(hhmm[1])
        const minutes = Number(hhmm[2])
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        }
      }

      const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/)
      if (ampm) {
        let hours = Number(ampm[1])
        const minutes = Number(ampm[2])
        const suffix = String(ampm[3]).toUpperCase()
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
          if (suffix === 'PM' && hours < 12) hours += 12
          if (suffix === 'AM' && hours === 12) hours = 0
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        }
      }

      const normalized = toHoraLabel(raw)
      return normalized || ''
    }

    return new Map(
      (props.horasDisponibles ?? [])
        .map(option => [Number(option.value), normalizeHourLabel(option.label)] as const)
        .filter(entry => entry[0] > 0 && Boolean(entry[1]))
    )
  })

  const resolveStageExecutionId = (key: StageKey) => {
    const schedule = getStageSchedule(key)
    return Number(
      schedule?.ejecucionId
      ?? props.item?.tareasPorTipo?.[key]?.ejecucion?.id
      ?? 0
    )
  }

  const getStageExecution = (key: StageKey) => {
    const executionId = resolveStageExecutionId(key)
    const executionNameFromCatalog = executionLabelById.value.get(executionId)
    if (executionNameFromCatalog) return executionNameFromCatalog
    return String(getStageSchedule(key)?.ejecucion ?? '-').trim() || '-'
  }

  const normalizeStageToken = (value: unknown) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()

  const resolveStageTypeId = (key: StageKey) =>
    Number(props.item?.tareasPorTipo?.[key]?.tipo?.id ?? 0)

  const isHorarioForStage = (horario: HorarioItem, key: StageKey) => {
    if (horario?.stageKey) {
      return horario.stageKey === key
    }

    const stageTypeId = resolveStageTypeId(key)
    const horarioTypeId = Number(
      horario?.tipoHorario?.id
      ?? (horario as any)?.tipo?.id
      ?? (horario as any)?.idABCCatTipoHorario
      ?? 0
    )

    if (stageTypeId > 0 && horarioTypeId > 0) {
      return horarioTypeId === stageTypeId
    }

    const horarioTypeCode = normalizeStageToken((horario as any)?.tipoHorario?.codigo ?? (horario as any)?.tipo?.codigo)
    if (key === 'carga' && horarioTypeCode === 'CAG') return true
    if (key === 'validacion' && horarioTypeCode === 'VLD') return true
    if (key === 'envio' && horarioTypeCode === 'ENV') return true

    const horarioTypeName = normalizeStageToken(horario?.tipoHorario?.nombre ?? (horario as any)?.tipo?.nombre)
    if (key === 'carga' && horarioTypeName === 'CARGA') return true
    if (key === 'validacion' && horarioTypeName === 'VALIDACION') return true
    if (key === 'envio' && horarioTypeName === 'ENVIO') return true

    if (horarioTypeId > 0) {
      if (key === 'carga' && horarioTypeId === 1) return true
      if (key === 'validacion' && horarioTypeId === 2) return true
      if (key === 'envio' && horarioTypeId === 3) return true
    }

    return false
  }

  const formatLegacySchedule = (key: StageKey) => {
    const schedule = getStageSchedule(key)
    const day = String(schedule?.dia ?? '').trim()
    const hourRaw = String(schedule?.hora ?? '').trim()
    if (!day || !hourRaw) return ''
    return `${day} · ${formatHourToAmPm(hourRaw)}`
  }

  type StageHorarioEntry = {
    label: string
    active: boolean
    dayOrder: number
    hourMinutes: number
  }

  const resolveHorarioDayLabel = (horario: HorarioItem) => {
    const byName = normalizeWeekdayInputValue(horario?.dia?.nombre)
    if (byName) return byName
    const byId = weekdayById[Number(horario?.dia?.id ?? 0)]
    return byId ?? ''
  }

  const resolveHorarioHourLabel = (horario: HorarioItem) => {
    const hourId = Number(
      horario?.dia?.hora?.id
      ?? horario?.hora?.id
      ?? (horario as any)?.idABCCatHora
      ?? 0
    )
    const byCatalog = hourLabelById.value.get(hourId)
    if (byCatalog) return byCatalog

    const byNameRaw = String(horario?.dia?.hora?.nombre ?? horario?.hora?.nombre ?? '').trim()
    const byName = toHoraLabel(byNameRaw)
    if (byName) return byName

    return ''
  }

  const toHourMinutes = (hourLabel: string) => {
    const [hoursRaw, minutesRaw] = hourLabel.split(':')
    const hours = Number(hoursRaw)
    const minutes = Number(minutesRaw)
    if ([hours, minutes].some(Number.isNaN)) return Number.POSITIVE_INFINITY
    return (hours * 60) + minutes
  }

  const toStageHorarioEntry = (horario: HorarioItem): StageHorarioEntry => {
    const day = resolveHorarioDayLabel(horario)
    const hour = resolveHorarioHourLabel(horario)
    const label = [day, hour ? formatHourToAmPm(hour) : ''].filter(Boolean).join(' · ') || '-'

    return {
      label,
      active: getHorarioActive(horario),
      dayOrder: getWeekdayOrder(day),
      hourMinutes: toHourMinutes(hour)
    }
  }

  const compareStageHorarioEntry = (left: StageHorarioEntry, right: StageHorarioEntry) => {
    const leftInactive = left.active ? 0 : 1
    const rightInactive = right.active ? 0 : 1
    if (leftInactive !== rightInactive) return leftInactive - rightInactive
    if (left.dayOrder !== right.dayOrder) return left.dayOrder - right.dayOrder
    return left.hourMinutes - right.hourMinutes
  }

  const stageDetails = computed(() => {
    const source = horarios.value

    return STAGE_CONFIG.map(stage => {
      const stageHorarios = source
        .filter(horario => isHorarioForStage(horario, stage.key))
        .map(toStageHorarioEntry)
        .sort(compareStageHorarioEntry)

      if (!stageHorarios.length) {
        const fallback = formatLegacySchedule(stage.key)
        if (fallback) {
          stageHorarios.push({
            label: fallback,
            active: Boolean(props.item?.bolActivo),
            dayOrder: Number.POSITIVE_INFINITY,
            hourMinutes: Number.POSITIVE_INFINITY
          })
        }
      }

      const hasTaskConfigured = Boolean(
        Number(props.item?.idsTarea?.[stage.key] ?? 0)
        || Number(props.item?.tareasPorTipo?.[stage.key]?.idABCConfigTareaCampana ?? 0)
        || Number(props.item?.tareasPorTipo?.[stage.key]?.id ?? 0)
      )

      const hasExecutionConfigured = resolveStageExecutionId(stage.key) > 0
      const hasAnySchedule = stageHorarios.length > 0
      const configured = hasTaskConfigured || hasExecutionConfigured || hasAnySchedule

      return {
        ...stage,
        execution: getStageExecution(stage.key),
        horarios: stageHorarios,
        activeCount: stageHorarios.filter(entry => entry.active).length,
        configured
      }
    })
  })

  function formatTimestamp(value?: string) {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return {
    formatTimestamp,
    horarios,
    stageDetails
  }
}
