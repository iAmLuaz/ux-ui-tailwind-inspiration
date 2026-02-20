<script setup lang="ts">
import { computed } from 'vue'
import { formatHorarioLabel, formatHourToAmPm } from '@/composables/tareas/tareaScheduleUtils'

interface HorarioItem {
  idABCConfigHorarioTareaCampana?: number
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

interface TareaCampanaRow {
  idABCConfigTareaCampana: number
  idABCCatLineaNegocio: number
  idABCCatCampana: number
  ingesta?: string
  bolActivo: boolean
  carga?: { ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  validacion?: { ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  envio?: { ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  horarios?: HorarioItem[]
  tarea?: {
    tipo?: { id?: number; nombre?: string }
    ejecucion?: { id?: number; nombre?: string }
  }
  fechaCreacion?: string
  fechaUltimaModificacion?: string
}

interface Props {
  show: boolean
  item?: TareaCampanaRow | null
  getLineaLabel: (id?: number) => string
  getCampanaLabel: (id?: number) => string
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()

const horarios = computed(() => props.item?.horarios ?? [])

type StageKey = 'carga' | 'validacion' | 'envio'

const STAGE_CONFIG: Array<{ key: StageKey; id: number; label: string }> = [
  { key: 'carga', id: 1, label: 'Carga' },
  { key: 'validacion', id: 2, label: 'Validación' },
  { key: 'envio', id: 3, label: 'Envío' }
]

const getHorarioActive = (horario: HorarioItem) => horario.activo ?? horario.bolActivo ?? true

const getStageSchedule = (key: StageKey) => {
  return props.item?.[key] ?? {}
}

const getStageExecution = (key: StageKey) => String(getStageSchedule(key)?.ejecucion ?? '-').trim() || '-'

const formatLegacySchedule = (key: StageKey) => {
  const schedule = getStageSchedule(key)
  const day = String(schedule?.dia ?? '').trim()
  const hourRaw = String(schedule?.hora ?? '').trim()
  if (!day || !hourRaw) return ''
  return `${day} · ${formatHourToAmPm(hourRaw)}`
}

const stageDetails = computed(() => {
  const source = horarios.value

  return STAGE_CONFIG.map(stage => {
    const stageHorarios = source
      .filter(horario => Number(horario?.tipoHorario?.id ?? 0) === stage.id)
      .map(horario => ({
        label: formatHorarioLabel(horario),
        active: getHorarioActive(horario)
      }))

    if (!stageHorarios.length) {
      const fallback = formatLegacySchedule(stage.key)
      if (fallback) {
        stageHorarios.push({
          label: fallback,
          active: Boolean(props.item?.bolActivo)
        })
      }
    }

    return {
      ...stage,
      execution: getStageExecution(stage.key),
      horarios: stageHorarios,
      activeCount: stageHorarios.filter(entry => entry.active).length
    }
  })
})

function formatTimestamp(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}
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
      </div>

      <div class="p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
        <div v-if="!item" class="text-sm text-slate-500">Sin información para mostrar.</div>

        <div v-else class="space-y-4 text-sm">
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Línea</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getLineaLabel(item.idABCCatLineaNegocio) }}</p>
          </div>

          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Campaña</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getCampanaLabel(item.idABCCatCampana) }}</p>
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
                <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Tareas y horarios por etapa</p>
                <span class="text-[10px] font-bold text-slate-500">{{ horarios.length }} horarios</span>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="stage in stageDetails"
                  :key="stage.key"
                  class="p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-bold text-slate-700">{{ stage.label }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">Tipo de ejecución: <span class="font-semibold text-slate-700">{{ stage.execution }}</span></p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {{ stage.activeCount }} activos
                    </span>
                  </div>

                  <div v-if="stage.horarios.length" class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="(horario, index) in stage.horarios"
                      :key="`${stage.key}-${index}`"
                      class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
                      :class="horario.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'"
                    >
                      {{ horario.label }}
                      <span class="font-semibold">{{ horario.active ? 'Activo' : 'Inactivo' }}</span>
                    </span>
                  </div>
                  <p v-else class="mt-2 text-xs text-slate-500">Sin horarios configurados.</p>
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
          Cerrar
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
