<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { mapeoService } from '../services/mapeoService'
import type { MapeoData, MapeoCampanaData } from '../types/mapeo'
import MapeoModal from '@/components/MapeoModal.vue'
import MapeoTable from '@/components/MapeoTable.vue'
import MapeoDetailsModal from '@/components/MapeoDetailsModal.vue'
import { Plus, Layers, Megaphone } from 'lucide-vue-next'

const tabs = [
  { key: 'linea', label: 'Líneas de negocio', icon: Layers },
  { key: 'campana', label: 'Campañas', icon: Megaphone }
] as const
type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('linea')

const lineasDisponibles = [
  { label: 'Afore', value: 1 },
  { label: 'Sofom', value: 2 },
  { label: 'Pensiones', value: 3 }
]

const campanasBase = [
  { label: 'Campaña 1', value: 1 },
  { label: 'Campaña 2', value: 2 },
  { label: 'Campaña 3', value: 3 }
]

type MapeoRow = MapeoData | MapeoCampanaData
const allMapeos = ref<MapeoRow[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const openFilter = ref<string | null>(null)

const pageSize = 10
const currentPage = ref(1)

const selectedFilters = reactive({
  lineas: [] as number[],
  campanas: [] as number[],
  status: [] as boolean[]
})

async function fetchMapeos() {
  isLoading.value = true
  error.value = null
  try {
    const data = activeTab.value === 'linea'
      ? await mapeoService.getAllMapeos()
      : await mapeoService.getMapeosCampana()
    allMapeos.value = data
    
    if (selectedFilters.lineas.length === 0) {
      selectedFilters.lineas = lineasDisponibles.map(x => x.value)
      selectedFilters.status = [true, false]
    }
    if (activeTab.value === 'campana' && selectedFilters.campanas.length === 0) {
      selectedFilters.campanas = campanasDisponibles.value.map(x => x.value)
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    if (modalMode.value === 'edit' && activeTab.value === 'campana') {
      showModal.value = false
    }
    isLoading.value = false
  }
}

const filteredMapeos = computed(() => {
  return allMapeos.value.filter(item => {
    const matchLinea = selectedFilters.lineas.length
      ? selectedFilters.lineas.includes(item.idABCCatLineaNegocio)
      : true

    const matchStatus = item.bolActivo !== undefined
      ? selectedFilters.status.includes(item.bolActivo)
      : true
    const matchCampana = activeTab.value === 'campana'
      ? (isCampanaRow(item)
        ? (selectedFilters.campanas.length
          ? selectedFilters.campanas.includes(item.idABCCatCampana)
          : true)
        : false)
      : true

    return matchLinea && matchStatus && matchCampana
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredMapeos.value.length / pageSize))
)

const paginatedMapeos = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMapeos.value.slice(start, start + pageSize)
})

const canPrevPage = computed(() => currentPage.value > 1)
const canNextPage = computed(() => currentPage.value < totalPages.value)

function prevPage() {
  if (!canPrevPage.value) return
  currentPage.value -= 1
}

function nextPage() {
  if (!canNextPage.value) return
  currentPage.value += 1
}

const getLineaLabel = (id?: number) => lineasDisponibles.find(x => x.value === id)?.label || 'N/A'
const isCampanaRow = (item: MapeoRow): item is MapeoCampanaData =>
  Object.prototype.hasOwnProperty.call(item, 'idABCCatCampana')
const campanasDisponibles = computed(() => {
  if (activeTab.value !== 'campana') return [] as { label: string; value: number }[]
  const ids = new Set<number>()
  allMapeos.value.forEach(item => {
    if (isCampanaRow(item)) ids.add(item.idABCCatCampana)
  })
  const fromData = Array.from(ids).sort((a, b) => a - b).map(id => ({
    label: `Campaña ${id}`,
    value: id
  }))
  return fromData.length ? fromData : campanasBase
})

const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedItem = ref<MapeoRow | null>(null)
const showDetailsModal = ref(false)
const detailsItem = ref<MapeoRow | null>(null)

function openAddModal() {
  modalMode.value = 'add'
  selectedItem.value = null
  showModal.value = true
}

function openEditModal(item: MapeoRow) {
  modalMode.value = 'edit'
  selectedItem.value = item
  showModal.value = true
}

function openDetails(item: MapeoRow) {
  detailsItem.value = item
  showDetailsModal.value = true
}

async function handleSave(formData: any) {
  isLoading.value = true
  try {
    const lineaId = Number(formData.idABCCatLineaNegocio ?? selectedFilters.lineas[0] ?? 0)

    if (modalMode.value === 'add') {
      if (activeTab.value === 'campana') {
        const campanaId = Number(formData.idABCCatCampana ?? selectedFilters.campanas[0] ?? 1)
        await mapeoService.createMapeoCampana(lineaId, campanaId, {
          mapeo: { nombre: formData.nombre, descripcion: formData.descripcion },
          idUsuario: 1
        })
      } else {
        await mapeoService.createMapeo(lineaId, {
          mapeo: { nombre: formData.nombre, descripcion: formData.descripcion },
          idUsuario: 1
        })
      }
    } else if (selectedItem.value) {
      const payload = {
        mapeo: { id: selectedItem.value.idABCConfigMapeoLinea, nombre: formData.nombre, descripcion: formData.descripcion },
        idUsuario: 1
      }
      if (activeTab.value === 'campana') {
        await mapeoService.updateMapeoCampana(payload)
      } else {
        await mapeoService.updateMapeo(payload)
      }
    }
    showModal.value = false
    await fetchMapeos()
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

async function toggleStatus(item: MapeoRow) {
  isLoading.value = true
  try {
    if (activeTab.value === 'campana') {
      if (item.bolActivo) {
        await mapeoService.patchDesactivarMapeoCampana(Number(item.idABCConfigMapeoLinea), 1)
      } else {
        await mapeoService.patchActivarMapeoCampana(Number(item.idABCConfigMapeoLinea), 1)
      }
    } else {
      if (item.bolActivo) {
        await mapeoService.patchDesactivarMapeoLinea(Number(item.idABCConfigMapeoLinea), 1)
      } else {
        await mapeoService.patchActivarMapeoLinea(Number(item.idABCConfigMapeoLinea), 1)
      }
    }
    await fetchMapeos()
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

const toggleFilterMenu = (column: string) => {
  openFilter.value = openFilter.value === column ? null : column
}

function handleTabChange(tab: TabKey) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (activeTab.value === 'campana') {
    selectedFilters.campanas = []
  }
  currentPage.value = 1
  fetchMapeos()
}

onMounted(fetchMapeos)

watch(filteredMapeos, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="openFilter = null">
    <div class="max-w-7xl mx-auto space-y-4">
      
      <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
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

      <MapeoTable
        :active-tab="activeTab"
        :lineas-disponibles="lineasDisponibles"
        :campanas-disponibles="campanasDisponibles"
        :selected-filters="selectedFilters"
        :open-filter="openFilter"
        :filtered-mapeos="paginatedMapeos"
        :total-mapeos="filteredMapeos.length"
        :current-page="currentPage"
        :total-pages="totalPages"
        :can-prev-page="canPrevPage"
        :can-next-page="canNextPage"
        :is-loading="isLoading"
        :get-linea-label="getLineaLabel"
        :is-campana-row="isCampanaRow"
        @toggle-filter="toggleFilterMenu"
        @view-details="openDetails"
        @toggle-status="toggleStatus"
        @edit="openEditModal"
        @select-all-lineas="selectedFilters.lineas = lineasDisponibles.map(x => x.value)"
        @select-all-campanas="selectedFilters.campanas = campanasDisponibles.map(x => x.value)"
        @prev-page="prevPage"
        @next-page="nextPage"
      />
    </div>
    
    <MapeoModal
      :show="showModal"
      :mode="modalMode"
      :active-tab="activeTab"
      :lineas-disponibles="lineasDisponibles"
      :campanas-disponibles="campanasDisponibles"
      :initial-data="selectedItem"
      :is-loading="isLoading"
      @save="handleSave"
      @close="showModal = false"
    />

    <MapeoDetailsModal
      :show="showDetailsModal"
      :item="detailsItem"
      :get-linea-label="getLineaLabel"
      @close="showDetailsModal = false"
    />
  </div>
</template>