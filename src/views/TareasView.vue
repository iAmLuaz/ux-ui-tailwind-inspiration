<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { Layers, Megaphone, ClipboardCheck, Plus } from 'lucide-vue-next'
import TareaLineaTable from '@/components/tareas/linea/TareaLineaTable.vue'
import TareaCampanaTable from '@/components/tareas/campana/TareaCampanaTable.vue'
import TareaLineaModal from '@/components/tareas/linea/TareaLineaModal.vue'
import TareaCampanaModal from '@/components/tareas/campana/TareaCampanaModal.vue'
import TareaLineaDetailsModal from '@/components/tareas/linea/TareaLineaDetailsModal.vue'
import TareaCampanaDetailsModal from '@/components/tareas/campana/TareaCampanaDetailsModal.vue'
import { catalogosService } from '@/services/catalogos/catalogosService'
import { tareaLineaService } from '@/services/tareas/linea/tareaLineaService'
import { tareaCampanaService } from '@/services/tareas/campana/tareaCampanaService'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import { mapeoCampanaService } from '@/services/mapeos/campana/mapeoCampanaService'
import type { MapeoLineaData } from '@/types/mapeos/linea'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import type { TareaLineaFormModel } from '@/models/tareas/linea/tareaLinea.model'
import type { TareaCampanaFormModel } from '@/models/tareas/campana/tareaCampana.model'
import { toCreateTareaLineaPayload, toUpdateTareaLineaPayload } from '@/models/tareas/linea/tareaLinea.model'
import { toCreateTareaCampanaPayload, toUpdateTareaCampanaPayload } from '@/models/tareas/campana/tareaCampana.model'

const tabs = [
  { key: 'linea', label: 'Lineas de negocio', icon: Layers },
  { key: 'campana', label: 'Campanas', icon: Megaphone }
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
  ingesta: string
  bolActivo: boolean
  carga?: { ejecucion?: string; dia?: string; hora?: string }
  validacion?: { ejecucion?: string; dia?: string; hora?: string }
  envio?: { ejecucion?: string; dia?: string; hora?: string }
  fechaCreacion?: string
  fechaUltimaModificacion?: string
  [key: string]: any
}

type TareaCampanaRow = {
  idABCConfigTareaCampana: number
  idABCCatLineaNegocio: number
  idABCCatCampana: number
  ingesta: string
  bolActivo: boolean
  carga?: { ejecucion?: string; dia?: string; hora?: string }
  validacion?: { ejecucion?: string; dia?: string; hora?: string }
  envio?: { ejecucion?: string; dia?: string; hora?: string }
  fechaCreacion?: string
  fechaUltimaModificacion?: string
  [key: string]: any
}

const lineasDisponibles = ref<Option[]>([])
const campanasDisponibles = ref<Option[]>([])

const allTareasLinea = ref<TareaLineaRow[]>([])
const allTareasCampana = ref<TareaCampanaRow[]>([])
const allMapeosLinea = ref<MapeoLineaData[]>([])
const allMapeosCampana = ref<MapeoCampanaData[]>([])

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

function getSearchableText(item: { ingesta?: string; carga?: { ejecucion?: string } }) {
  return `${item.ingesta ?? ''} ${item.carga?.ejecucion ?? ''}`.trim()
}

const filteredTareasLinea = computed(() => {
  return allTareasLinea.value.filter(item => {
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
  return allTareasCampana.value.filter(item => {
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
  return campanasDisponibles.value.find(x => x.value === id)?.label ?? `Campana ${id}`
}

function mapCatalogosToOptions(items: { id: number; nombre: string; bolActivo: boolean }[]) {
  return items
    .filter(item => item.bolActivo !== false)
    .map(item => ({ label: item.nombre, value: item.id }))
}

async function fetchCatalogos() {
  const catalogos = await catalogosService.getCatalogosAgrupados()
  const lineas = catalogos.find(group => group.codigo === 'LNN')?.registros ?? []
  const campanas = catalogos.find(group => group.codigo === 'CMP')?.registros ?? []
  lineasDisponibles.value = mapCatalogosToOptions(lineas)
  campanasDisponibles.value = mapCatalogosToOptions(campanas)
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

function openDetails(item: TareaLineaRow | TareaCampanaRow) {
  detailTab.value = activeTab.value
  detailItem.value = item
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailItem.value = null
}
function openEdit(item: TareaLineaRow | TareaCampanaRow) {
  modalMode.value = 'edit'
  modalTab.value = activeTab.value
  selectedItem.value = item
  showModal.value = true
}

async function toggleStatus(item: TareaLineaRow | TareaCampanaRow) {
  try {
    if (isCampanaRow(item)) {
      isLoadingCampana.value = true
      if (item.bolActivo) {
        await tareaCampanaService.patchDesactivar(Number(item.idABCConfigTareaCampana), 1)
      } else {
        await tareaCampanaService.patchActivar(Number(item.idABCConfigTareaCampana), 1)
      }
      await fetchTareasCampana()
    } else {
      isLoadingLinea.value = true
      if (item.bolActivo) {
        await tareaLineaService.patchDesactivar(Number(item.idABCConfigTareaLinea), 1)
      } else {
        await tareaLineaService.patchActivar(Number(item.idABCConfigTareaLinea), 1)
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

async function handleSave(formData: TareaLineaFormModel | TareaCampanaFormModel) {
  try {
    if (modalTab.value === 'campana') {
      isLoadingCampana.value = true
      const payload = formData as TareaCampanaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersCampana.lineas[0] ?? 0)
      const campanaId = Number(payload.idABCCatCampana ?? selectedFiltersCampana.campanas[0] ?? 0)

      if (modalMode.value === 'add') {
        await tareaCampanaService.create(lineaId, campanaId, toCreateTareaCampanaPayload(payload))
      } else if (selectedItem.value && isCampanaRow(selectedItem.value)) {
        await tareaCampanaService.update(
          toUpdateTareaCampanaPayload(payload, selectedItem.value.idABCConfigTareaCampana)
        )
      }
      closeModal()
      await fetchTareasCampana()
    } else {
      isLoadingLinea.value = true
      const payload = formData as TareaLineaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersLinea.lineas[0] ?? 0)

      if (modalMode.value === 'add') {
        await tareaLineaService.create(lineaId, toCreateTareaLineaPayload(payload))
      } else if (selectedItem.value && !isCampanaRow(selectedItem.value)) {
        await tareaLineaService.update(
          toUpdateTareaLineaPayload(payload, selectedItem.value.idABCConfigTareaLinea)
        )
      }
      closeModal()
      await fetchTareasLinea()
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
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
        :mapeos-linea="allMapeosLinea"
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
        :mapeos-campana="allMapeosCampana"
        :initial-data="selectedItem"
        :is-loading="isLoadingCampana"
        @save="handleSave"
        @close="closeModal"
      />

      <TareaLineaDetailsModal
        v-if="detailTab === 'linea'"
        :show="showDetailsModal"
        :item="detailItem as TareaLineaRow | null"
        :get-linea-label="getLineaLabel"
        @close="closeDetailsModal"
      />

      <TareaCampanaDetailsModal
        v-if="detailTab === 'campana'"
        :show="showDetailsModal"
        :item="detailItem as TareaCampanaRow | null"
        :get-linea-label="getLineaLabel"
        :get-campana-label="getCampanaLabel"
        @close="closeDetailsModal"
      />
    </div>
  </div>
</template>
