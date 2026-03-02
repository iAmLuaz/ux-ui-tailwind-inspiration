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
  isStatusToggleLocked: (row: TareaMonitorData) => boolean
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
  (e: 'toggle-status', row: TareaMonitorData): void
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

function getProcessedRatio(row: TareaMonitorData) {
  const total = Number(row.numeroRegistros ?? 0)
  const procesados = Number(row.numeroRegistrosProcesados ?? 0)
  if (!Number.isFinite(total) || total <= 0) return 0
  if (!Number.isFinite(procesados) || procesados <= 0) return 0
  return Math.min(1, Math.max(0, procesados / total))
}

function getProcessedBadgeClass(row: TareaMonitorData) {
  const ratio = getProcessedRatio(row)
  if (ratio >= 1) return 'border-emerald-100 bg-emerald-50/60 text-emerald-700'
  if (ratio >= 0.7) return 'border-blue-100 bg-blue-50/55 text-[#00357F]'
  if (ratio > 0) return 'border-amber-100 bg-amber-50/55 text-amber-700'
  return 'border-slate-100 bg-slate-50/50 text-slate-600'
}

function getProcessedTrackClass(row: TareaMonitorData) {
  const ratio = getProcessedRatio(row)
  if (ratio >= 1) return 'bg-emerald-300'
  if (ratio >= 0.7) return 'bg-blue-300'
  if (ratio > 0) return 'bg-amber-300'
  return 'bg-slate-300'
}

function getGroupKey(row: TareaMonitorData) {
  const campanaSegment = props.activeTab === 'campana'
    ? Number((row as { idABCCatCampana?: number }).idABCCatCampana ?? 0)
    : 0

  return [
    Number(row.idABCCatLineaNegocio ?? 0),
    campanaSegment,
    Number(row.idABCConfigMapeo ?? 0),
    String(row.nombreMapeo ?? '').trim().toLowerCase()
  ].join('|')
}

const rowGroupMeta = computed(() => {
  const counts = new Map<string, number>()
  const firstIndexByGroup = new Map<string, number>()
  const lastIndexByGroup = new Map<string, number>()
  const groupOrderByKey = new Map<string, number>()
  let currentGroupOrder = 0

  props.paginatedRows.forEach((row, index) => {
    const key = getGroupKey(row)
    counts.set(key, (counts.get(key) ?? 0) + 1)
    if (!firstIndexByGroup.has(key)) firstIndexByGroup.set(key, index)
    lastIndexByGroup.set(key, index)
    if (!groupOrderByKey.has(key)) {
      groupOrderByKey.set(key, currentGroupOrder)
      currentGroupOrder += 1
    }
  })

  return props.paginatedRows.map((row, index) => {
    const key = getGroupKey(row)
    const firstIndex = firstIndexByGroup.get(key)
    const lastIndex = lastIndexByGroup.get(key)
    const isFirst = firstIndex === index
    const isLast = lastIndex === index
    const groupOrder = Number(groupOrderByKey.get(key) ?? 0)
    return {
      isFirst,
      isLast,
      rowspan: isFirst ? Number(counts.get(key) ?? 1) : 0,
      isEvenGroup: groupOrder % 2 === 0
    }
  })
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
                <span class="font-semibold">Nombre de ingesta</span>
                <button
                  type="button"
                  @click.stop="emit('toggle-filter', 'search')"
                  :class="openFilter === 'search'
                    ? 'p-2 bg-[#00357F] text-white rounded-md shadow-sm transition-colors'
                    : 'p-2 bg-white text-slate-400 border border-slate-200 rounded-md hover:bg-slate-50 hover:text-[#00357F] transition-colors'"
                  aria-label="Buscar en la ingesta"
                  title="Buscar en la ingesta"
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

            <th class="text-left px-4 py-3">Fecha de inicio</th>
            <th class="text-left px-4 py-3">Fecha de fin</th>
            <th class="text-right px-4 py-3">Registros procesados</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, index) in paginatedRows"
            :key="`${activeTab}-${row.id}`"
            :class="[
              rowGroupMeta[index]?.isEvenGroup ? 'bg-white' : 'bg-slate-50/40',
              rowGroupMeta[index]?.isFirst ? 'border-t-2 border-slate-200' : '',
              rowGroupMeta[index]?.isLast ? 'border-b-2 border-slate-200' : '',
              'hover:bg-blue-50/30 transition-colors',
              { 'row-new-record-glow': isRowGlowing(row, index) }
            ]"
          >
            <td
              v-if="rowGroupMeta[index]?.isFirst"
              :rowspan="rowGroupMeta[index]?.rowspan"
              class="px-4 py-2.5 text-slate-700 align-top bg-slate-100/80 font-semibold"
            >
              {{ getLineaLabel(row) }}
            </td>
            <td
              v-if="activeTab === 'campana' && rowGroupMeta[index]?.isFirst"
              :rowspan="rowGroupMeta[index]?.rowspan"
              class="px-4 py-2.5 text-slate-700 align-top bg-slate-100/80 font-semibold"
            >
              {{ getCampanaLabel(row) }}
            </td>
            <td
              v-if="rowGroupMeta[index]?.isFirst"
              :rowspan="rowGroupMeta[index]?.rowspan"
              class="px-4 py-2.5 font-semibold text-slate-800 align-top bg-blue-50/60"
            >
              {{ row.nombreMapeo || '-' }}
            </td>
            <td class="px-4 py-2.5 text-slate-700">{{ getActividadLabel(row) }}</td>
            <td class="px-4 py-2.5">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold" :class="getStatusClass(row)">
                {{ getStatusLabel(row) }}
              </span>
            </td>
            <td class="px-4 py-2.5">
              <label
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer group select-none"
                :class="row.bolActivo
                  ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'"
              >
                <input
                  type="checkbox"
                  :checked="row.bolActivo"
                  :disabled="isStatusToggleLocked(row)"
                  @change="emit('toggle-status', row)"
                  class="sr-only peer"
                >

                <span
                  class="h-2 w-2 rounded-full transition-colors duration-200 shadow-sm"
                  :class="row.bolActivo ? 'bg-[#00357F]' : 'bg-[#AD0A0A]'"
                ></span>

                <span
                  class="text-xs font-semibold transition-colors duration-200"
                  :class="row.bolActivo ? 'text-[#00357F]' : 'text-slate-500'"
                >
                  {{ row.bolActivo ? 'Activo' : 'Inactivo' }}
                </span>
              </label>
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
              <div class="inline-flex min-w-[170px] flex-col items-end gap-1.5 rounded-lg border px-2.5 py-1.5" :class="getProcessedBadgeClass(row)">
                <span class="text-sm font-semibold">
                  {{ formatNumber(row.numeroRegistrosProcesados) }} / {{ formatNumber(row.numeroRegistros) }}
                </span>
                <div class="h-1.5 w-full rounded-full bg-white/55">
                  <div
                    class="h-1.5 rounded-full transition-all duration-300"
                    :class="getProcessedTrackClass(row)"
                    :style="{ width: `${Math.round(getProcessedRatio(row) * 100)}%` }"
                  ></div>
                </div>
              </div>
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
