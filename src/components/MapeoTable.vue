<script setup lang="ts">
import { Filter, Edit3, Search, Eye } from 'lucide-vue-next'
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
  (e: 'toggleStatus', item: MapeoRow): void
  (e: 'edit', item: MapeoRow): void
  (e: 'selectAllLineas'): void
  (e: 'selectAllCampanas'): void
  (e: 'prevPage'): void
  (e: 'nextPage'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getCampanaLabel = (id?: number) =>
  props.campanasDisponibles.find(x => x.value === id)?.label || (id ?? '-')
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col min-h-[400px] h-[87vh] max-h-[calc(100vh-2rem)]">
    <div class="overflow-x-auto flex-1" style="height: 100%; display: flex; justify-content: space-between; flex-flow: column nowrap;">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 font-semibold tracking-wider">
            <th class="px-4 py-3 w-16">ID</th>
            
            <th class="px-4 py-3 relative w-48">
              <button 
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
                :class="props.openFilter === 'linea' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
                @click.stop="emit('toggleFilter', 'linea')"
              >
                <span>Línea</span>
                <Filter 
                  class="w-3.5 h-3.5 transition-colors" 
                  :class="[
                    props.selectedFilters.lineas.length < props.lineasDisponibles.length ? 'text-[#00357F] fill-blue-100' : 'text-slate-400',
                    props.openFilter === 'linea' ? 'text-[#00357F]' : ''
                  ]" 
                />
              </button>

              <div 
                v-if="props.openFilter === 'linea'" 
                class="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden transform origin-top-left transition-all"
              >
                <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por línea</span>
                  <span class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline" @click="emit('selectAllLineas')">Ver todas</span>
                </div>

                <div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                  <label 
                    v-for="l in props.lineasDisponibles" 
                    :key="l.value" 
                    class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
                  >
                    <div class="relative flex items-center">
                      <input 
                        type="checkbox" 
                        :value="l.value" 
                        v-model="props.selectedFilters.lineas" 
                        class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
                      >
                    </div>
                    <span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
                      {{ l.label }}
                    </span>
                  </label>
                </div>
              </div>
            </th>

            <th v-if="props.activeTab === 'campana'" class="px-4 py-3 relative w-48">
              <button
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
                :class="props.openFilter === 'campana' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
                @click.stop="emit('toggleFilter', 'campana')"
              >
                <span>Campaña</span>
                <Filter
                  class="w-3.5 h-3.5 transition-colors"
                  :class="[
                    props.selectedFilters.campanas.length && props.selectedFilters.campanas.length < props.campanasDisponibles.length
                      ? 'text-[#00357F] fill-blue-100'
                      : 'text-slate-400',
                    props.openFilter === 'campana' ? 'text-[#00357F]' : ''
                  ]"
                />
              </button>

              <div
                v-if="props.openFilter === 'campana'"
                class="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden transform origin-top-left transition-all"
              >
                <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por campaña</span>
                  <span
                    class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline"
                    @click="emit('selectAllCampanas')"
                  >
                    Ver todas
                  </span>
                </div>

                <div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                  <label
                    v-for="c in props.campanasDisponibles"
                    :key="c.value"
                    class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
                  >
                    <div class="relative flex items-center">
                      <input
                        type="checkbox"
                        :value="c.value"
                        v-model="props.selectedFilters.campanas"
                        class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
                      >
                    </div>
                    <span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
                      {{ c.label }}
                    </span>
                  </label>
                </div>
              </div>
            </th>

            <th class="px-4 py-3 text-left">Nombre</th>
            <!-- <th class="px-4 py-3 text-left">Información</th> -->
            
            <th class="px-4 py-3 relative w-36">
              <button 
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
                :class="props.openFilter === 'status' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
                @click.stop="emit('toggleFilter', 'status')"
              >
                <span>Estado</span>
                <Filter 
                  class="w-3.5 h-3.5 transition-colors" 
                  :class="[
                    props.selectedFilters.status.length < 2 ? 'text-[#00357F] fill-blue-100' : 'text-slate-400',
                    props.openFilter === 'status' ? 'text-[#00357F]' : ''
                  ]" 
                />
              </button>

              <div 
                v-if="props.openFilter === 'status'" 
                class="absolute top-full right-0 md:left-0 mt-2 w-48 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
              >
                <div class="px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</span>
                </div>
                
                <div class="p-1.5 space-y-0.5">
                  <label class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none">
                    <input 
                      type="checkbox" 
                      :value="true" 
                      v-model="props.selectedFilters.status" 
                      class="h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer"
                    >
                    <span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">Activos</span>
                  </label>
                  
                  <label class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none">
                    <input 
                      type="checkbox" 
                      :value="false" 
                      v-model="props.selectedFilters.status" 
                      class="h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer"
                    >
                    <span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">Inactivos</span>
                  </label>
                </div>
              </div>
            </th>
            
            <th class="px-4 py-3 text-right w-24">Acciones</th>
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
              <td class="px-4 py-2.5 font-mono text-xs text-slate-400" @dblclick="emit('viewDetails', m)">#{{ m.idABCConfigMapeoLinea }}</td>
              
              <td class="px-4 py-2.5" @dblclick="emit('viewDetails', m)">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {{ props.getLineaLabel(m.idABCCatLineaNegocio) }}
                </span>
              </td>

              <td v-if="props.activeTab === 'campana'" class="px-4 py-2.5 text-slate-600" @dblclick="emit('viewDetails', m)">
                {{ props.isCampanaRow(m) ? getCampanaLabel(m.idABCCatCampana) : '-' }}
              </td>

              <td class="px-4 py-2.5 font-semibold text-slate-700" @dblclick="emit('viewDetails', m)">{{ m.nombre }}</td>

              <!-- <td class="px-4 py-2.5">
                <span class="text-sm text-slate-500">{{ props.isDetailsOpen(m.idABCConfigMapeoLinea) ? 'Abierto' : 'Cerrado' }}</span>
              </td> -->
              
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