<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'
import FilterDropdown from '@/components/FilterDropdown.vue'
import TableSearch from '@/components/TableSearch.vue'
import type { TareaMonitorData } from '@/types/tareas/monitor'

interface NumericOption {
  label: string
  value: number
}

interface BooleanOption {
  label: string
  value: boolean
}

const props = defineProps<{
  activeTab: 'linea' | 'campana'
  isLoading: boolean
  error: string | null
  openFilter: string | null
  lineasOptions: NumericOption[]
  campanasOptions: NumericOption[]
  actividadOptions: NumericOption[]
  estatusOptions: NumericOption[]
  dictaminarOptions: BooleanOption[]
  selectedLineas: number[]
  selectedCampanas: number[]
  selectedActividades: number[]
  selectedEstatus: number[]
  selectedDictaminar: boolean[]
  paginatedRows: TareaMonitorData[]
  filteredRows: TareaMonitorData[]
  currentPage: number
  totalPages: number
  canPrevPage: boolean
  canNextPage: boolean
  isRowGlowing: (row: TareaMonitorData, index: number) => boolean
  getLineaLabel: (row: TareaMonitorData) => string
  getCampanaLabel: (row: TareaMonitorData) => string
  getActividadLabel: (row: TareaMonitorData) => string
  getStatusLabel: (row: TareaMonitorData) => string
  getStatusClass: (row: TareaMonitorData) => string
  formatDateLabel: (value?: string) => string
  formatTimeLabel: (value?: string) => string
  formatNumber: (value?: number) => string
}>()

const emit = defineEmits<{
  (e: 'toggle-filter', value: string): void
  (e: 'update:selectedLineas', value: number[]): void
  (e: 'update:selectedCampanas', value: number[]): void
  (e: 'update:selectedActividades', value: number[]): void
  (e: 'update:selectedEstatus', value: number[]): void
  (e: 'update:selectedDictaminar', value: boolean[]): void
  (e: 'search', value: string): void
  (e: 'prev-page'): void
  (e: 'next-page'): void
}>()

const modelLineas = computed({
  get: () => props.selectedLineas,
  set: (value: number[]) => emit('update:selectedLineas', value)
})

const modelCampanas = computed({
  get: () => props.selectedCampanas,
  set: (value: number[]) => emit('update:selectedCampanas', value)
})

const modelActividades = computed({
  get: () => props.selectedActividades,
  set: (value: number[]) => emit('update:selectedActividades', value)
})

const modelEstatus = computed({
  get: () => props.selectedEstatus,
  set: (value: number[]) => emit('update:selectedEstatus', value)
})

const modelDictaminar = computed({
  get: () => props.selectedDictaminar,
  set: (value: boolean[]) => emit('update:selectedDictaminar', value)
})
</script>

<template>
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
                v-model="modelLineas"
                :open="openFilter === 'linea'"
                :is-filtered="selectedLineas.length < lineasOptions.length"
                @toggle="emit('toggle-filter', 'linea')"
                @select-all="emit('update:selectedLineas', lineasOptions.map(o => Number(o.value)))"
              />
            </th>

            <th v-if="activeTab === 'campana'" class="text-left px-4 py-3 relative">
              <FilterDropdown
                label="Campaña"
                header-label="Filtrar por campaña"
                :options="campanasOptions"
                v-model="modelCampanas"
                :open="openFilter === 'campana'"
                :is-filtered="selectedCampanas.length < campanasOptions.length"
                @toggle="emit('toggle-filter', 'campana')"
                @select-all="emit('update:selectedCampanas', campanasOptions.map(o => Number(o.value)))"
              />
            </th>

            <th class="text-left px-4 py-3 relative">
              <div class="flex items-center gap-2">
                <span class="font-semibold">Nombre de mapeo</span>
                <button
                  type="button"
                  @click.stop="emit('toggle-filter', 'search')"
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
                @search="emit('search', $event)"
                @toggle="emit('toggle-filter', 'search')"
              />
            </th>

            <th class="text-left px-4 py-3 relative">
              <FilterDropdown
                label="Actividad"
                header-label="Filtrar por actividad"
                :options="actividadOptions"
                v-model="modelActividades"
                :open="openFilter === 'actividad'"
                :is-filtered="selectedActividades.length < actividadOptions.length"
                @toggle="emit('toggle-filter', 'actividad')"
                @select-all="emit('update:selectedActividades', actividadOptions.map(o => Number(o.value)))"
              />
            </th>

            <th class="text-left px-4 py-3 relative">
              <FilterDropdown
                label="Estatus"
                header-label="Filtrar por estatus"
                :options="estatusOptions"
                v-model="modelEstatus"
                :open="openFilter === 'estatus'"
                :is-filtered="selectedEstatus.length < estatusOptions.length"
                @toggle="emit('toggle-filter', 'estatus')"
                @select-all="emit('update:selectedEstatus', estatusOptions.map(o => Number(o.value)))"
              />
            </th>

            <th class="text-left px-4 py-3 relative">
              <FilterDropdown
                label="Dictaminar"
                header-label="Filtrar por dictaminar"
                :options="dictaminarOptions"
                v-model="modelDictaminar"
                :open="openFilter === 'dictaminar'"
                :is-filtered="selectedDictaminar.length < 2"
                :show-select-all="false"
                menu-width="w-48"
                @toggle="emit('toggle-filter', 'dictaminar')"
              />
            </th>

            <th class="text-left px-4 py-3">Inicio</th>
            <th class="text-left px-4 py-3">Fin</th>
            <th class="text-right px-4 py-3">Procesados / Total</th>
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
            @click="emit('prev-page')"
          >
            Anterior
          </button>
          <span class="text-[11px] text-slate-400">{{ currentPage }} / {{ totalPages }}</span>
          <button
            class="hover:text-[#00357F] disabled:opacity-50"
            :disabled="!canNextPage"
            @click="emit('next-page')"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
