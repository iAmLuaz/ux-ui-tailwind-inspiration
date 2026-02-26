<script setup lang="ts">
import { type Option as CatalogOption } from '@/composables/tareas/tareaScheduleUtils'
import { useTareaLineaDetails } from '@/composables/tareas/linea/useTareaLineaDetails'

type StageKey = 'carga' | 'validacion' | 'envio'

interface HorarioItem {
  idABCConfigHorarioTareaLinea?: number
  stageKey?: StageKey
  tipoHorario?: {
    id?: number
    nombre?: string
  }
  dia?: {
    id?: number
    nombre?: string
    hora?: {
      id?: number
      nombre?: string
    }
  }
  hora?: {
    id?: number
    nombre?: string
  }
  activo?: boolean
  bolActivo?: boolean
}

interface TareaLineaRow {
  idABCConfigTareaLinea: number
  idABCCatLineaNegocio: number
  ingesta?: string
  bolActivo: boolean
  carga?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  validacion?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  envio?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  horarios?: HorarioItem[]
  tareasPorTipo?: {
    carga?: { id?: number; idABCConfigTareaLinea?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
    validacion?: { id?: number; idABCConfigTareaLinea?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
    envio?: { id?: number; idABCConfigTareaLinea?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
  }
  idsTarea?: { carga?: number; validacion?: number; envio?: number }
  tarea?: {
    tipo?: { id?: number; nombre?: string }
    ejecucion?: { id?: number; nombre?: string }
  }
  fechaCreacion?: string
  fechaUltimaModificacion?: string
}

interface Props {
  show: boolean
  isLoading?: boolean
  item?: TareaLineaRow | null
  getLineaLabel: (id?: number) => string
  ejecucionesDisponibles: CatalogOption[]
  horasDisponibles: CatalogOption[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { formatTimestamp, horarios, stageDetails } = useTareaLineaDetails(props)
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
      <div class="px-4 py-2.5 bg-[#00357F] border-b border-white/10 flex items-center shrink-0">
        <h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">Detalle de Tarea</h3>
        <button
          type="button"
          class="ml-auto h-8 w-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/15 transition-colors"
          @click="emit('close')"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div class="p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
        <div v-if="isLoading" class="text-sm text-slate-500">Cargando detalle...</div>

        <div v-else-if="!item" class="text-sm text-slate-500">Sin información para mostrar.</div>

        <div v-else class="space-y-4 text-sm">
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Línea</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getLineaLabel(item.idABCCatLineaNegocio) }}</p>
          </div>

          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Nombre de la ingesta</span>
            <p class="mt-1 font-semibold text-slate-700">{{ item.ingesta || '-' }}</p>
          </div>

          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estatus</span>
            <p class="mt-1 font-semibold" :class="item.bolActivo ? 'text-[#00357F]' : 'text-slate-500'">
              {{ item.bolActivo ? 'Activo' : 'Inactivo' }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div class="flex items-center justify-between mb-3">
                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Tareas y horarios</p>
                <span class="text-[10px] font-bold text-slate-500">{{ horarios.length }} horarios</span>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="stage in stageDetails"
                  :key="stage.key"
                  class="p-2.5 rounded-lg border"
                  :class="stage.configured ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-100/70 opacity-80'"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-bold" :class="stage.configured ? 'text-slate-700' : 'text-slate-500'">{{ stage.label }}</p>
                      <p class="text-xs mt-0.5" :class="stage.configured ? 'text-slate-500' : 'text-slate-400'">
                        TIPO DE EJECUCIÓN:
                        <span class="font-semibold" :class="stage.configured ? 'text-slate-700' : 'text-slate-500'">
                          {{ stage.configured ? stage.execution : 'No está configurado' }}
                        </span>
                      </p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="stage.configured ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'">
                      {{ stage.configured ? `${stage.activeCount} activos` : 'No configurado' }}
                    </span>
                  </div>

                  <div v-if="stage.horarios.length" class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="(horario, index) in stage.horarios"
                      :key="`${stage.key}-${index}`"
                      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
                      :class="horario.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200 opacity-60'"
                    >
                      <span
                        class="h-2.5 w-2.5 rounded-full"
                        :class="horario.active ? 'bg-emerald-500' : 'bg-slate-400'"
                      ></span>
                      {{ horario.label }}
                    </span>
                  </div>
                  <p v-else class="mt-2 text-xs" :class="stage.configured ? 'text-slate-500' : 'text-slate-400'">
                    {{ stage.configured ? 'Sin horarios configurados.' : 'No está configurado' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Creado</span>
              <p class="mt-1 text-slate-600">{{ formatTimestamp(item.fechaCreacion) }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Modificado</span>
              <p class="mt-1 text-slate-600">{{ formatTimestamp(item.fechaUltimaModificacion) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 flex justify-end gap-3 p-3 border-t border-gray-100 bg-white">
        <button
          type="button"
          class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
          @click="emit('close')"
        >
          Aceptar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>
