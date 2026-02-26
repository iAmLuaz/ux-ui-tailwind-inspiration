<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Activity, Layers, Megaphone, LayoutGrid, Database, Search } from 'lucide-vue-next'
import FilterDropdown from '@/components/FilterDropdown.vue'
import TableSearch from '@/components/TableSearch.vue'
import { useFirstRowNewGlow } from '@/composables/shared/useFirstRowNewGlow'
import { matchesSearchContains } from '@/composables/shared/listViewUtils'
import {
  formatDateLabel,
  formatNumber,
  formatTimeLabel,
  mapCatalogIdToCode,
  mapCatalogIdToLabel,
  mapMapeoNameById
} from '@/composables/tareas/monitor/tareasMonitorViewUtils'
import { catalogosService } from '@/services/catalogos/catalogosService'
import { tareaMonitorService } from '@/services/tareas/monitor/tareaMonitorService'
import { mapeoLineaService } from '@/services/mapeos/linea/mapeoLineaService'
import { mapeoCampanaService } from '@/services/mapeos/campana/mapeoCampanaService'
import type {
  TareaMonitorCampanaData,
  TareaMonitorLineaData,
  TareaMonitorData
} from '@/types/tareas/monitor'

const tabs = [
  { key: 'linea', label: 'Lineas de negocio', icon: Layers },
  { key: 'campana', label: 'Campañas', icon: Megaphone }
] as const

type TabKey = typeof tabs[number]['key']
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

const lineasOptions = computed(() =>
  Array.from(lineaLabelById.value.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const campanasOptions = computed(() =>
  Array.from(campanaLabelById.value.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const actividadOptions = computed(() =>
  Array.from(actividadLabelById.value.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const estatusOptions = computed(() =>
  Array.from(statusLabelById.value.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

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

function resolveMapeoName(mapeoId: number, type: TabKey) {
  if (!mapeoId) return ''
  if (type === 'campana') {
    return mapeoCampanaNameById.value.get(mapeoId)
      ?? mapeoLineaNameById.value.get(mapeoId)
      ?? `Mapeo ${mapeoId}`
  }
  return mapeoLineaNameById.value.get(mapeoId)
    ?? mapeoCampanaNameById.value.get(mapeoId)
    ?? `Mapeo ${mapeoId}`
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
  if (code === 'EJC') return 'bg-blue-50 text-[#00357F] border border-blue-200'
  if (code === 'CMP') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (code === 'ERR') return 'bg-red-50 text-[#AD0A0A] border border-red-200'
  if (code === 'BLQ') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (code === 'CNC') return 'bg-slate-50 text-slate-500 border border-slate-200'
  return 'bg-slate-50 text-slate-600 border border-slate-200'
}

function toggleFilter(key: string) {
  openFilter.value = openFilter.value === key ? null : key
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
      nombreMapeo: resolveMapeoName(mapeoId, 'linea')
    }
  })
  tareasMonitorCampana.value = campana.map(row => {
    const mapeoId = Number(row.idABCConfigMapeo ?? 0)
    return {
      ...row,
      nombreMapeo: resolveMapeoName(mapeoId, 'campana')
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
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="openFilter = null">
    <div class="max-w-7xl mx-auto space-y-4">
      <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
            <Activity class="w-6 h-6" />
            Monitoreo de Tareas
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Vista operativa tipo administrador de tareas (solo lectura).
          </p>
        </div>

        <div class="bg-white p-1 rounded-lg border border-slate-200 flex">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="handleTabChange(t.key)"
            class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
            :class="activeTab === t.key
              ? 'bg-[#00357F] text-white cursor-pointer'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
          >
            <component :is="t.icon" class="w-4 h-4" />
            {{ t.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-wide text-slate-400">Tareas</p>
            <LayoutGrid class="w-4 h-4 text-slate-400" />
          </div>
          <p class="text-lg font-semibold text-slate-800 tabular-nums">{{ totals.tareas }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-wide text-slate-400">Registros</p>
            <Database class="w-4 h-4 text-slate-400" />
          </div>
          <p class="text-lg font-semibold text-slate-800 tabular-nums">{{ formatNumber(totals.totalRegistros) }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-wide text-slate-400">Procesados</p>
            <Activity class="w-4 h-4 text-slate-400" />
          </div>
          <p class="text-lg font-semibold text-slate-800 tabular-nums">{{ formatNumber(totals.totalProcesados) }}</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
          <div class="flex items-center justify-between">
            <p class="text-[11px] uppercase tracking-wide text-slate-400">Dictaminar Activos</p>
            <Activity class="w-4 h-4 text-slate-400" />
          </div>
          <p class="text-lg font-semibold text-[#00357F] tabular-nums">{{ totals.activos }}</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl overflow-visible shadow-sm">
        <div v-if="isLoading" class="p-6 text-sm text-slate-500">
          Cargando monitoreo...
        </div>

        <div v-else-if="error" class="p-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {{ error }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 font-semibold tracking-wider">
                <th class="text-left px-4 py-3 relative">
                  <FilterDropdown
                    label="Linea"
                    header-label="Filtrar por linea"
                    :options="lineasOptions"
                    v-model="selectedLineas"
                    :open="openFilter === 'linea'"
                    :is-filtered="selectedLineas.length < lineasOptions.length"
                    @toggle="toggleFilter('linea')"
                    @select-all="selectedLineas = lineasOptions.map(o => Number(o.value))"
                  />
                </th>

                <th v-if="activeTab === 'campana'" class="text-left px-4 py-3 relative">
                  <FilterDropdown
                    label="Campaña"
                    header-label="Filtrar por campaña"
                    :options="campanasOptions"
                    v-model="selectedCampanas"
                    :open="openFilter === 'campana'"
                    :is-filtered="selectedCampanas.length < campanasOptions.length"
                    @toggle="toggleFilter('campana')"
                    @select-all="selectedCampanas = campanasOptions.map(o => Number(o.value))"
                  />
                </th>

                <th class="text-left px-4 py-3 relative">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">Nombre de mapeo</span>
                    <button
                      type="button"
                      @click.stop="toggleFilter('search')"
                      :class="openFilter === 'search'
                        ? 'p-2 bg-[#00357F] text-white rounded-md shadow-sm transition-colors'
                        : 'p-2 bg-white text-slate-400 border border-slate-200 rounded-md hover:bg-slate-50 hover:text-[#00357F] transition-colors'"
                      aria-label="Buscar en mapeo"
                      title="Buscar en mapeo"
                    >
                      <Search class="w-4 h-4" :class="openFilter === 'search' ? 'text-white' : 'text-[#00357F]'" />
                    </button>
                  </div>
                  <TableSearch
                    :open="openFilter === 'search'"
                    @search="handleSearch"
                    @toggle="toggleFilter('search')"
                  />
                </th>

                <th class="text-left px-4 py-3 relative">
                  <FilterDropdown
                    label="Actividad"
                    header-label="Filtrar por actividad"
                    :options="actividadOptions"
                    v-model="selectedActividades"
                    :open="openFilter === 'actividad'"
                    :is-filtered="selectedActividades.length < actividadOptions.length"
                    @toggle="toggleFilter('actividad')"
                    @select-all="selectedActividades = actividadOptions.map(o => Number(o.value))"
                  />
                </th>

                <th class="text-left px-4 py-3 relative">
                  <FilterDropdown
                    label="Estatus"
                    header-label="Filtrar por estatus"
                    :options="estatusOptions"
                    v-model="selectedEstatus"
                    :open="openFilter === 'estatus'"
                    :is-filtered="selectedEstatus.length < estatusOptions.length"
                    @toggle="toggleFilter('estatus')"
                    @select-all="selectedEstatus = estatusOptions.map(o => Number(o.value))"
                  />
                </th>

                <th class="text-left px-4 py-3 relative">
                  <FilterDropdown
                    label="Dictaminar"
                    header-label="Filtrar por dictaminar"
                    :options="dictaminarOptions"
                    v-model="selectedDictaminar"
                    :open="openFilter === 'dictaminar'"
                    :is-filtered="selectedDictaminar.length < 2"
                    :show-select-all="false"
                    menu-width="w-48"
                    @toggle="toggleFilter('dictaminar')"
                  />
                </th>

                <th class="text-left px-4 py-3">Fecha Inicio</th>
                <th class="text-left px-4 py-3">Fecha Fin</th>
                <th class="text-right px-4 py-3">Registros procesados</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(row, index) in paginatedRows"
                :key="`${activeTab}-${row.id}`"
                :class="['hover:bg-blue-50/30 transition-colors', { 'row-new-record-glow': isRowGlowing(row, index) }]"
              >
                <td class="px-4 py-2.5 text-slate-700">{{ getLineaLabel(row) }}</td>
                <td v-if="activeTab === 'campana'" class="px-4 py-2.5 text-slate-700">{{ getCampanaLabel(row) }}</td>
                <td class="px-4 py-2.5 font-medium text-slate-800">{{ row.nombreMapeo || '-' }}</td>
                <td class="px-4 py-2.5 text-slate-700">{{ getActividadLabel(row) }}</td>
                <td class="px-4 py-2.5">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold" :class="getStatusClass(row)">
                    {{ getStatusLabel(row) }}
                  </span>
                </td>
                <td class="px-4 py-2.5">
                  <span class="font-semibold" :class="row.bolActivo ? 'text-[#00357F]' : 'text-slate-500'">
                    {{ row.bolActivo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-slate-600 min-w-[140px]">
                  <div class="inline-flex flex-col rounded-lg border border-blue-100 bg-blue-50/70 px-2.5 py-1.5 leading-tight">
                    <span class="text-xs font-semibold text-slate-700 tabular-nums">{{ formatDateLabel(row.fechaInicio) }}</span>
                    <span class="text-[11px] text-slate-500 tabular-nums">{{ formatTimeLabel(row.fechaInicio) }}</span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-slate-600 min-w-[140px]">
                  <div class="inline-flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 leading-tight">
                    <span class="text-xs font-semibold text-slate-700 tabular-nums">{{ formatDateLabel(row.fechaFin) }}</span>
                    <span class="text-[11px] text-slate-500 tabular-nums">{{ formatTimeLabel(row.fechaFin) }}</span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-right tabular-nums">
                  <span class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-800">
                    {{ formatNumber(row.numeroRegistrosProcesados) }} / {{ formatNumber(row.numeroRegistros) }}
                  </span>
                </td>
              </tr>

              <tr v-if="!filteredRows.length">
                <td :colspan="activeTab === 'campana' ? 9 : 8" class="px-4 py-8 text-center text-slate-500">
                  No hay tareas para mostrar en este monitoreo.
                </td>
              </tr>
            </tbody>
          </table>

          <div class="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Mostrando {{ paginatedRows.length }} de {{ filteredRows.length }} registros</span>
            <div class="flex gap-2 items-center">
              <button
                class="hover:text-[#00357F] disabled:opacity-50"
                :disabled="!canPrevPage"
                @click="prevPage"
              >
                Anterior
              </button>
              <span class="text-[11px] text-slate-400">{{ currentPage }} / {{ totalPages }}</span>
              <button
                class="hover:text-[#00357F] disabled:opacity-50"
                :disabled="!canNextPage"
                @click="nextPage"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
