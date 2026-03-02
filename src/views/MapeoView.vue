<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { catalogosService } from '../services/catalogos/catalogosService'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import { mapeoCampanaService } from '@/services/mapeos/campana/mapeoCampanaService'
import type { MapeoLineaData } from '@/types/mapeos/linea'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import type { MapeoFiltersModel, MapeoCampanaFiltersModel } from '@/models/mapeos/shared/mapeoFilters.model'
import type { MapeoLineaFormModel } from '@/models/mapeos/linea/mapeoLinea.model'
import type { MapeoCampanaFormModel } from '@/models/mapeos/campana/mapeoCampana.model'
import { toCreateMapeoLineaPayload, toUpdateMapeoLineaPayload } from '@/models/mapeos/linea/mapeoLinea.model'
import { toCreateMapeoCampanaPayload, toUpdateMapeoCampanaPayload } from '@/models/mapeos/campana/mapeoCampana.model'
import MapeoLineaModal from '@/components/mapeos/linea/MapeoLineaModal.vue'
import MapeoCampanaModal from '@/components/mapeos/campana/MapeoCampanaModal.vue'
import MapeoLineaTable from '@/components/mapeos/linea/MapeoLineaTable.vue'
import MapeoCampanaTable from '@/components/mapeos/campana/MapeoCampanaTable.vue'
import MapeoLineaDetailsModal from '@/components/mapeos/linea/MapeoLineaDetailsModal.vue'
import MapeoCampanaDetailsModal from '@/components/mapeos/campana/MapeoCampanaDetailsModal.vue'
import MapeoLineaColumnasModal from '@/components/mapeos/linea/MapeoLineaColumnasModal.vue'
import MapeoCampanaColumnasModal from '@/components/mapeos/campana/MapeoCampanaColumnasModal.vue'
import FormActionConfirmModal from '@/components/shared/FormActionConfirmModal.vue'
import { Plus, Layers, Megaphone, LayoutGrid } from 'lucide-vue-next'
import { compareNewestFirst, matchesTokenizedSearch } from '@/composables/shared/listViewUtils'

const tabs = [
  { key: 'linea', label: 'Líneas de negocio', icon: Layers },
  { key: 'campana', label: 'Campañas', icon: Megaphone }
] as const
type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('linea')

interface Option {
  label: string
  value: number
}

const lineasDisponibles = ref<Option[]>([])
const campanasCatalogo = ref<Option[]>([])
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

const selectedFiltersLinea = reactive<MapeoFiltersModel>({
  lineas: [],
  status: []
})

const selectedFiltersCampana = reactive<MapeoCampanaFiltersModel>({
  lineas: [],
  campanas: [],
  status: []
})

async function fetchMapeosLinea() {
  isLoadingLinea.value = true
  error.value = null
  try {
    const data = await mapeoLineaService.getAllMapeos()
    allMapeosLinea.value = data
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingLinea.value = false
  }
}

async function fetchMapeosCampana() {
  isLoadingCampana.value = true
  error.value = null
  try {
    const data = await mapeoCampanaService.getMapeosCampana()
    allMapeosCampana.value = data
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingCampana.value = false
  }
}

function newestFirstCompare(
  left: { fechaCreacion?: string; idABCConfigMapeoLinea?: number },
  right: { fechaCreacion?: string; idABCConfigMapeoLinea?: number }
) {
  return compareNewestFirst(
    left.fechaCreacion,
    right.fechaCreacion,
    Number(left.idABCConfigMapeoLinea ?? 0),
    Number(right.idABCConfigMapeoLinea ?? 0)
  )
}

const filteredMapeosLinea = computed(() => {
  return allMapeosLinea.value.filter(item => {
    const matchSearch = matchesTokenizedSearch(item.nombre || '', searchQueryLinea.value || '')
    const lineaId = Number(item.linea?.id ?? item.idABCCatLineaNegocio ?? 0)
    const matchLinea = selectedFiltersLinea.lineas.length
      ? selectedFiltersLinea.lineas.includes(lineaId)
      : true
    const matchStatus = selectedFiltersLinea.status.length
      ? selectedFiltersLinea.status.includes(item.bolActivo)
      : true
    return matchSearch && matchLinea && matchStatus
  }).sort(newestFirstCompare)
})

const filteredMapeosCampana = computed(() => {
  return allMapeosCampana.value.filter(item => {
    const matchSearch = matchesTokenizedSearch(item.nombre || '', searchQueryCampana.value || '')
    const lineaId = Number(item.linea?.id ?? item.idABCCatLineaNegocio ?? 0)
    const campanaId = Number(item.linea?.campana?.id ?? item.idABCCatCampana ?? 0)
    const matchLinea = selectedFiltersCampana.lineas.length
      ? selectedFiltersCampana.lineas.includes(lineaId)
      : true
    const matchStatus = selectedFiltersCampana.status.length
      ? selectedFiltersCampana.status.includes(item.bolActivo)
      : true
    const matchCampana = selectedFiltersCampana.campanas.length
      ? selectedFiltersCampana.campanas.includes(campanaId)
      : true
    return matchSearch && matchLinea && matchStatus && matchCampana
  }).sort(newestFirstCompare)
})

const totalPagesLinea = computed(() =>
  Math.max(1, Math.ceil(filteredMapeosLinea.value.length / pageSize.value))
)

const totalPagesCampana = computed(() =>
  Math.max(1, Math.ceil(filteredMapeosCampana.value.length / pageSize.value))
)

const paginatedMapeosLinea = computed(() => {
  const start = (currentPageLinea.value - 1) * pageSize.value
  return filteredMapeosLinea.value.slice(start, start + pageSize.value)
})

const paginatedMapeosCampana = computed(() => {
  const start = (currentPageCampana.value - 1) * pageSize.value
  return filteredMapeosCampana.value.slice(start, start + pageSize.value)
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
  return campanasCatalogo.value.find(x => x.value === id)?.label ?? `Campaña ${id}`
}
const isCampanaRow = (item: MapeoLineaData | MapeoCampanaData): item is MapeoCampanaData =>
  Boolean(item?.linea?.campana)
const campanasDisponibles = computed(() => campanasCatalogo.value)

const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const modalTab = ref<TabKey>('linea')
const selectedItem = ref<MapeoLineaData | MapeoCampanaData | null>(null)
const showDetailsModal = ref(false)
const detailsItem = ref<MapeoLineaData | MapeoCampanaData | null>(null)
const detailsTab = ref<TabKey>('linea')
const showColumnasModal = ref(false)
const columnasTab = ref<TabKey>('linea')
const nombreMapeoForModal = ref<string>('')
const mapeoIdForModal = ref<number | string | null>(null)
const lineaIdForModal = ref<number | string | null>(null)
const campanaIdForModal = ref<number | string | null>(null)
const lineaNombreForModal = ref<string | null>(null)
const campanaNombreForModal = ref<string | null>(null)
const showStatusConfirmModal = ref(false)
const pendingStatusItem = ref<MapeoLineaData | MapeoCampanaData | null>(null)

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
  return `¿Deseas ${actionText} este mapeo?`
})

function openAddModal() {
  modalMode.value = 'add'
  modalTab.value = activeTab.value
  selectedItem.value = null
  showModal.value = true
}

function openEditModal(item: MapeoLineaData | MapeoCampanaData) {
  modalMode.value = 'edit'
  modalTab.value = activeTab.value
  selectedItem.value = item
  showModal.value = true
}

function openDetails(item: MapeoLineaData | MapeoCampanaData) {
  detailsItem.value = item
  detailsTab.value = activeTab.value
  showDetailsModal.value = true
}

function resolveMapeoToggleCandidates(item: MapeoLineaData | MapeoCampanaData): number[] {
  const candidates = [
    Number((item as any)?.idABCConfigMapeoLinea ?? 0),
    Number((item as any)?.idABCConfigMapeoCampana ?? 0),
    Number((item as any)?.mapeo?.id ?? 0),
    Number((item as any)?.id ?? 0)
  ].filter(id => Number.isFinite(id) && id > 0)
  return Array.from(new Set(candidates))
}

async function handleSave(formData: MapeoLineaFormModel | MapeoCampanaFormModel) {
  try {
    if (modalTab.value === 'campana') {
      isLoadingCampana.value = true
      const payload = formData as MapeoCampanaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersCampana.lineas[0] ?? 0)
      const campanaId = Number(payload.idABCCatCampana ?? selectedFiltersCampana.campanas[0] ?? 0)

      if (modalMode.value === 'add') {
        await mapeoCampanaService.createMapeoCampana(lineaId, campanaId, toCreateMapeoCampanaPayload(payload))
      } else if (selectedItem.value && isCampanaRow(selectedItem.value)) {
        await mapeoCampanaService.updateMapeoCampana(
          toUpdateMapeoCampanaPayload(payload, selectedItem.value.idABCConfigMapeoLinea)
        )
      }
      showModal.value = false
      await fetchMapeosCampana()
    } else {
      isLoadingLinea.value = true
      const payload = formData as MapeoLineaFormModel
      const lineaId = Number(payload.idABCCatLineaNegocio ?? selectedFiltersLinea.lineas[0] ?? 0)

      if (modalMode.value === 'add') {
        await mapeoLineaService.createMapeo(lineaId, toCreateMapeoLineaPayload(payload))
      } else if (selectedItem.value && !isCampanaRow(selectedItem.value)) {
        await mapeoLineaService.updateMapeo(
          toUpdateMapeoLineaPayload(payload, selectedItem.value.idABCConfigMapeoLinea)
        )
      }
      showModal.value = false
      await fetchMapeosLinea()
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingLinea.value = false
    isLoadingCampana.value = false
  }
}

async function toggleStatus(item: MapeoLineaData | MapeoCampanaData) {
  try {
    const wasActive = item.bolActivo
    const targetIds = resolveMapeoToggleCandidates(item)

    if (isCampanaRow(item)) {
      isLoadingCampana.value = true
      let patched = false
      let lastError: any = null

      for (const targetId of targetIds) {
        try {
          if (wasActive) {
            await mapeoCampanaService.patchDesactivarMapeoCampana(targetId, 1)
          } else {
            await mapeoCampanaService.patchActivarMapeoCampana(targetId, 1)
          }
          patched = true
          break
        } catch (e: any) {
          lastError = e
          if (Number(e?.status ?? 0) !== 404) throw e
        }
      }

      if (!patched && lastError) {
        throw lastError
      }

      await fetchMapeosCampana()
    } else {
      isLoadingLinea.value = true
      let patched = false
      let lastError: any = null

      for (const targetId of targetIds) {
        try {
          if (wasActive) {
            await mapeoLineaService.patchDesactivarMapeoLinea(targetId, 1)
          } else {
            await mapeoLineaService.patchActivarMapeoLinea(targetId, 1)
          }
          patched = true
          break
        } catch (e: any) {
          lastError = e
          if (Number(e?.status ?? 0) !== 404) throw e
        }
      }

      if (!patched && lastError) {
        throw lastError
      }

      await fetchMapeosLinea()
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoadingLinea.value = false
    isLoadingCampana.value = false
  }
}

function requestStatusToggle(item: MapeoLineaData | MapeoCampanaData) {
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

const toggleFilterMenuLinea = (column: string) => {
  openFilterLinea.value = openFilterLinea.value === column ? null : column
}

const toggleFilterMenuCampana = (column: string) => {
  openFilterCampana.value = openFilterCampana.value === column ? null : column
}

function handleTabChange(tab: TabKey) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (activeTab.value === 'campana') {
    currentPageCampana.value = 1
    if (!allMapeosCampana.value.length) fetchMapeosCampana()
  } else {
    currentPageLinea.value = 1
    if (!allMapeosLinea.value.length) fetchMapeosLinea()
  }
}

function mapCatalogosToOptions(items: { id: number; nombre: string; bolActivo: boolean }[]) {
  return items
    .filter(item => item.bolActivo !== false)
    .map(item => ({ label: item.nombre, value: item.id }))
}

function openColumnasModal(m: MapeoLineaData | MapeoCampanaData) {
  nombreMapeoForModal.value = (m as any).nombre ?? ''
  {
    const candidate = (m as any).idABCConfigMapeoCampana ?? (m as any).idABCConfigMapeoLinea ?? (m as any).idABCConfigMapeo ?? (m as any).id ?? null
    mapeoIdForModal.value = candidate !== null && candidate !== undefined ? Number(candidate) : null
  }
  const lineaId = Number((m as any).linea?.id ?? (m as any).idABCCatLineaNegocio ?? 0)
  const campanaIdRaw = (m as any).linea?.campana?.id ?? (m as any).idABCCatCampana
  const campanaId = campanaIdRaw === null || campanaIdRaw === undefined ? null : Number(campanaIdRaw)
  lineaIdForModal.value = lineaId || null
  campanaIdForModal.value = campanaId
  lineaNombreForModal.value = getLineaLabel(lineaId)
  campanaNombreForModal.value = campanaId !== null ? getCampanaLabel(campanaId) : null
  columnasTab.value = isCampanaRow(m) ? 'campana' : 'linea'
  showColumnasModal.value = true
}

function closeColumnasModal() {
  showColumnasModal.value = false
}

async function handleColumnasSaved() {
  if (columnasTab.value === 'campana') {
    await fetchMapeosCampana()
    return
  }
  await fetchMapeosLinea()
}

async function fetchCatalogosBase() {
  try {
    const catalogos = await catalogosService.getCatalogosAgrupados()
    const lineas = catalogos.find(group => group.codigo === 'LNN')?.registros ?? []
    const campanas = catalogos.find(group => group.codigo === 'CMP')?.registros ?? []
    lineasDisponibles.value = mapCatalogosToOptions(lineas)
    campanasCatalogo.value = mapCatalogosToOptions(campanas)

  } catch (e: any) {
    error.value = e.message
  }
}

onMounted(() => {
  fetchCatalogosBase()
  fetchMapeosLinea()
  fetchMapeosCampana()
  updatePageSize()
  window.addEventListener('resize', updatePageSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePageSize)
})

watch(filteredMapeosLinea, () => {
  if (currentPageLinea.value > totalPagesLinea.value) {
    currentPageLinea.value = totalPagesLinea.value
  }
})

watch(filteredMapeosCampana, () => {
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

function updatePageSize() {
  const available = window.innerHeight * 0.87 - 260
  const rows = Math.floor(available / 44)
  pageSize.value = Math.max(8, rows || 8)
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
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="openFilterLinea = null; openFilterCampana = null">
    <div class="max-w-7xl mx-auto space-y-4">
      
      <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
            <LayoutGrid class="w-6 h-6"/>
            Gestión de Mapeos
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Administra las configuraciones de líneas de negocio y campañas.
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

      <Transition name="tab-fade" mode="out-in" appear>
        <MapeoLineaTable
          v-if="activeTab === 'linea'"
          key="mapeo-linea"
          :lineas-disponibles="lineasDisponibles"
          :selected-filters="selectedFiltersLinea"
          :open-filter="openFilterLinea"
          :filtered-mapeos="paginatedMapeosLinea"
          :total-mapeos="filteredMapeosLinea.length"
          :current-page="currentPageLinea"
          :total-pages="totalPagesLinea"
          :can-prev-page="canPrevPageLinea"
          :can-next-page="canNextPageLinea"
          :is-loading="isLoadingLinea"
          :get-linea-label="getLineaLabel"
          @toggle-filter="toggleFilterMenuLinea"
          @view-details="openDetails"
          @toggle-status="requestStatusToggle"
          @edit="openEditModal"
          @select-all-lineas="selectedFiltersLinea.lineas = lineasDisponibles.map(x => x.value)"
          @prev-page="prevPageLinea"
          @next-page="nextPageLinea"
          @view-columnas="openColumnasModal"
          @search="handleSearchLinea"
        />

        <MapeoCampanaTable
          v-else
          key="mapeo-campana"
          :lineas-disponibles="lineasDisponibles"
          :campanas-disponibles="campanasDisponibles"
          :selected-filters="selectedFiltersCampana"
          :open-filter="openFilterCampana"
          :filtered-mapeos="paginatedMapeosCampana"
          :total-mapeos="filteredMapeosCampana.length"
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
          @edit="openEditModal"
          @select-all-lineas="selectedFiltersCampana.lineas = lineasDisponibles.map(x => x.value)"
          @select-all-campanas="selectedFiltersCampana.campanas = campanasDisponibles.map(x => x.value)"
          @prev-page="prevPageCampana"
          @next-page="nextPageCampana"
          @view-columnas="openColumnasModal"
          @search="handleSearchCampana"
        />
      </Transition>
    </div>

    <MapeoLineaModal
      v-if="modalTab === 'linea'"
      :show="showModal"
      :mode="modalMode"
      :lineas-disponibles="lineasDisponibles"
      :existing-mapeos="allMapeosLinea"
      :initial-data="selectedItem"
      :is-loading="isLoadingLinea"
      @save="handleSave"
      @close="showModal = false"
    />

    <MapeoCampanaModal
      v-else
      :show="showModal"
      :mode="modalMode"
      :lineas-disponibles="lineasDisponibles"
      :campanas-disponibles="campanasDisponibles"
      :existing-mapeos="allMapeosCampana"
      :initial-data="selectedItem"
      :is-loading="isLoadingCampana"
      @save="handleSave"
      @close="showModal = false"
    />

    <MapeoLineaDetailsModal
      v-if="detailsTab === 'linea'"
      :show="showDetailsModal"
      :item="detailsItem as any"
      :get-linea-label="getLineaLabel"
      @close="showDetailsModal = false"
    />

    <MapeoCampanaDetailsModal
      v-else
      :show="showDetailsModal"
      :item="detailsItem as any"
      :get-linea-label="getLineaLabel"
      @close="showDetailsModal = false"
    />

    <MapeoLineaColumnasModal
      v-if="columnasTab === 'linea'"
      :show="showColumnasModal"
      :mapeo-id="mapeoIdForModal"
      :mapeo-nombre="nombreMapeoForModal"
      :selected-linea-id="lineaIdForModal"
      :selected-linea-nombre="lineaNombreForModal"
      :lineas-disponibles="lineasDisponibles"
      @saved="handleColumnasSaved"
      @close="closeColumnasModal"
    />

    <MapeoCampanaColumnasModal
      v-else
      :show="showColumnasModal"
      :mapeo-id="mapeoIdForModal"
      :mapeo-nombre="nombreMapeoForModal"
      :selected-linea-id="lineaIdForModal"
      :selected-campana-id="campanaIdForModal"
      :selected-linea-nombre="lineaNombreForModal"
      :selected-campana-nombre="campanaNombreForModal"
      :lineas-disponibles="lineasDisponibles"
      @saved="handleColumnasSaved"
      @close="closeColumnasModal"
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
</template>