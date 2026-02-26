import { ref, computed, onMounted, watch } from 'vue'
import { matchesSearchContains } from '@/composables/shared/listViewUtils'
import { useFirstRowNewGlow } from '@/composables/shared/useFirstRowNewGlow'
import { catalogosService } from '@/services/catalogos/catalogosService'
import { mapeoCampanaService } from '@/services/mapeos/campana/mapeoCampanaService'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import { tareaMonitorService } from '@/services/tareas/monitor/tareaMonitorService'
import type {
  TareaMonitorCampanaData,
  TareaMonitorData,
  TareaMonitorLineaData
} from '@/types/tareas/monitor'
import {
  mapCatalogIdToCode,
  mapCatalogIdToLabel,
  mapIdLabelOptions,
  mapMapeoNameById,
  resolveMapeoName
} from '@/utils/tareas/monitor/tareasMonitorData.utils'
import { getStatusClassByCode } from '@/utils/tareas/monitor/tareasMonitorFormat.utils'

export const tabs = [
  { key: 'linea', label: 'Lineas de negocio' },
  { key: 'campana', label: 'Campañas' }
] as const

export type TabKey = typeof tabs[number]['key']

export function useTareasMonitorViewModel() {
  const activeTab = ref<TabKey>('linea')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const openFilter = ref<string | null>(null)
  const searchQuery = ref('')
  const pageSize = ref(10)
  const currentPage = ref(1)

  const tareasMonitorLinea = ref<TareaMonitorLineaData[]>([])
  const tareasMonitorCampana = ref<TareaMonitorCampanaData[]>([])

  const lineaLabelById = ref(new Map<number, string>())
  const campanaLabelById = ref(new Map<number, string>())
  const actividadLabelById = ref(new Map<number, string>())
  const statusLabelById = ref(new Map<number, string>())
  const statusCodeById = ref(new Map<number, string>())
  const mapeoLineaNameById = ref(new Map<number, string>())
  const mapeoCampanaNameById = ref(new Map<number, string>())

  const currentRows = computed<TareaMonitorData[]>(() =>
    activeTab.value === 'linea' ? tareasMonitorLinea.value : tareasMonitorCampana.value
  )

  const lineasOptions = computed(() => mapIdLabelOptions(lineaLabelById.value))
  const campanasOptions = computed(() => mapIdLabelOptions(campanaLabelById.value))
  const actividadOptions = computed(() => mapIdLabelOptions(actividadLabelById.value))
  const estatusOptions = computed(() => mapIdLabelOptions(statusLabelById.value))

  const dictaminarOptions = [
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false }
  ]

  const selectedLineas = ref<number[]>([])
  const selectedCampanas = ref<number[]>([])
  const selectedActividades = ref<number[]>([])
  const selectedEstatus = ref<number[]>([])
  const selectedDictaminar = ref<boolean[]>([true, false])

  const filteredRows = computed<TareaMonitorData[]>(() => {
    return currentRows.value.filter(row => {
      const statusId = Number(row?.estatus?.id ?? 0)
      const actividadId = Number(row?.actividad?.id ?? 0)
      const campanaId = Number((row as TareaMonitorCampanaData)?.idABCCatCampana ?? 0)

      const matchSearch = matchesSearchContains(row.nombreMapeo, searchQuery.value)
      const matchLinea = selectedLineas.value.length
        ? selectedLineas.value.includes(Number(row.idABCCatLineaNegocio))
        : true
      const matchCampana = activeTab.value === 'campana'
        ? (selectedCampanas.value.length ? selectedCampanas.value.includes(campanaId) : true)
        : true
      const matchActividad = selectedActividades.value.length
        ? selectedActividades.value.includes(actividadId)
        : true
      const matchEstatus = selectedEstatus.value.length
        ? selectedEstatus.value.includes(statusId)
        : true
      const matchDictaminar = selectedDictaminar.value.length
        ? selectedDictaminar.value.includes(Boolean(row.bolActivo))
        : true

      return matchSearch && matchLinea && matchCampana && matchActividad && matchEstatus && matchDictaminar
    })
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value))
  )

  const paginatedRows = computed<TareaMonitorData[]>(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredRows.value.slice(start, start + pageSize.value)
  })

  const canPrevPage = computed(() => currentPage.value > 1)
  const canNextPage = computed(() => currentPage.value < totalPages.value)

  const { isRowGlowing } = useFirstRowNewGlow(
    () => paginatedRows.value,
    row => `${activeTab.value}-${Number(row.id ?? 0)}`,
    { isLoading: () => isLoading.value }
  )

  const totals = computed(() => {
    const rows = filteredRows.value
    const totalRegistros = rows.reduce((acc, row) => acc + Number(row.numeroRegistros ?? 0), 0)
    const totalProcesados = rows.reduce((acc, row) => acc + Number(row.numeroRegistrosProcesados ?? 0), 0)
    const activos = rows.filter(row => Boolean(row.bolActivo)).length

    return {
      tareas: rows.length,
      totalRegistros,
      totalProcesados,
      activos
    }
  })

  function initializeFilters() {
    selectedLineas.value = lineasOptions.value.map(opt => Number(opt.value))
    selectedCampanas.value = campanasOptions.value.map(opt => Number(opt.value))
    selectedActividades.value = actividadOptions.value.map(opt => Number(opt.value))
    selectedEstatus.value = estatusOptions.value.map(opt => Number(opt.value))
    selectedDictaminar.value = [true, false]
  }

  function getLineaLabel(row: TareaMonitorData) {
    return lineaLabelById.value.get(Number(row.idABCCatLineaNegocio)) ?? `Linea ${row.idABCCatLineaNegocio}`
  }

  function getCampanaLabel(row: TareaMonitorData) {
    if (!('idABCCatCampana' in row)) return '-'
    return campanaLabelById.value.get(Number(row.idABCCatCampana)) ?? `Campaña ${row.idABCCatCampana}`
  }

  function getActividadLabel(row: TareaMonitorData) {
    const id = Number(row?.actividad?.id ?? 0)
    const code = String(row?.actividad?.codigo ?? '').toUpperCase()
    return actividadLabelById.value.get(id) ?? row?.actividad?.nombre ?? code
  }

  function getStatusLabel(row: TareaMonitorData) {
    const id = Number(row?.estatus?.id ?? 0)
    const code = String(row?.estatus?.codigo ?? '').toUpperCase()
    return statusLabelById.value.get(id) ?? row?.estatus?.nombre ?? code
  }

  function getStatusClass(row: TareaMonitorData) {
    const id = Number(row?.estatus?.id ?? 0)
    const code = statusCodeById.value.get(id) ?? String(row?.estatus?.codigo ?? '').toUpperCase()
    return getStatusClassByCode(code)
  }

  function toggleFilter(key: string) {
    openFilter.value = openFilter.value === key ? null : key
  }

  function closeFilter() {
    openFilter.value = null
  }

  function handleTabChange(tab: TabKey) {
    if (activeTab.value === tab) return
    activeTab.value = tab
    openFilter.value = null
    currentPage.value = 1
  }

  function handleSearch(value: string) {
    searchQuery.value = value
    currentPage.value = 1
  }

  function prevPage() {
    if (!canPrevPage.value) return
    currentPage.value -= 1
  }

  function nextPage() {
    if (!canNextPage.value) return
    currentPage.value += 1
  }

  async function fetchCatalogos() {
    const catalogos = await catalogosService.getCatalogosAgrupados()
    lineaLabelById.value = mapCatalogIdToLabel(catalogos, 'LNN')
    campanaLabelById.value = mapCatalogIdToLabel(catalogos, 'CMP')
    actividadLabelById.value = mapCatalogIdToLabel(catalogos, 'ACT')
    statusLabelById.value = mapCatalogIdToLabel(catalogos, 'STS')
    statusCodeById.value = mapCatalogIdToCode(catalogos, 'STS')
  }

  async function fetchMapeos() {
    const [mapeosLinea, mapeosCampana] = await Promise.all([
      mapeoLineaService.getAllMapeos(),
      mapeoCampanaService.getMapeosCampana()
    ])
    mapeoLineaNameById.value = mapMapeoNameById(mapeosLinea)
    mapeoCampanaNameById.value = mapMapeoNameById(mapeosCampana)
  }

  async function fetchMonitorData() {
    const [linea, campana] = await Promise.all([
      tareaMonitorService.getLinea(),
      tareaMonitorService.getCampana()
    ])
    tareasMonitorLinea.value = linea.map(row => {
      const mapeoId = Number(row.idABCConfigMapeo ?? 0)
      return {
        ...row,
        nombreMapeo: resolveMapeoName(mapeoId, 'linea', mapeoLineaNameById.value, mapeoCampanaNameById.value)
      }
    })
    tareasMonitorCampana.value = campana.map(row => {
      const mapeoId = Number(row.idABCConfigMapeo ?? 0)
      return {
        ...row,
        nombreMapeo: resolveMapeoName(mapeoId, 'campana', mapeoLineaNameById.value, mapeoCampanaNameById.value)
      }
    })
  }

  onMounted(async () => {
    isLoading.value = true
    error.value = null
    try {
      await Promise.all([fetchCatalogos(), fetchMapeos()])
      await fetchMonitorData()
      initializeFilters()
    } catch (err: any) {
      error.value = err?.message ?? 'No fue posible cargar el monitoreo de tareas.'
    } finally {
      isLoading.value = false
    }
  })

  watch(
    [selectedLineas, selectedCampanas, selectedActividades, selectedEstatus, selectedDictaminar],
    () => {
      currentPage.value = 1
    },
    { deep: true }
  )

  watch(filteredRows, () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  })

  return {
    activeTab,
    canNextPage,
    canPrevPage,
    campanasOptions,
    closeFilter,
    currentPage,
    dictaminarOptions,
    error,
    estatusOptions,
    filteredRows,
    getActividadLabel,
    getCampanaLabel,
    getLineaLabel,
    getStatusClass,
    getStatusLabel,
    handleSearch,
    handleTabChange,
    isLoading,
    isRowGlowing,
    lineasOptions,
    nextPage,
    openFilter,
    paginatedRows,
    prevPage,
    selectedActividades,
    selectedCampanas,
    selectedDictaminar,
    selectedEstatus,
    selectedLineas,
    tabs,
    toggleFilter,
    totalPages,
    totals,
    actividadOptions
  }
}
