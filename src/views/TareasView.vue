<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import TareaLineaTable from '@/components/tareas/linea/TareaLineaTable.vue'
import TareaCampanaTable from '@/components/tareas/campana/TareaCampanaTable.vue'
import TareaLineaModal from '@/components/tareas/linea/TareaLineaModal.vue'
import TareaCampanaModal from '@/components/tareas/campana/TareaCampanaModal.vue'
import TareaLineaDetailsModal from '@/components/tareas/linea/TareaLineaDetailsModal.vue'
import TareaCampanaDetailsModal from '@/components/tareas/campana/TareaCampanaDetailsModal.vue'
import TareaSaveProgressOverlay from '@/components/tareas/shared/TareaSaveProgressOverlay.vue'
import TareasHeader from '@/components/tareas/shared/TareasHeader.vue'
import FormActionConfirmModal from '@/components/shared/FormActionConfirmModal.vue'
import { catalogosService } from '@/services/catalogos/catalogosService'
import { tareaLineaService } from '@/services/tareas/linea/tareaLineaService'
import { tareaCampanaService } from '@/services/tareas/campana/tareaCampanaService'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import { mapeoCampanaService } from '@/services/mapeos/campana/mapeoCampanaService'
import type { MapeoLineaData } from '@/types/mapeos/linea'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import type { TareaLineaFormModel } from '@/models/tareas/linea/tareaLinea.model'
import type { TareaCampanaFormModel } from '@/models/tareas/campana/tareaCampana.model'
import {
  normalizeWeekdayInputValue,
  toHoraLabel,
  type Option as CatalogOption
} from '@/composables/tareas/tareaScheduleUtils'
import {
  enrichTareaWithMapeoName,
  mapCatalogosToOptions,
  resolveTareaMapeoId,
  stageKeys,
  stageTypeByKey
} from '@/composables/tareas/tareasViewUtils'
import {
  buildCampanaSaveActions,
  buildLineaSaveActions
} from '@/utils/tareas/tareasSaveActions.utils'
import { compareNewestFirst, matchesTokenizedSearch } from '@/composables/shared/listViewUtils'
import { addToast } from '@/stores/toastStore'

const tabs = [
  { key: 'linea', label: 'Lineas de negocio' },
  { key: 'campana', label: 'Campañas' }
] as const

type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('linea')

interface Option {
  label: string
  value: number
}

type TareaLineaRow = {
  idABCConfigTareaLinea: number
  idABCCatLineaNegocio: number
  ingesta?: string
  bolActivo: boolean
  carga?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  validacion?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  envio?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  idsTarea?: { carga?: number; validacion?: number; envio?: number }
  tareasPorTipo?: { carga?: any; validacion?: any; envio?: any }
  horarios?: any[]
  fechaCreacion?: string
  fechaUltimaModificacion?: string
  [key: string]: any
}

type TareaCampanaRow = {
  idABCConfigTareaCampana: number
  idABCCatLineaNegocio: number
  idABCCatCampana: number
  ingesta?: string
  bolActivo: boolean
  carga?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  validacion?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  envio?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  idsTarea?: { carga?: number; validacion?: number; envio?: number }
  tareasPorTipo?: { carga?: any; validacion?: any; envio?: any }
  horarios?: any[]
  fechaCreacion?: string
  fechaUltimaModificacion?: string
  [key: string]: any
}

const lineasDisponibles = ref<Option[]>([])
const campanasDisponibles = ref<Option[]>([])
const diasDisponibles = ref<CatalogOption[]>([])
const horasDisponibles = ref<CatalogOption[]>([])
const ejecucionesDisponibles = ref<CatalogOption[]>([])
const actividadTipoIds = ref({
  carga: 1,
  validacion: 2,
  envio: 3
})

const allTareasLinea = ref<TareaLineaRow[]>([])
const allTareasCampana = ref<TareaCampanaRow[]>([])
const allMapeosLinea = ref<MapeoLineaData[]>([])
const allMapeosCampana = ref<MapeoCampanaData[]>([])

const tareasLineaEnriched = computed(() =>
  allTareasLinea.value.map(item => enrichTareaWithMapeoName(item, allMapeosLinea.value))
)

const tareasCampanaEnriched = computed(() =>
  allTareasCampana.value.map(item => enrichTareaWithMapeoName(item, allMapeosCampana.value))
)

const selectedEditMapeoId = computed(() => {
  if (modalMode.value !== 'edit' || !selectedItem.value) return 0
  return resolveTareaMapeoId(selectedItem.value)
})

const mapeosLineaForModal = computed(() => {
  const usedIds = new Set(
    allTareasLinea.value
      .map(item => resolveTareaMapeoId(item))
      .filter(id => id > 0)
  )

  return allMapeosLinea.value.filter(mapeo => {
    const mapeoId = Number(mapeo.idABCConfigMapeoLinea ?? 0)
    if (mapeoId <= 0) return false
    if (modalMode.value === 'edit' && mapeoId === selectedEditMapeoId.value) return true
    return !usedIds.has(mapeoId)
  })
})

const mapeosCampanaForModal = computed(() => {
  const usedIds = new Set(
    allTareasCampana.value
      .map(item => resolveTareaMapeoId(item))
      .filter(id => id > 0)
  )

  return allMapeosCampana.value.filter(mapeo => {
    const mapeoId = Number(mapeo.idABCConfigMapeoLinea ?? 0)
    if (mapeoId <= 0) return false
    if (modalMode.value === 'edit' && mapeoId === selectedEditMapeoId.value) return true
    return !usedIds.has(mapeoId)
  })
})

const isLoadingLinea = ref(false)
const isLoadingCampana = ref(false)
const error = ref<string | null>(null)

const openFilterLinea = ref<string | null>(null)
const openFilterCampana = ref<string | null>(null)
const searchQueryLinea = ref('')
const searchQueryCampana = ref('')

const pageSize = ref(10)
const currentPageLinea = ref(1)
const currentPageCampana = ref(1)

const selectedFiltersLinea = reactive({
  lineas: [] as number[],
  status: [] as boolean[]
})

const selectedFiltersCampana = reactive({
  lineas: [] as number[],
  campanas: [] as number[],
  status: [] as boolean[]
})

const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const modalTab = ref<TabKey>('linea')
const selectedItem = ref<TareaLineaRow | TareaCampanaRow | null>(null)
const showDetailsModal = ref(false)
const detailTab = ref<TabKey>('linea')
const detailItem = ref<TareaLineaRow | TareaCampanaRow | null>(null)
const isLoadingDetails = ref(false)
const showSaveProgress = ref(false)
const saveProgressCompleted = ref(0)
const saveProgressTotal = ref(1)
const saveProgressAction = ref('')
const statusToggleLocks = ref(new Set<string>())
const showStatusConfirmModal = ref(false)
const pendingStatusItem = ref<TareaLineaRow | TareaCampanaRow | null>(null)

const statusConfirmLoading = computed(() => {
  if (!pendingStatusItem.value) return false
  return isCampanaRow(pendingStatusItem.value)
    ? isLoadingCampana.value
    : isLoadingLinea.value
})

const statusConfirmTitle = computed(() => {
  if (!pendingStatusItem.value) return 'Confirmar cambio de estatus'
  return pendingStatusItem.value.bolActivo
    ? 'Confirmar desactivación'
    : 'Confirmar activación'
})

const statusConfirmMessage = computed(() => {
  if (!pendingStatusItem.value) return '¿Deseas continuar con este cambio de estatus?'
  const actionText = pendingStatusItem.value.bolActivo ? 'desactivar' : 'activar'
  return `¿Deseas ${actionText} este registro de tarea?`
})

function getSearchableText(item: { ingesta?: string; carga?: { ejecucion?: string }; idABCConfigTareaLinea?: number; idABCConfigTareaCampana?: number }) {
  return `${item.ingesta ?? ''} ${item.carga?.ejecucion ?? ''} ${item.idABCConfigTareaLinea ?? ''} ${item.idABCConfigTareaCampana ?? ''}`.trim()
}

function newestFirstCompare(
  left: { fechaCreacion?: string; idABCConfigTareaLinea?: number; idABCConfigTareaCampana?: number },
  right: { fechaCreacion?: string; idABCConfigTareaLinea?: number; idABCConfigTareaCampana?: number }
) {
  const leftId = Number(left.idABCConfigTareaCampana ?? left.idABCConfigTareaLinea ?? 0)
  const rightId = Number(right.idABCConfigTareaCampana ?? right.idABCConfigTareaLinea ?? 0)
  return compareNewestFirst(left.fechaCreacion, right.fechaCreacion, leftId, rightId)
}

const filteredTareasLinea = computed(() => {
  return tareasLineaEnriched.value.filter(item => {
    const matchSearch = matchesTokenizedSearch(getSearchableText(item), searchQueryLinea.value || '')
    const matchLinea = selectedFiltersLinea.lineas.length
      ? selectedFiltersLinea.lineas.includes(item.idABCCatLineaNegocio)
      : true
    const matchStatus = selectedFiltersLinea.status.length
      ? selectedFiltersLinea.status.includes(item.bolActivo)
      : true
    return matchSearch && matchLinea && matchStatus
  }).sort(newestFirstCompare)
})

const filteredTareasCampana = computed(() => {
  return tareasCampanaEnriched.value.filter(item => {
    const matchSearch = matchesTokenizedSearch(getSearchableText(item), searchQueryCampana.value || '')
    const matchLinea = selectedFiltersCampana.lineas.length
      ? selectedFiltersCampana.lineas.includes(item.idABCCatLineaNegocio)
      : true
    const matchStatus = selectedFiltersCampana.status.length
      ? selectedFiltersCampana.status.includes(item.bolActivo)
      : true
    const matchCampana = selectedFiltersCampana.campanas.length
      ? selectedFiltersCampana.campanas.includes(item.idABCCatCampana)
      : true
    return matchSearch && matchLinea && matchStatus && matchCampana
  }).sort(newestFirstCompare)
})

const totalPagesLinea = computed(() =>
  Math.max(1, Math.ceil(filteredTareasLinea.value.length / pageSize.value))
)

const totalPagesCampana = computed(() =>
  Math.max(1, Math.ceil(filteredTareasCampana.value.length / pageSize.value))
)

const paginatedTareasLinea = computed(() => {
  const start = (currentPageLinea.value - 1) * pageSize.value
  return filteredTareasLinea.value.slice(start, start + pageSize.value)
})

const paginatedTareasCampana = computed(() => {
  const start = (currentPageCampana.value - 1) * pageSize.value
  return filteredTareasCampana.value.slice(start, start + pageSize.value)
})

const canPrevPageLinea = computed(() => currentPageLinea.value > 1)
const canNextPageLinea = computed(() => currentPageLinea.value < totalPagesLinea.value)
const canPrevPageCampana = computed(() => currentPageCampana.value > 1)
const canNextPageCampana = computed(() => currentPageCampana.value < totalPagesCampana.value)

function prevPageLinea() {
  if (!canPrevPageLinea.value) return
  currentPageLinea.value -= 1
}

function nextPageLinea() {
  if (!canNextPageLinea.value) return
  currentPageLinea.value += 1
}

function prevPageCampana() {
  if (!canPrevPageCampana.value) return
  currentPageCampana.value -= 1
}

function nextPageCampana() {
  if (!canNextPageCampana.value) return
  currentPageCampana.value += 1
}

const getLineaLabel = (id?: number) => lineasDisponibles.value.find(x => x.value === id)?.label || 'N/A'
const getCampanaLabel = (id?: number) => {
  if (id === undefined || id === null) return '-'
  return campanasDisponibles.value.find(x => x.value === id)?.label ?? `Campaña ${id}`
}

function toHourMinutes(value: unknown) {
  const label = toHoraLabel(value)
  const [hoursRaw, minutesRaw] = String(label ?? '').split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if ([hours, minutes].some(Number.isNaN)) return Number.POSITIVE_INFINITY
  return (hours * 60) + minutes
}

function resolveHourLabelFromCatalogItem(item: { nombre?: string; codigo?: string }) {
  const fromNombre = toHoraLabel(item?.nombre)
  if (fromNombre) return fromNombre

  const fromCodigo = toHoraLabel(item?.codigo)
  if (fromCodigo) return fromCodigo

  const rawNombre = String(item?.nombre ?? '').trim()
  if (rawNombre) return rawNombre

  return String(item?.codigo ?? '').trim()
}

async function fetchCatalogos() {
  const catalogos = await catalogosService.getCatalogosAgrupados()
  const lineas = catalogos.find(group => group.codigo === 'LNN')?.registros ?? []
  const campanas = catalogos.find(group => group.codigo === 'CMP')?.registros ?? []
  const dias = catalogos.find(group => String(group.codigo).toUpperCase() === 'DIA')?.registros ?? []
  const horas = catalogos.find(group => String(group.codigo).toUpperCase() === 'HRS')?.registros ?? []
  const ejecuciones = catalogos.find(group => String(group.codigo).toUpperCase() === 'EJE')?.registros ?? []
  const actividades = catalogos.find(group => String(group.codigo).toUpperCase() === 'ACT')?.registros ?? []
  const actividadByCode = new Map(
    actividades
      .map(item => [String(item?.codigo ?? '').toUpperCase(), Number(item?.id ?? 0)] as const)
      .filter((entry) => entry[1] > 0)
  )
  actividadTipoIds.value = {
    carga: actividadByCode.get('CAG') ?? 1,
    validacion: actividadByCode.get('VLD') ?? 2,
    envio: actividadByCode.get('ENV') ?? 3
  }
  lineasDisponibles.value = mapCatalogosToOptions(lineas)
  campanasDisponibles.value = mapCatalogosToOptions(campanas)
  diasDisponibles.value = [...dias]
    .sort((left, right) => {
      const leftInactive = left?.bolActivo === false ? 1 : 0
      const rightInactive = right?.bolActivo === false ? 1 : 0
      if (leftInactive !== rightInactive) return leftInactive - rightInactive
      const leftDay = normalizeWeekdayInputValue(left?.nombre)
      const rightDay = normalizeWeekdayInputValue(right?.nombre)
      const order: Record<string, number> = {
        Lunes: 1,
        Martes: 2,
        Miércoles: 3,
        Jueves: 4,
        Viernes: 5
      }
      return (order[leftDay] ?? 999) - (order[rightDay] ?? 999)
    })
    .map(item => ({
      label: normalizeWeekdayInputValue(item.nombre) || item.nombre,
      value: item.id
    }))
  horasDisponibles.value = [...horas]
    .sort((left, right) => {
      const leftInactive = left?.bolActivo === false ? 1 : 0
      const rightInactive = right?.bolActivo === false ? 1 : 0
      if (leftInactive !== rightInactive) return leftInactive - rightInactive
      return toHourMinutes(resolveHourLabelFromCatalogItem(left)) - toHourMinutes(resolveHourLabelFromCatalogItem(right))
    })
    .map(item => ({
      label: resolveHourLabelFromCatalogItem(item),
      value: item.id
    }))
  ejecucionesDisponibles.value = ejecuciones
    .filter(item => item.bolActivo !== false)
    .map(item => ({
      label: item.nombre,
      value: item.id
    }))
}

async function fetchTareasLinea() {
  isLoadingLinea.value = true
  error.value = null
  try {
    allTareasLinea.value = await tareaLineaService.getAll()
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingLinea.value = false
  }
}

async function fetchTareasCampana() {
  isLoadingCampana.value = true
  error.value = null
  try {
    allTareasCampana.value = await tareaCampanaService.getAll()
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingCampana.value = false
  }
}

async function fetchMapeos() {
  error.value = null
  try {
    const [linea, campana] = await Promise.all([
      mapeoLineaService.getAllMapeos(),
      mapeoCampanaService.getMapeosCampana()
    ])
    allMapeosLinea.value = linea
    allMapeosCampana.value = campana
  } catch (e: any) {
    error.value = e.message
  }
}

const toggleFilterMenuLinea = (column: string) => {
  openFilterLinea.value = openFilterLinea.value === column ? null : column
}

const toggleFilterMenuCampana = (column: string) => {
  openFilterCampana.value = openFilterCampana.value === column ? null : column
}

function handleTabChange(tab: TabKey) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (showModal.value) {
    showModal.value = false
    selectedItem.value = null
  }
}

function handleSearchLinea(query: string) {
  searchQueryLinea.value = query || ''
  currentPageLinea.value = 1
  openFilterLinea.value = null
}

function handleSearchCampana(query: string) {
  searchQueryCampana.value = query || ''
  currentPageCampana.value = 1
  openFilterCampana.value = null
}

const isCampanaRow = (item: TareaLineaRow | TareaCampanaRow): item is TareaCampanaRow =>
  Object.prototype.hasOwnProperty.call(item, 'idABCCatCampana')


async function hydrateLineaForEdit(item: TareaLineaRow): Promise<TareaLineaRow> {
  const ids = item.idsTarea ?? {}
  const horariosByStage = await Promise.all(
    stageKeys.map(async stage => {
      const taskId = Number(
        ids[stage]
        ?? item.tareasPorTipo?.[stage]?.idABCConfigTareaLinea
        ?? item.tareasPorTipo?.[stage]?.id
        ?? 0
      )
      if (!taskId) return []
      const horarios = await tareaLineaService.getHorariosByTarea(taskId)
      return (Array.isArray(horarios) ? horarios : []).map((horario: any) => ({
        ...horario,
        stageKey: stage,
        tipoHorario: {
          ...(horario?.tipoHorario ?? {}),
          id: Number(horario?.tipoHorario?.id ?? stageTypeByKey[stage]),
          nombre: String(horario?.tipoHorario?.nombre ?? stage)
        },
        horarioId: Number(horario?.idABCConfigHorarioTareaLinea ?? horario?.id ?? 0) || undefined,
        persisted: true,
        activo: horario?.activo ?? horario?.bolActivo ?? true
      }))
    })
  )

  return {
    ...item,
    horarios: horariosByStage.flat()
  }
}

async function hydrateCampanaForEdit(item: TareaCampanaRow): Promise<TareaCampanaRow> {
  const ids = item.idsTarea ?? {}
  const horariosByStage = await Promise.all(
    stageKeys.map(async stage => {
      const taskId = Number(
        ids[stage]
        ?? item.tareasPorTipo?.[stage]?.idABCConfigTareaCampana
        ?? item.tareasPorTipo?.[stage]?.id
        ?? 0
      )
      if (!taskId) return []
      const horarios = await tareaCampanaService.getHorariosByTarea(taskId)
      return (Array.isArray(horarios) ? horarios : []).map((horario: any) => ({
        ...horario,
        stageKey: stage,
        tipoHorario: {
          ...(horario?.tipoHorario ?? {}),
          id: Number(horario?.tipoHorario?.id ?? stageTypeByKey[stage]),
          nombre: String(horario?.tipoHorario?.nombre ?? stage)
        },
        horarioId: Number(horario?.idABCConfigHorarioTareaCampana ?? horario?.id ?? 0) || undefined,
        persisted: true,
        activo: horario?.activo ?? horario?.bolActivo ?? true
      }))
    })
  )

  return {
    ...item,
    horarios: horariosByStage.flat()
  }
}

function openDetails(item: TareaLineaRow | TareaCampanaRow) {
  const run = async () => {
    detailTab.value = activeTab.value
    detailItem.value = null
    showDetailsModal.value = true
    isLoadingDetails.value = true

    if (isCampanaRow(item)) {
      detailItem.value = await hydrateCampanaForEdit(item)
    } else {
      detailItem.value = await hydrateLineaForEdit(item)
    }
  }

  run().catch((e: any) => {
    error.value = e?.message ?? 'No se pudo cargar el detalle de la tarea.'
    detailItem.value = item
  }).finally(() => {
    isLoadingDetails.value = false
  })
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailItem.value = null
  isLoadingDetails.value = false
}
function openEdit(item: TareaLineaRow | TareaCampanaRow) {
  const run = async () => {
    modalMode.value = 'edit'
    modalTab.value = activeTab.value

    if (isCampanaRow(item)) {
      isLoadingCampana.value = true
      selectedItem.value = await hydrateCampanaForEdit(item)
    } else {
      isLoadingLinea.value = true
      selectedItem.value = await hydrateLineaForEdit(item)
    }

    showModal.value = true
  }

  run().catch((e: any) => {
    error.value = e?.message ?? 'No se pudo abrir el formulario de edición.'
  }).finally(() => {
    isLoadingLinea.value = false
    isLoadingCampana.value = false
  })
}

function toUniquePositiveIds(values: unknown[]): number[] {
  const list = values
    .map(value => Number(value ?? 0))
    .filter(id => Number.isFinite(id) && id > 0)
  return Array.from(new Set(list))
}

function resolveTareaToggleTargetIds(item: TareaLineaRow | TareaCampanaRow): number[] {
  const stageIds = stageKeys.flatMap(stage => {
    const explicitId = Number(item.idsTarea?.[stage] ?? 0)
    const fromTipo = Number(
      item.tareasPorTipo?.[stage]?.id
      ?? item.tareasPorTipo?.[stage]?.idABCConfigTareaLinea
      ?? item.tareasPorTipo?.[stage]?.idABCConfigTareaCampana
      ?? 0
    )
    return [explicitId, fromTipo]
  })

  const principalId = Number(
    isCampanaRow(item)
      ? item.idABCConfigTareaCampana
      : item.idABCConfigTareaLinea
  )
  const rawTaskId = Number((item as any)?.tarea?.id ?? 0)

  const uniqueStageIds = toUniquePositiveIds(stageIds)
  if (uniqueStageIds.length) return uniqueStageIds
  return toUniquePositiveIds([principalId, rawTaskId])
}

async function toggleStatus(item: TareaLineaRow | TareaCampanaRow) {
  const wasActive = item.bolActivo
  const scope = isCampanaRow(item) ? 'campana' : 'linea'
  const lockId = Number(
    isCampanaRow(item)
      ? item.idABCConfigTareaCampana
      : item.idABCConfigTareaLinea
  ) || 0
  const lockKey = `${scope}:${lockId}`
  if (statusToggleLocks.value.has(lockKey)) return

  statusToggleLocks.value.add(lockKey)
  try {
    if (isCampanaRow(item)) {
      isLoadingCampana.value = true
      const targetIds = resolveTareaToggleTargetIds(item)
      let patchedCount = 0
      let lastError: any = null

      for (const targetId of targetIds) {
        try {
          if (wasActive) {
            await tareaCampanaService.patchDesactivar(targetId, 1)
          } else {
            await tareaCampanaService.patchActivar(targetId, 1)
          }
          patchedCount += 1
        } catch (e: any) {
          lastError = e
          if (Number(e?.status ?? 0) === 404) continue
          throw e
        }
      }

      if (patchedCount <= 0 && lastError) {
        throw lastError
      }

      await fetchTareasCampana()
      addToast(
        wasActive
          ? 'Tareas de campaña desactivadas correctamente'
          : 'Tareas de campaña activadas correctamente',
        'success'
      )
    } else {
      isLoadingLinea.value = true
      const targetIds = resolveTareaToggleTargetIds(item)
      let patchedCount = 0
      let lastError: any = null

      for (const targetId of targetIds) {
        try {
          if (wasActive) {
            await tareaLineaService.patchDesactivar(targetId, 1)
          } else {
            await tareaLineaService.patchActivar(targetId, 1)
          }
          patchedCount += 1
        } catch (e: any) {
          lastError = e
          if (Number(e?.status ?? 0) === 404) continue
          throw e
        }
      }

      if (patchedCount <= 0 && lastError) {
        throw lastError
      }

      await fetchTareasLinea()
      addToast(
        wasActive
          ? 'Tareas de línea desactivadas correctamente'
          : 'Tareas de línea activadas correctamente',
        'success'
      )
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    statusToggleLocks.value.delete(lockKey)
    isLoadingLinea.value = false
    isLoadingCampana.value = false
  }
}

function requestStatusToggle(item: TareaLineaRow | TareaCampanaRow) {
  pendingStatusItem.value = item
  showStatusConfirmModal.value = true
}

function closeStatusConfirmModal() {
  if (statusConfirmLoading.value) return
  showStatusConfirmModal.value = false
  pendingStatusItem.value = null
}

async function confirmStatusToggle() {
  if (!pendingStatusItem.value) return
  await toggleStatus(pendingStatusItem.value)
  showStatusConfirmModal.value = false
  pendingStatusItem.value = null
}

function openAddModal() {
  modalMode.value = 'add'
  modalTab.value = activeTab.value
  selectedItem.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedItem.value = null
}

function startSaveProgress(totalActions: number) {
  saveProgressTotal.value = Math.max(1, totalActions)
  saveProgressCompleted.value = 0
  saveProgressAction.value = 'Preparando acciones...'
  showSaveProgress.value = true
}

function updateSaveProgressAction(action: string) {
  saveProgressAction.value = action
}

function completeSaveProgressStep() {
  saveProgressCompleted.value = Math.min(saveProgressCompleted.value + 1, saveProgressTotal.value)
}

function stopSaveProgress() {
  showSaveProgress.value = false
  saveProgressCompleted.value = 0
  saveProgressTotal.value = 1
  saveProgressAction.value = ''
}

type SaveAction = {
  label: string
  run: () => Promise<void>
}

async function handleSave(formData: TareaLineaFormModel | TareaCampanaFormModel) {
  const wasAdd = modalMode.value === 'add'
  try {
    error.value = null
    let actions: SaveAction[] = []

    if (modalTab.value === 'campana') {
      isLoadingCampana.value = true
      const payload = formData as TareaCampanaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersCampana.lineas[0] ?? 0)
      const campanaId = Number(payload.idABCCatCampana ?? selectedFiltersCampana.campanas[0] ?? 0)
      actions = buildCampanaSaveActions({
        mode: modalMode.value,
        payload,
        selectedItem: selectedItem.value && isCampanaRow(selectedItem.value) ? selectedItem.value : null,
        lineaId,
        campanaId,
        actividadTipoIds: actividadTipoIds.value,
        service: tareaCampanaService,
        refresh: fetchTareasCampana
      })

      startSaveProgress(actions.length)
      for (const action of actions) {
        updateSaveProgressAction(action.label)
        await action.run()
        completeSaveProgressStep()
      }

      closeModal()
    } else {
      isLoadingLinea.value = true
      const payload = formData as TareaLineaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersLinea.lineas[0] ?? 0)
      actions = buildLineaSaveActions({
        mode: modalMode.value,
        payload,
        selectedItem: selectedItem.value && !isCampanaRow(selectedItem.value) ? selectedItem.value : null,
        lineaId,
        actividadTipoIds: actividadTipoIds.value,
        service: tareaLineaService,
        refresh: fetchTareasLinea
      })

      startSaveProgress(actions.length)
      for (const action of actions) {
        updateSaveProgressAction(action.label)
        await action.run()
        completeSaveProgressStep()
      }

      closeModal()
    }

    addToast(
      wasAdd ? 'Tareas agregadas correctamente.' : 'Tareas actualizadas correctamente.',
      'success',
      3500
    )
  } catch (e: any) {
    error.value = e.message
  } finally {
    stopSaveProgress()
    isLoadingLinea.value = false
    isLoadingCampana.value = false
  }
}

function updatePageSize() {
  const available = window.innerHeight * 0.87 - 260
  const rows = Math.floor(available / 44)
  pageSize.value = Math.max(8, rows || 8)
}

onMounted(() => {
  updatePageSize()
  fetchCatalogos()
  fetchTareasLinea()
  fetchTareasCampana()
  fetchMapeos()
  window.addEventListener('resize', updatePageSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePageSize)
})

watch(filteredTareasLinea, () => {
  if (currentPageLinea.value > totalPagesLinea.value) {
    currentPageLinea.value = totalPagesLinea.value
  }
})

watch(filteredTareasCampana, () => {
  if (currentPageCampana.value > totalPagesCampana.value) {
    currentPageCampana.value = totalPagesCampana.value
  }
})

watch(
  selectedFiltersLinea,
  () => {
    currentPageLinea.value = 1
  },
  { deep: true }
)

watch(
  selectedFiltersCampana,
  () => {
    currentPageCampana.value = 1
  },
  { deep: true }
)
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="openFilterLinea = null; openFilterCampana = null">
    <div class="max-w-7xl mx-auto space-y-4">
      <TareasHeader
        :tabs="tabs"
        :active-tab="activeTab"
        @tab-change="handleTabChange"
        @add="openAddModal"
      />

      <TareaLineaTable
        v-if="activeTab === 'linea'"
        :lineas-disponibles="lineasDisponibles"
        :selected-filters="selectedFiltersLinea"
        :open-filter="openFilterLinea"
        :filtered-tareas="paginatedTareasLinea"
        :total-tareas="filteredTareasLinea.length"
        :current-page="currentPageLinea"
        :total-pages="totalPagesLinea"
        :can-prev-page="canPrevPageLinea"
        :can-next-page="canNextPageLinea"
        :is-loading="isLoadingLinea"
        :get-linea-label="getLineaLabel"
        @toggle-filter="toggleFilterMenuLinea"
        @view-details="openDetails"
        @toggle-status="requestStatusToggle"
        @edit="openEdit"
        @select-all-lineas="selectedFiltersLinea.lineas = lineasDisponibles.map(x => x.value)"
        @prev-page="prevPageLinea"
        @next-page="nextPageLinea"
        @search="handleSearchLinea"
      />

      <TareaCampanaTable
        v-else
        :lineas-disponibles="lineasDisponibles"
        :campanas-disponibles="campanasDisponibles"
        :selected-filters="selectedFiltersCampana"
        :open-filter="openFilterCampana"
        :filtered-tareas="paginatedTareasCampana"
        :total-tareas="filteredTareasCampana.length"
        :current-page="currentPageCampana"
        :total-pages="totalPagesCampana"
        :can-prev-page="canPrevPageCampana"
        :can-next-page="canNextPageCampana"
        :is-loading="isLoadingCampana"
        :get-linea-label="getLineaLabel"
        :get-campana-label="getCampanaLabel"
        @toggle-filter="toggleFilterMenuCampana"
        @view-details="openDetails"
        @toggle-status="requestStatusToggle"
        @edit="openEdit"
        @select-all-lineas="selectedFiltersCampana.lineas = lineasDisponibles.map(x => x.value)"
        @select-all-campanas="selectedFiltersCampana.campanas = campanasDisponibles.map(x => x.value)"
        @prev-page="prevPageCampana"
        @next-page="nextPageCampana"
        @search="handleSearchCampana"
      />

      <p
        v-if="error"
        class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
      >
        {{ error }}
      </p>

      <TareaLineaModal
        v-if="modalTab === 'linea'"
        :show="showModal"
        :mode="modalMode"
        :lineas-disponibles="lineasDisponibles"
        :mapeos-linea="mapeosLineaForModal"
        :dias-disponibles="diasDisponibles"
        :horas-disponibles="horasDisponibles"
        :ejecuciones-disponibles="ejecucionesDisponibles"
        :initial-data="selectedItem"
        :is-loading="isLoadingLinea"
        @save="handleSave"
        @close="closeModal"
      />

      <TareaCampanaModal
        v-if="modalTab === 'campana'"
        :show="showModal"
        :mode="modalMode"
        :lineas-disponibles="lineasDisponibles"
        :campanas-disponibles="campanasDisponibles"
        :mapeos-campana="mapeosCampanaForModal"
        :dias-disponibles="diasDisponibles"
        :horas-disponibles="horasDisponibles"
        :ejecuciones-disponibles="ejecucionesDisponibles"
        :initial-data="selectedItem"
        :is-loading="isLoadingCampana"
        @save="handleSave"
        @close="closeModal"
      />

      <TareaLineaDetailsModal
        v-if="detailTab === 'linea'"
        :show="showDetailsModal"
        :is-loading="isLoadingDetails"
        :item="detailItem as TareaLineaRow | null"
        :get-linea-label="getLineaLabel"
        :ejecuciones-disponibles="ejecucionesDisponibles"
        :horas-disponibles="horasDisponibles"
        @close="closeDetailsModal"
      />

      <TareaCampanaDetailsModal
        v-if="detailTab === 'campana'"
        :show="showDetailsModal"
        :is-loading="isLoadingDetails"
        :item="detailItem as TareaCampanaRow | null"
        :get-linea-label="getLineaLabel"
        :get-campana-label="getCampanaLabel"
        :ejecuciones-disponibles="ejecucionesDisponibles"
        :horas-disponibles="horasDisponibles"
        @close="closeDetailsModal"
      />

      <TareaSaveProgressOverlay
        :show="showSaveProgress"
        title="Guardando configuración de tareas"
        :current-action="saveProgressAction"
        :completed="saveProgressCompleted"
        :total="saveProgressTotal"
      />

      <FormActionConfirmModal
        :show="showStatusConfirmModal"
        :title="statusConfirmTitle"
        :message="statusConfirmMessage"
        confirm-text="Guardar"
        cancel-text="Cancelar"
        :is-loading="statusConfirmLoading"
        @confirm="confirmStatusToggle"
        @cancel="closeStatusConfirmModal"
      />
    </div>
  </div>
</template>
