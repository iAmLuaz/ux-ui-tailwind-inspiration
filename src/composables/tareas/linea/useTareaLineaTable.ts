import { computed } from 'vue'
import { useFirstRowNewGlow } from '@/composables/shared/useFirstRowNewGlow'

interface HorarioItem {
  tipoHorario?: { id?: number }
  activo?: boolean
  bolActivo?: boolean
}

export interface TareaLineaTableRow {
  idABCConfigTareaLinea: number
  carga?: { ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  validacion?: { ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  envio?: { ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  horarios?: HorarioItem[]
}

export function useTareaLineaTable(props: {
  selectedFilters: { lineas: number[]; status: boolean[] }
  filteredTareas: TareaLineaTableRow[]
  isLoading: boolean
}) {
  const selectedLineas = computed({
    get: () => props.selectedFilters.lineas,
    set: value => {
      props.selectedFilters.lineas = value
    }
  })

  const selectedStatus = computed({
    get: () => props.selectedFilters.status,
    set: value => {
      props.selectedFilters.status = value
    }
  })

  const statusOptions = [
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
  ]

  const isScheduleOk = (schedule?: { ejecucion?: string; dia?: string; hora?: string }) =>
    Boolean(schedule?.ejecucion && schedule?.dia && schedule?.hora)

  const countStageHorarios = (t: TareaLineaTableRow, stageId: 1 | 2 | 3) => {
    const horarios = t.horarios ?? []
    const countByType = horarios.filter(h =>
      Number(h?.tipoHorario?.id ?? 0) === stageId &&
      (h as any)?.activo !== false &&
      (h as any)?.bolActivo !== false
    ).length
    if (countByType > 0) return countByType

    if (stageId === 1 && isScheduleOk(t.carga)) return 1
    if (stageId === 2 && isScheduleOk(t.validacion)) return 1
    if (stageId === 3 && isScheduleOk(t.envio)) return 1
    return 0
  }

  const getStageInfo = (t: TareaLineaTableRow, stageId: 1 | 2 | 3) => {
    const count = countStageHorarios(t, stageId)
    const configuredByRow = stageId === 1
      ? Boolean(t.carga?.configurada)
      : stageId === 2
        ? Boolean(t.validacion?.configurada)
        : Boolean(t.envio?.configurada)
    const configured = configuredByRow || count > 0
    return { count, configured }
  }

  const getStageVisual = (t: TareaLineaTableRow, stageId: 1 | 2 | 3) => {
    const stage = getStageInfo(t, stageId)
    return {
      ...stage,
      label: stage.configured ? 'Configurada' : 'Sin configurar',
      containerClass: stage.configured
        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700'
        : 'bg-rose-50/70 border-rose-200 text-rose-700',
      iconWrapClass: stage.configured ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
    }
  }

  const thClass = 'px-4 py-3'
  const thSmallClass = 'px-4 py-3'

  const { isRowGlowing } = useFirstRowNewGlow(
    () => props.filteredTareas,
    row => Number(row.idABCConfigTareaLinea ?? 0),
    { isLoading: () => props.isLoading }
  )

  return {
    getStageVisual,
    isRowGlowing,
    selectedLineas,
    selectedStatus,
    statusOptions,
    thClass,
    thSmallClass
  }
}
