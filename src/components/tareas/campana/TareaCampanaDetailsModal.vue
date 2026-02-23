<script setup lang="ts">
import { computed } from 'vue'
import {
  formatHourToAmPm,
  getWeekdayOrder,
  normalizeWeekdayInputValue,
  toHoraLabel,
  weekdayById,
  type Option as CatalogOption
} from '@/composables/tareas/tareaScheduleUtils'

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
  carga?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  validacion?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  envio?: { ejecucionId?: number; ejecucion?: string; dia?: string; hora?: string; configurada?: boolean }
  horarios?: HorarioItem[]
  tareasPorTipo?: {
    carga?: { id?: number; idABCConfigTareaCampana?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
    validacion?: { id?: number; idABCConfigTareaCampana?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
    envio?: { id?: number; idABCConfigTareaCampana?: number; ejecucion?: { id?: number }; tipo?: { id?: number } }
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
  item?: TareaCampanaRow | null
  getLineaLabel: (id?: number) => string
  getCampanaLabel: (id?: number) => string
  ejecucionesDisponibles: CatalogOption[]
  horasDisponibles: CatalogOption[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()

const horarios = computed(() => props.item?.horarios ?? [])

type StageKey = 'carga' | 'validacion' | 'envio'

const STAGE_CONFIG: Array<{ key: StageKey; label: string }> = [
  { key: 'carga', label: 'Carga' },
  { key: 'validacion', label: 'Validación' },
  { key: 'envio', label: 'Envío' }
]

const getHorarioActive = (horario: HorarioItem) => horario.activo ?? horario.bolActivo ?? true

const getStageSchedule = (key: StageKey) => {
  return props.item?.[key] ?? {}
}

const executionLabelById = computed(() => {
  return new Map(
    (props.ejecucionesDisponibles ?? [])
      .map(option => [Number(option.value), String(option.label ?? '').trim()] as const)
      .filter(entry => entry[0] > 0 && Boolean(entry[1]))
  )
})

const hourLabelById = computed(() => {
  return new Map(
    (props.horasDisponibles ?? [])
      .map(option => [Number(option.value), toHoraLabel(option.label)] as const)
      .filter(entry => entry[0] > 0 && Boolean(entry[1]))
  )
})

const resolveStageExecutionId = (key: StageKey) => {
  const schedule = getStageSchedule(key)
  return Number(
    schedule?.ejecucionId
    ?? props.item?.tareasPorTipo?.[key]?.ejecucion?.id
    ?? 0
  )
}

const getStageExecution = (key: StageKey) => {
  const executionId = resolveStageExecutionId(key)
  const executionNameFromCatalog = executionLabelById.value.get(executionId)
  if (executionNameFromCatalog) return executionNameFromCatalog
  return String(getStageSchedule(key)?.ejecucion ?? '-').trim() || '-'
}

const normalizeStageToken = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

const resolveStageTypeId = (key: StageKey) =>
  Number(props.item?.tareasPorTipo?.[key]?.tipo?.id ?? 0)

const isHorarioForStage = (horario: HorarioItem, key: StageKey) => {
  const stageTypeId = resolveStageTypeId(key)
  const horarioTypeId = Number(
    horario?.tipoHorario?.id
    ?? (horario as any)?.tipo?.id
    ?? (horario as any)?.idABCCatTipoHorario
    ?? 0
  )

  if (stageTypeId > 0 && horarioTypeId > 0) {
    return horarioTypeId === stageTypeId
  }

  const horarioTypeCode = normalizeStageToken((horario as any)?.tipoHorario?.codigo ?? (horario as any)?.tipo?.codigo)
  if (key === 'carga' && horarioTypeCode === 'CAG') return true
  if (key === 'validacion' && horarioTypeCode === 'VLD') return true
  if (key === 'envio' && horarioTypeCode === 'ENV') return true

  const horarioTypeName = normalizeStageToken(horario?.tipoHorario?.nombre ?? (horario as any)?.tipo?.nombre)
  if (key === 'carga' && horarioTypeName === 'CARGA') return true
  if (key === 'validacion' && horarioTypeName === 'VALIDACION') return true
  if (key === 'envio' && horarioTypeName === 'ENVIO') return true

  if (horarioTypeId > 0) {
    if (key === 'carga' && horarioTypeId === 1) return true
    if (key === 'validacion' && horarioTypeId === 2) return true
    if (key === 'envio' && horarioTypeId === 3) return true
  }

  return false
}

const formatLegacySchedule = (key: StageKey) => {
  const schedule = getStageSchedule(key)
  const day = String(schedule?.dia ?? '').trim()
  const hourRaw = String(schedule?.hora ?? '').trim()
  if (!day || !hourRaw) return ''
  return `${day} · ${formatHourToAmPm(hourRaw)}`
}

type StageHorarioEntry = {
  label: string
  active: boolean
  dayOrder: number
  hourMinutes: number
}

const resolveHorarioDayLabel = (horario: HorarioItem) => {
  const byName = normalizeWeekdayInputValue(horario?.dia?.nombre)
  if (byName) return byName
  const byId = weekdayById[Number(horario?.dia?.id ?? 0)]
  return byId ?? ''
}

const resolveHorarioHourLabel = (horario: HorarioItem) => {
  const byNameRaw = String(horario?.dia?.hora?.nombre ?? horario?.hora?.nombre ?? '').trim()
  const byName = toHoraLabel(byNameRaw)
  if (byName) return byName

  const hourId = Number(horario?.dia?.hora?.id ?? horario?.hora?.id ?? 0)
  const byCatalog = hourLabelById.value.get(hourId)
  if (byCatalog) return byCatalog

  return ''
}

const toHourMinutes = (hourLabel: string) => {
  const [hoursRaw, minutesRaw] = hourLabel.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if ([hours, minutes].some(Number.isNaN)) return Number.POSITIVE_INFINITY
  return (hours * 60) + minutes
}

const toStageHorarioEntry = (horario: HorarioItem): StageHorarioEntry => {
  const day = resolveHorarioDayLabel(horario)
  const hour = resolveHorarioHourLabel(horario)
  const label = [day, hour ? formatHourToAmPm(hour) : ''].filter(Boolean).join(' · ') || '-'

  return {
    label,
    active: getHorarioActive(horario),
    dayOrder: getWeekdayOrder(day),
    hourMinutes: toHourMinutes(hour)
  }
}

const compareStageHorarioEntry = (left: StageHorarioEntry, right: StageHorarioEntry) => {
  const leftInactive = left.active ? 0 : 1
  const rightInactive = right.active ? 0 : 1
  if (leftInactive !== rightInactive) return leftInactive - rightInactive
  if (left.dayOrder !== right.dayOrder) return left.dayOrder - right.dayOrder
  return left.hourMinutes - right.hourMinutes
}

const stageDetails = computed(() => {
  const source = horarios.value

  return STAGE_CONFIG.map(stage => {
    const stageHorarios = source
      .filter(horario => isHorarioForStage(horario, stage.key))
      .map(toStageHorarioEntry)
      .sort(compareStageHorarioEntry)

    if (!stageHorarios.length) {
      const fallback = formatLegacySchedule(stage.key)
      if (fallback) {
        stageHorarios.push({
          label: fallback,
          active: Boolean(props.item?.bolActivo),
          dayOrder: Number.POSITIVE_INFINITY,
          hourMinutes: Number.POSITIVE_INFINITY
        })
      }
    }

    const hasTaskConfigured = Boolean(
      Number(props.item?.idsTarea?.[stage.key] ?? 0)
      || Number(props.item?.tareasPorTipo?.[stage.key]?.idABCConfigTareaCampana ?? 0)
      || Number(props.item?.tareasPorTipo?.[stage.key]?.id ?? 0)
    )

    const hasExecutionConfigured = resolveStageExecutionId(stage.key) > 0
    const hasAnySchedule = stageHorarios.length > 0
    const configured = hasTaskConfigured || hasExecutionConfigured || hasAnySchedule

    return {
      ...stage,
      execution: getStageExecution(stage.key),
      horarios: stageHorarios,
      activeCount: stageHorarios.filter(entry => entry.active).length,
      configured
    }
  }).filter(stage => stage.configured)
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
                      <p class="text-xs text-slate-500 mt-0.5">TIPO DE EJECUCIÓN: <span class="font-semibold text-slate-700">{{ stage.execution }}</span></p>
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
                      :class="horario.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200 opacity-60'"
                    >
                      <span
                        class="h-2.5 w-2.5 rounded-full"
                        :class="horario.active ? 'bg-emerald-500' : 'bg-slate-400'"
                      ></span>
                      {{ horario.label }}
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
