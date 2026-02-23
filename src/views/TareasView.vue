<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { Layers, Megaphone, ClipboardCheck, Plus } from 'lucide-vue-next'
import TareaLineaTable from '@/components/tareas/linea/TareaLineaTable.vue'
import TareaCampanaTable from '@/components/tareas/campana/TareaCampanaTable.vue'
import TareaLineaModal from '@/components/tareas/linea/TareaLineaModal.vue'
import TareaCampanaModal from '@/components/tareas/campana/TareaCampanaModal.vue'
import TareaLineaDetailsModal from '@/components/tareas/linea/TareaLineaDetailsModal.vue'
import TareaCampanaDetailsModal from '@/components/tareas/campana/TareaCampanaDetailsModal.vue'
import TareaSaveProgressOverlay from '@/components/tareas/shared/TareaSaveProgressOverlay.vue'
import { catalogosService } from '@/services/catalogos/catalogosService'
import { tareaLineaService } from '@/services/tareas/linea/tareaLineaService'
import { tareaCampanaService } from '@/services/tareas/campana/tareaCampanaService'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import { mapeoCampanaService } from '@/services/mapeos/campana/mapeoCampanaService'
import type { MapeoLineaData } from '@/types/mapeos/linea'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import type { TareaLineaFormModel } from '@/models/tareas/linea/tareaLinea.model'
import type { TareaCampanaFormModel } from '@/models/tareas/campana/tareaCampana.model'
import { toCreateTareaLineaPayloads, toUpdateTareaLineaOperations } from '@/models/tareas/linea/tareaLinea.model'
import { toCreateTareaCampanaPayloads, toUpdateTareaCampanaOperations } from '@/models/tareas/campana/tareaCampana.model'
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
import { addToast } from '@/stores/toastStore'

const tabs = [
  { key: 'linea', label: 'Lineas de negocio', icon: Layers },
  { key: 'campana', label: 'Campañas', icon: Megaphone }
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

const normalizeString = (s: unknown) => {
  if (s === null || s === undefined) return ''
  const str = String(s)
  try {
    return str
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim()
  } catch (_) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }
}

function matchesSearch(nameValue: string, query: string) {
  const q = normalizeString(query)
  if (!q) return true

  const name = normalizeString(nameValue || '')
  const nameWords = name.split(/\s+/).filter(Boolean)
  const qTokens = q.split(/\s+/).filter(Boolean)

  if (qTokens.length === 1) {
    const token = qTokens[0] ?? ''
    return nameWords.some(w => w.includes(token)) || name.includes(token)
  }
  return qTokens.every(token => nameWords.some(w => w.includes(token)))
}

function getSearchableText(item: { ingesta?: string; carga?: { ejecucion?: string }; idABCConfigTareaLinea?: number; idABCConfigTareaCampana?: number }) {
  return `${item.ingesta ?? ''} ${item.carga?.ejecucion ?? ''} ${item.idABCConfigTareaLinea ?? ''} ${item.idABCConfigTareaCampana ?? ''}`.trim()
}

const filteredTareasLinea = computed(() => {
  return tareasLineaEnriched.value.filter(item => {
    const matchSearch = matchesSearch(getSearchableText(item), searchQueryLinea.value || '')
    const matchLinea = selectedFiltersLinea.lineas.length
      ? selectedFiltersLinea.lineas.includes(item.idABCCatLineaNegocio)
      : true
    const matchStatus = selectedFiltersLinea.status.length
      ? selectedFiltersLinea.status.includes(item.bolActivo)
      : true
    return matchSearch && matchLinea && matchStatus
  })
})

const filteredTareasCampana = computed(() => {
  return tareasCampanaEnriched.value.filter(item => {
    const matchSearch = matchesSearch(getSearchableText(item), searchQueryCampana.value || '')
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
  })
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
  diasDisponibles.value = dias
    .filter(item => item.bolActivo !== false)
    .map(item => ({
      label: normalizeWeekdayInputValue(item.nombre) || item.nombre,
      value: item.id
    }))
  horasDisponibles.value = horas
    .filter(item => item.bolActivo !== false)
    .map(item => ({
      label: toHoraLabel(item.nombre || item.codigo),
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
        tipoHorario: horario?.tipoHorario ?? { id: stageTypeByKey[stage] },
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
        tipoHorario: horario?.tipoHorario ?? { id: stageTypeByKey[stage] },
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

async function toggleStatus(item: TareaLineaRow | TareaCampanaRow) {
  try {
    if (isCampanaRow(item)) {
      isLoadingCampana.value = true
      const ids = stageKeys
        .map(stage => Number(item.idsTarea?.[stage] ?? 0))
        .filter(id => id > 0)
      if (!ids.length) {
        const fallbackId = Number(item.idABCConfigTareaCampana ?? 0)
        if (fallbackId > 0) ids.push(fallbackId)
      }

      for (const id of ids) {
        if (item.bolActivo) {
          await tareaCampanaService.patchDesactivar(id, 1)
        } else {
          await tareaCampanaService.patchActivar(id, 1)
        }
      }
      await fetchTareasCampana()
    } else {
      isLoadingLinea.value = true
      const ids = stageKeys
        .map(stage => Number(item.idsTarea?.[stage] ?? 0))
        .filter(id => id > 0)
      if (!ids.length) {
        const fallbackId = Number(item.idABCConfigTareaLinea ?? 0)
        if (fallbackId > 0) ids.push(fallbackId)
      }

      for (const id of ids) {
        if (item.bolActivo) {
          await tareaLineaService.patchDesactivar(id, 1)
        } else {
          await tareaLineaService.patchActivar(id, 1)
        }
      }
      await fetchTareasLinea()
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingLinea.value = false
    isLoadingCampana.value = false
  }
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

function hasHorarioChanges(payload: { horarios?: any[]; horariosDesactivarIds?: number[]; horariosActivarIds?: number[] }) {
  return Boolean(
    (payload.horarios?.length ?? 0) > 0
    || (payload.horariosDesactivarIds?.length ?? 0) > 0
    || (payload.horariosActivarIds?.length ?? 0) > 0
  )
}

function resolveCurrentExecutionIdByStage(item: any, stage: 'carga' | 'validacion' | 'envio') {
  return Number(
    item?.tareasPorTipo?.[stage]?.ejecucion?.id
    ?? item?.[stage]?.ejecucionId
    ?? 0
  )
}

function shouldUpdateStageTask(
  item: TareaLineaRow | TareaCampanaRow,
  stage: 'carga' | 'validacion' | 'envio',
  nextExecutionId: number
) {
  const currentExecutionId = resolveCurrentExecutionIdByStage(item, stage)
  return currentExecutionId !== nextExecutionId
}

const stageActionLabel = (stage: 'carga' | 'validacion' | 'envio') => {
  if (stage === 'carga') return 'carga'
  if (stage === 'validacion') return 'validación'
  return 'envío'
}

function resolveStageTaskIds(item: TareaLineaRow | TareaCampanaRow) {
  return {
    carga: Number(item.idsTarea?.carga ?? item.tareasPorTipo?.carga?.id ?? item.tareasPorTipo?.carga?.idABCConfigTareaLinea ?? item.tareasPorTipo?.carga?.idABCConfigTareaCampana ?? 0) || undefined,
    validacion: Number(item.idsTarea?.validacion ?? item.tareasPorTipo?.validacion?.id ?? item.tareasPorTipo?.validacion?.idABCConfigTareaLinea ?? item.tareasPorTipo?.validacion?.idABCConfigTareaCampana ?? 0) || undefined,
    envio: Number(item.idsTarea?.envio ?? item.tareasPorTipo?.envio?.id ?? item.tareasPorTipo?.envio?.idABCConfigTareaLinea ?? item.tareasPorTipo?.envio?.idABCConfigTareaCampana ?? 0) || undefined
  }
}

function toPositiveIds(values: unknown[]): number[] {
  return values
    .map(value => Number(value))
    .filter(id => !Number.isNaN(id) && id > 0)
}

function uniqueIds(values: number[]): number[] {
  return Array.from(new Set(values))
}

function buildForcedHorarioSyncByStage(
  payload: any,
  stageTaskIds: { carga?: number; validacion?: number; envio?: number }
) {
  const idUsuario = Number(payload?.idUsuario ?? payload?.idABCUsuario ?? 1)
  const globalDesactivarIds = toPositiveIds(Array.isArray(payload?.horariosDesactivarIds) ? payload.horariosDesactivarIds : [])
  const globalActivarIds = toPositiveIds(Array.isArray(payload?.horariosActivarIds) ? payload.horariosActivarIds : [])

  const forcedSyncEntries = stageKeys
    .map(stage => {
      const taskId = Number(stageTaskIds[stage] ?? 0)
      if (!taskId) return null

      const stageSlots = Array.isArray(payload?.[`${stage}Slots`]) ? payload[`${stage}Slots`] : []
      const stageHorarioIds = new Set(
        toPositiveIds(stageSlots.map((slot: any) => slot?.horarioId))
      )

      const inferredDesactivarIds = toPositiveIds(
        stageSlots
          .filter((slot: any) => Number(slot?.horarioId ?? 0) > 0 && (slot?.activo ?? true) === false)
          .map((slot: any) => slot?.horarioId)
      )

      const horariosDesactivarIds = uniqueIds([
        ...globalDesactivarIds.filter(id => stageHorarioIds.has(id)),
        ...inferredDesactivarIds
      ])

      const horariosActivarIds = uniqueIds(
        globalActivarIds.filter(id => stageHorarioIds.has(id))
      )

      if (!horariosDesactivarIds.length && !horariosActivarIds.length) return null

      return {
        stage,
        taskId,
        payload: {
          horarios: [],
          idUsuario,
          horariosDesactivarIds,
          horariosActivarIds
        }
      }
    })
    .filter((item): item is { stage: 'carga' | 'validacion' | 'envio'; taskId: number; payload: any } => Boolean(item))

  return forcedSyncEntries
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

function toTaskOnlyUpdatePayload(payloadByStage: any) {
  return {
    tarea: payloadByStage?.tarea ?? {},
    idUsuario: Number(payloadByStage?.idUsuario ?? payloadByStage?.idABCUsuario ?? 1)
  }
}

async function handleSave(formData: TareaLineaFormModel | TareaCampanaFormModel) {
  const wasAdd = modalMode.value === 'add'
  try {
    error.value = null
    const actions: SaveAction[] = []

    if (modalTab.value === 'campana') {
      isLoadingCampana.value = true
      const payload = formData as TareaCampanaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersCampana.lineas[0] ?? 0)
      const campanaId = Number(payload.idABCCatCampana ?? selectedFiltersCampana.campanas[0] ?? 0)

      if (modalMode.value === 'add') {
        const payloads = toCreateTareaCampanaPayloads(payload, actividadTipoIds.value)
        for (const record of payloads) {
          const stageId = Number(record?.tarea?.tipo?.id ?? 0)
          const stage = stageId === 1 ? 'carga' : stageId === 2 ? 'validacion' : 'envio'
          actions.push({
            label: `Agregando ${stageActionLabel(stage)}`,
            run: () => tareaCampanaService.create(lineaId, campanaId, record).then(() => undefined)
          })
        }
      } else if (selectedItem.value && isCampanaRow(selectedItem.value)) {
        const stageTaskIds = resolveStageTaskIds(selectedItem.value)
        const operations = toUpdateTareaCampanaOperations(payload, stageTaskIds, actividadTipoIds.value)
        const syncedHorarioStages = new Set<string>()

        for (const entry of operations.update) {
          const payloadByStage = entry.payload
          const stageTaskId = Number(
            payloadByStage?.tarea?.id
            ?? stageTaskIds[entry.stage]
            ?? 0
          )

          const requiresTaskPut = shouldUpdateStageTask(
            selectedItem.value,
            entry.stage,
            Number(payloadByStage?.tarea?.ejecucion?.id ?? 0)
          )

          if (requiresTaskPut) {
            actions.push({
              label: `Actualizando ${stageActionLabel(entry.stage)}`,
              run: () => tareaCampanaService.update(toTaskOnlyUpdatePayload(payloadByStage)).then(() => undefined)
            })
          }

          if (stageTaskId > 0 && hasHorarioChanges(payloadByStage)) {
            syncedHorarioStages.add(entry.stage)
            actions.push({
              label: `Sincronizando horarios de ${stageActionLabel(entry.stage)}`,
              run: () => tareaCampanaService.syncHorarios(stageTaskId, payloadByStage).then(() => undefined)
            })
          }
        }

        for (const forcedSync of buildForcedHorarioSyncByStage(payload, stageTaskIds)) {
          if (syncedHorarioStages.has(forcedSync.stage)) continue
          actions.push({
            label: `Sincronizando horarios de ${stageActionLabel(forcedSync.stage)}`,
            run: () => tareaCampanaService.syncHorarios(forcedSync.taskId, forcedSync.payload).then(() => undefined)
          })
        }

        for (const entry of operations.create) {
          actions.push({
            label: `Agregando ${stageActionLabel(entry.stage)}`,
            run: () => tareaCampanaService.create(lineaId, campanaId, entry.payload).then(() => undefined)
          })
        }
      }

      actions.push({
        label: 'Actualizando tabla de campañas',
        run: () => fetchTareasCampana()
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

      if (modalMode.value === 'add') {
        const payloads = toCreateTareaLineaPayloads(payload, actividadTipoIds.value)
        for (const record of payloads) {
          const stageId = Number(record?.tarea?.tipo?.id ?? 0)
          const stage = stageId === 1 ? 'carga' : stageId === 2 ? 'validacion' : 'envio'
          actions.push({
            label: `Agregando ${stageActionLabel(stage)}`,
            run: () => tareaLineaService.create(lineaId, record).then(() => undefined)
          })
        }
      } else if (selectedItem.value && !isCampanaRow(selectedItem.value)) {
        const stageTaskIds = resolveStageTaskIds(selectedItem.value)
        const operations = toUpdateTareaLineaOperations(payload, stageTaskIds, actividadTipoIds.value)
        const syncedHorarioStages = new Set<string>()

        for (const entry of operations.update) {
          const payloadByStage = entry.payload
          const stageTaskId = Number(
            payloadByStage?.tarea?.id
            ?? stageTaskIds[entry.stage]
            ?? 0
          )

          const requiresTaskPut = shouldUpdateStageTask(
            selectedItem.value,
            entry.stage,
            Number(payloadByStage?.tarea?.ejecucion?.id ?? 0)
          )

          if (requiresTaskPut) {
            actions.push({
              label: `Actualizando ${stageActionLabel(entry.stage)}`,
              run: () => tareaLineaService.update(toTaskOnlyUpdatePayload(payloadByStage)).then(() => undefined)
            })
          }

          if (stageTaskId > 0 && hasHorarioChanges(payloadByStage)) {
            syncedHorarioStages.add(entry.stage)
            actions.push({
              label: `Sincronizando horarios de ${stageActionLabel(entry.stage)}`,
              run: () => tareaLineaService.syncHorarios(stageTaskId, payloadByStage).then(() => undefined)
            })
          }
        }

        for (const forcedSync of buildForcedHorarioSyncByStage(payload, stageTaskIds)) {
          if (syncedHorarioStages.has(forcedSync.stage)) continue
          actions.push({
            label: `Sincronizando horarios de ${stageActionLabel(forcedSync.stage)}`,
            run: () => tareaLineaService.syncHorarios(forcedSync.taskId, forcedSync.payload).then(() => undefined)
          })
        }

        for (const entry of operations.create) {
          actions.push({
            label: `Agregando ${stageActionLabel(entry.stage)}`,
            run: () => tareaLineaService.create(lineaId, entry.payload).then(() => undefined)
          })
        }
      }

      actions.push({
        label: 'Actualizando tabla de líneas',
        run: () => fetchTareasLinea()
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
      <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
            <ClipboardCheck class="w-6 h-6" />
            Gestion de Tareas
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Visualiza y administra las tareas por linea y campana.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
            <button
              v-for="t in tabs"
              :key="t.key"
              @click="handleTabChange(t.key)"
              class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
              :class="activeTab === t.key
                ? 'bg-[#00357F] text-white shadow-sm cursor-pointer'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
            >
              <component :is="t.icon" class="w-4 h-4" />
              {{ t.label }}
            </button>
          </div>
          <button
            @click="openAddModal"
            class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

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
        @toggle-status="toggleStatus"
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
        @toggle-status="toggleStatus"
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
        @close="closeDetailsModal"
      />

      <TareaSaveProgressOverlay
        :show="showSaveProgress"
        title="Guardando configuración de tareas"
        :current-action="saveProgressAction"
        :completed="saveProgressCompleted"
        :total="saveProgressTotal"
      />
    </div>
  </div>
</template>
