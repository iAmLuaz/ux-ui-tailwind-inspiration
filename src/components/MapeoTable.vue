<script setup lang="ts">
import { computed } from 'vue'
import { Edit3, Search, Eye, Columns } from 'lucide-vue-next'
import FilterDropdown from './FilterDropdown.vue'
import TableSearch from './TableSearch.vue'
import type { MapeoData, MapeoCampanaData } from '../types/mapeo'

type MapeoRow = MapeoData | MapeoCampanaData

interface Option {
  label: string
  value: number
}

interface SelectedFilters {
  lineas: number[]
  campanas: number[]
  status: boolean[]
}

interface Props {
  activeTab: 'linea' | 'campana'
  lineasDisponibles: Option[]
  campanasDisponibles: Option[]
  selectedFilters: SelectedFilters
  openFilter: string | null
  filteredMapeos: MapeoRow[]
  totalMapeos: number
  currentPage: number
  totalPages: number
  canPrevPage: boolean
  canNextPage: boolean
  isLoading: boolean
  getLineaLabel: (id?: number) => string
  isCampanaRow: (item: MapeoRow) => item is MapeoCampanaData
}

interface Emits {
  (e: 'toggleFilter', column: string): void
  (e: 'viewDetails', item: MapeoRow): void
  (e: 'viewColumnas', item: MapeoRow): void
  (e: 'toggleStatus', item: MapeoRow): void
  (e: 'edit', item: MapeoRow): void
  (e: 'selectAllLineas'): void
  (e: 'selectAllCampanas'): void
  (e: 'prevPage'): void
  (e: 'nextPage'): void
  (e: 'search', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getCampanaLabel = (id?: number) =>
  props.campanasDisponibles.find(x => x.value === id)?.label || (id ?? '-')

const selectedLineas = computed({
  get: () => props.selectedFilters.lineas,
  set: value => {
    props.selectedFilters.lineas = value
  }
})

const selectedCampanas = computed({
  get: () => props.selectedFilters.campanas,
  set: value => {
    props.selectedFilters.campanas = value
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

const thClass = 'px-4 py-3'
const thSmallClass = 'px-4 py-3'
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col  min-h-[400px] h-[87vh] max-h-[calc(100vh-2rem)]">
    <div class="overflow-y-auto overflow-x-auto flex-1" style="height: 100%; display: flex; justify-content: space-between; flex-flow: column nowrap;">
      <table class="w-full text-left border-collapse table-fixed">
        <colgroup>
          <col class="w-[18%]" />
          <col v-if="props.activeTab === 'campana'" class="w-[14%]" />
          <col class="w-[25%]" />
          <col class="w-[12%]" />
          <col class="w-[8%]" />
          <col class="w-[8%]" />
          <col class="w-[8%]" />
        </colgroup>
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 font-semibold tracking-wider">
            
            <th :class="thClass + ' relative'"> 
              <FilterDropdown
                label="Línea"
                header-label="Filtrar por línea"
                :options="props.lineasDisponibles"
                v-model="selectedLineas"
                :open="props.openFilter === 'linea'"
                :is-filtered="selectedLineas.length < props.lineasDisponibles.length"
                @toggle="emit('toggleFilter', 'linea')"
                @select-all="emit('selectAllLineas')"
              />
            </th>
            <th v-if="props.activeTab === 'campana'" :class="thClass + ' relative'">
              <FilterDropdown
                label="Campaña"
                header-label="Filtrar por campaña"
                :options="props.campanasDisponibles"
                v-model="selectedCampanas"
                :open="props.openFilter === 'campana'"
                :is-filtered="selectedCampanas.length < props.campanasDisponibles.length"
                @toggle="emit('toggleFilter', 'campana')"
                @select-all="emit('selectAllCampanas')"
              />
            </th>

            <th :class="thClass + ' text-left relative'">
              <div class="flex items-center gap-2">
                <span class="font-semibold">Nombre de ingesta</span>
                <button
                  @click.stop="emit('toggleFilter', 'search')"
                  :class="props.openFilter === 'search' ? 'p-2 bg-[#00357F] text-white rounded-md shadow-sm transition-colors' : 'p-2 bg-white text-slate-400 border border-slate-200 rounded-md hover:bg-slate-50 hover:text-[#00357F] transition-colors'"
                  aria-label="Buscar en tabla"
                  title="Buscar"
                >
                  <Search class="w-4 h-4 text-[#00357F]" :class="props.openFilter === 'search' ? 'text-white' : 'text-[#00357F]'" />
                </button>
              </div>

              <TableSearch
                :open="props.openFilter === 'search'"
                @search="query => emit('search', query)"
                @toggle="emit('toggleFilter', 'search')"
              />
            </th>

            <th :class="thClass">Columnas</th>
            <th :class="thSmallClass + ' text-center'">Validar</th>
            <th :class="thSmallClass + ' text-center'">Enviar</th>
            <!-- <th class="px-4 py-3 text-left">Información</th> -->
            
            <th :class="thSmallClass + ' relative'">
              <FilterDropdown
                label="Estado"
                header-label="Estado"
                :options="statusOptions"
                v-model="selectedStatus"
                :open="props.openFilter === 'status'"
                :is-filtered="selectedStatus.length < 2"
                :show-select-all="false"
                menu-width="w-48"
                align="right"
                @toggle="emit('toggleFilter', 'status')"
              />
            </th>
            
            <th :class="thClass + ' text-right'">Acciones</th>
          </tr>
        </thead>
      
        <tbody class="divide-y divide-slate-100">
          <tr v-if="props.isLoading">
            <td colspan="100%" class="px-4 py-12">
              <div class="flex flex-col items-center justify-center text-slate-500">
                <div class="w-6 h-6 border-2 border-[#00357F] border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm font-medium">Cargando datos...</span>
              </div>
            </td>
          </tr>

          <tr v-else-if="props.filteredMapeos.length === 0">
            <td colspan="100%" class="px-4 py-12">
              <div class="flex flex-col items-center justify-center text-slate-400">
                <Search class="w-8 h-8 mb-2 opacity-50"/>
                <span class="text-sm">No hay registros.</span>
              </div>
            </td>
          </tr>

          <template v-else v-for="m in props.filteredMapeos" :key="m.idABCConfigMapeoLinea">
            <tr class="hover:bg-blue-50/30 transition-colors text-sm">
              <td class="px-4 py-2.5" @dblclick="emit('viewDetails', m)">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {{ props.getLineaLabel(m.idABCCatLineaNegocio) }}
                </span>
              </td>

              <td v-if="props.activeTab === 'campana'" class="px-4 py-2.5 text-slate-600" @dblclick="emit('viewDetails', m)">
                {{ props.isCampanaRow(m) ? getCampanaLabel(m.idABCCatCampana) : '-' }}
              </td>

              <td class="px-4 py-2.5 font-semibold text-slate-700" @dblclick="emit('viewDetails', m)">{{ m.nombre }}</td>

              <td class="px-4 py-2.5" @dblclick="emit('viewDetails', m)">
                <button @click.stop.prevent="emit('viewColumnas', m)" class="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors">
                  <Columns class="w-4 h-4 mr-1" />
                  {{ typeof (m as any).columnas === 'number' ? (m as any).columnas : (Array.isArray((m as any).columnas) ? (m as any).columnas.length : 0) }}
                </button>
              </td>

              <!-- <td class="px-4 py-2.5">
                <span class="text-sm text-slate-500">{{ props.isDetailsOpen(m.idABCConfigMapeoLinea) ? 'Abierto' : 'Cerrado' }}</span>
              </td> -->
              
              <td class="px-4 py-2.5 text-center">
                <div class="flex justify-center">
                  <input
                    type="checkbox"
                    :checked="(m as any).validar ?? false"
                    disabled
                    class="h-4 w-4 rounded border-slate-300 text-[#00357F] bg-slate-100"
                  />
                </div>
              </td>

              <td class="px-4 py-2.5 text-center">
                <div class="flex justify-center">
                  <input
                    type="checkbox"
                    :checked="(m as any).envio ?? false"
                    disabled
                    class="h-4 w-4 rounded border-slate-300 text-[#00357F] bg-slate-100"
                  />
                </div>
              </td>

              <td class="px-4 py-2.5" @dblclick="emit('viewDetails', m)">
                <label 
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer group select-none"
                  :class="m.bolActivo 
                    ? 'bg-blue-50 border-blue-200 hover:border-blue-300' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'"
                >
                  <input 
                    type="checkbox" 
                    :checked="m.bolActivo" 
                    @change="emit('toggleStatus', m)" 
                    class="sr-only peer"
                  >
                  
                  <span 
                    class="h-2 w-2 rounded-full transition-colors duration-200 shadow-sm"
                    :class="m.bolActivo ? 'bg-[#00357F]' : 'bg-[#AD0A0A]'"
                  ></span>
                  
                  <span 
                    class="text-xs font-semibold transition-colors duration-200"
                    :class="m.bolActivo ? 'text-[#00357F]' : 'text-slate-500'"
                  >
                    {{ m.bolActivo ? 'Activo' : 'Inactivo' }}
                  </span>
                </label>
              </td>
              <td class="px-4 py-2.5 text-right">
                <div class="inline-flex items-center justify-end gap-2">
                  <button
                    @click.stop="emit('viewDetails', m)"
                    @dblclick.stop
                    class="relative p-1.5 text-slate-400 hover:text-[#00357F] hover:bg-blue-50 rounded-md transition-colors cursor-pointer group"
                    aria-label="Ver detalles"
                  >
                    <Eye class="w-4 h-4" />
                    <span class="absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Ver detalles</span>
                  </button>

                  <button
                    @click.stop="emit('edit', m)"
                    @dblclick.stop
                    class="relative p-1.5 text-slate-400 hover:text-[#00357F] hover:bg-blue-50 rounded-md transition-colors cursor-pointer group"
                    aria-label="Editar registro"
                  >
                    <Edit3 class="w-4 h-4" />
                    <span class="absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Modificar</span>
                  </button>
                </div>
              </td>
            </tr>
            
          </template>
        </tbody>
      </table>

      <div class="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center rounded-b-xl">
        <span>Mostrando {{ props.filteredMapeos.length }} de {{ props.totalMapeos }} registros</span>
        <div class="flex gap-2 items-center">
          <button
            class="hover:text-[#00357F] disabled:opacity-50"
            :disabled="!props.canPrevPage"
            @click="emit('prevPage')"
          >
            Anterior
          </button>
          <span class="text-[11px] text-slate-400">{{ props.currentPage }} / {{ props.totalPages }}</span>
          <button
            class="hover:text-[#00357F] disabled:opacity-50"
            :disabled="!props.canNextPage"
            @click="emit('nextPage')"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>