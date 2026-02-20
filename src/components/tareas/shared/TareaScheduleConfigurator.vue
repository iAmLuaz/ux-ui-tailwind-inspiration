<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ConfigField } from '@/components/tareas/shared/tareaFormFields'
import { addToast } from '@/stores/toastStore'
import {
  addMinutes,
  addScheduleSlot as appendScheduleSlot,
  compareWeekdayTime,
  formatHourToAmPm,
  getWeekdayOrder,
  horaOptions,
  removeScheduleSlot as deleteScheduleSlot,
  weekdayOptions,
  type ScheduleSlot,
  type WeekdayValue
} from '@/composables/tareas/tareaScheduleUtils'

export interface TareaScheduleModel {
  carga: string
  ejecucionIngesta: string
  diaIngesta: WeekdayValue
  horaIngesta: string
  cargaSlots?: ScheduleSlot[]
  validacion: string
  ejecucionValidacion: string
  diaValidacion: WeekdayValue
  horaValidacion: string
  validacionSlots?: ScheduleSlot[]
  envio: string
  ejecucionEnvio: string
  diaEnvio: WeekdayValue
  horaEnvio: string
  envioSlots?: ScheduleSlot[]
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
}

interface Props {
  modelValue: TareaScheduleModel
  mode: 'add' | 'edit'
}

interface Emits {
  (e: 'update:modelValue', value: TareaScheduleModel): void
  (e: 'update:scheduleReady', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const ejecucionOptions = ['Automatica', 'Manual', 'Hibrida']

const normalizeScheduleData = (value?: Partial<TareaScheduleModel>): TareaScheduleModel => ({
  carga: value?.carga ?? 'Carga',
  ejecucionIngesta: value?.ejecucionIngesta ?? 'Automatica',
  diaIngesta: value?.diaIngesta ?? '',
  horaIngesta: value?.horaIngesta ?? '',
  cargaSlots: [...(value?.cargaSlots ?? [])],
  validacion: value?.validacion ?? 'Validación',
  ejecucionValidacion: value?.ejecucionValidacion ?? 'Automatica',
  diaValidacion: value?.diaValidacion ?? '',
  horaValidacion: value?.horaValidacion ?? '',
  validacionSlots: [...(value?.validacionSlots ?? [])],
  envio: value?.envio ?? 'Envío',
  ejecucionEnvio: value?.ejecucionEnvio ?? 'Automatica',
  diaEnvio: value?.diaEnvio ?? '',
  horaEnvio: value?.horaEnvio ?? '',
  envioSlots: [...(value?.envioSlots ?? [])],
  horariosDesactivarIds: [...(value?.horariosDesactivarIds ?? [])],
  horariosActivarIds: [...(value?.horariosActivarIds ?? [])]
})

const sortSlots = (slots?: ScheduleSlot[]) =>
  [...(slots ?? [])]
    .filter(slot => Boolean(slot?.dia && slot?.hora))
    .sort((a, b) => `${a.dia}-${a.hora}`.localeCompare(`${b.dia}-${b.hora}`))

const scheduleFingerprint = (value?: Partial<TareaScheduleModel>) => {
  const normalized = normalizeScheduleData(value)
  return JSON.stringify({
    ...normalized,
    cargaSlots: sortSlots(normalized.cargaSlots),
    validacionSlots: sortSlots(normalized.validacionSlots),
    envioSlots: sortSlots(normalized.envioSlots)
  })
}

const isSameScheduleData = (
  left?: Partial<TareaScheduleModel>,
  right?: Partial<TareaScheduleModel>
) => scheduleFingerprint(left) === scheduleFingerprint(right)

const localData = ref<TareaScheduleModel>(normalizeScheduleData(props.modelValue))
const syncingFromParent = ref(false)

const isSlotActive = (slot?: ScheduleSlot) => (slot?.activo ?? true) !== false

const getSlotsByKind = (kind: 'carga' | 'validacion' | 'envio') =>
  kind === 'carga'
    ? localData.value.cargaSlots ?? []
    : kind === 'validacion'
      ? localData.value.validacionSlots ?? []
      : localData.value.envioSlots ?? []

const activeSlotsCountByKind = (kind: 'carga' | 'validacion' | 'envio') =>
  getSlotsByKind(kind).filter(isSlotActive).length

const mustKeepAtLeastOneActive = (kind: 'carga' | 'validacion' | 'envio') => kind === 'carga' || kind === 'validacion'

const cargaSlotsCount = computed(() => (localData.value.cargaSlots ?? []).filter(isSlotActive).length)
const validacionSlotsCount = computed(() => (localData.value.validacionSlots ?? []).filter(isSlotActive).length)
const envioSlotsCount = computed(() => (localData.value.envioSlots ?? []).filter(isSlotActive).length)

const hasCargaConfig = computed(() => cargaSlotsCount.value > 0)
const hasValidacionConfig = computed(() => validacionSlotsCount.value > 0)
const hasEnvioConfig = computed(() => envioSlotsCount.value > 0)

const hasCargaSlots = computed(() => activeSlotsCountByKind('carga') > 0)
const hasValidacionSlots = computed(() => activeSlotsCountByKind('validacion') > 0)

const isValidacionSectionEnabled = computed(() => hasCargaSlots.value)
const isEnvioSectionEnabled = computed(() => hasValidacionSlots.value)

const primaryCargaSlot = computed(() => (localData.value.cargaSlots ?? []).find(isSlotActive) ?? null)
const primaryValidacionSlot = computed(() => (localData.value.validacionSlots ?? []).find(isSlotActive) ?? null)
const primaryEnvioSlot = computed(() => (localData.value.envioSlots ?? []).find(isSlotActive) ?? null)
const getUsedDaysByKind = (kind: 'carga' | 'validacion' | 'envio') =>
  new Set(
    getSlotsByKind(kind)
      .map(slot => String(slot.dia || '').trim())
      .filter(Boolean)
  )

const filterUsedDays = (kind: 'carga' | 'validacion' | 'envio', options: WeekdayValue[]) => {
  const used = getUsedDaysByKind(kind)
  const currentValue =
    kind === 'carga'
      ? localData.value.diaIngesta
      : kind === 'validacion'
        ? localData.value.diaValidacion
        : localData.value.diaEnvio

  return options.filter(option => option === currentValue || !used.has(option))
}

const cargaDayOptions = computed(() => filterUsedDays('carga', weekdayOptions))
const validacionDayOptions = computed(() => filterUsedDays('validacion', weekdayOptions))
const envioDayOptions = computed(() => filterUsedDays('envio', weekdayOptions))

const getUsedHoursByKind = (kind: 'carga' | 'validacion' | 'envio') =>
  new Set(
    getSlotsByKind(kind)
      .filter(isSlotActive)
      .map(slot => String(slot.hora || '').trim())
      .filter(Boolean)
  )

const filterUsedHours = (kind: 'carga' | 'validacion' | 'envio', options: string[]) => {
  const used = getUsedHoursByKind(kind)
  const currentValue =
    kind === 'carga'
      ? localData.value.horaIngesta
      : kind === 'validacion'
        ? localData.value.horaValidacion
        : localData.value.horaEnvio

  return options.filter(option => option === currentValue || !used.has(option))
}

const validacionHoraOptions = computed(() => {
  const cargaBase = primaryCargaSlot.value
  if (cargaBase && localData.value.diaValidacion && localData.value.diaValidacion === cargaBase.dia && cargaBase.hora) {
    const diff = (option: string) => compareWeekdayTime(cargaBase.dia, cargaBase.hora, localData.value.diaValidacion, option)
    const constrained = horaOptions.filter(option => {
      const delta = diff(option)
      return delta !== null && delta > 0
    })
    return filterUsedHours('validacion', constrained)
  }
  return filterUsedHours('validacion', horaOptions)
})

const cargaHoraOptions = computed(() => filterUsedHours('carga', horaOptions))

const horaOptionsAmPm = computed(() =>
  cargaHoraOptions.value.map(option => ({ label: formatHourToAmPm(option), value: option }))
)

const validacionHoraOptionsAmPm = computed(() =>
  validacionHoraOptions.value.map(option => ({ label: formatHourToAmPm(option), value: option }))
)

const envioHoraOptionsAmPm = computed(() =>
  envioHoraOptions.value.map(option => ({ label: formatHourToAmPm(option), value: option }))
)
const envioHoraOptions = computed(() => {
  const validacionBase = primaryValidacionSlot.value
  if (validacionBase && localData.value.diaEnvio && localData.value.diaEnvio === validacionBase.dia && validacionBase.hora) {
    const diff = (option: string) => compareWeekdayTime(validacionBase.dia, validacionBase.hora, localData.value.diaEnvio, option)
    const constrained = horaOptions.filter(option => {
      const delta = diff(option)
      return delta !== null && delta > 0
    })
    return filterUsedHours('envio', constrained)
  }
  return filterUsedHours('envio', horaOptions)
})
const scheduleValidationError = computed(() => {
  const carga = primaryCargaSlot.value
  const validacion = primaryValidacionSlot.value
  const envio = primaryEnvioSlot.value

  if (validacion && carga && getWeekdayOrder(validacion.dia) < getWeekdayOrder(carga.dia)) {
    return 'El día de validación no puede ser anterior al día de carga.'
  }
  if (envio && validacion && getWeekdayOrder(envio.dia) < getWeekdayOrder(validacion.dia)) {
    return 'El día de envío no puede ser anterior al día de validación.'
  }

  if (carga && validacion) {
    const delta = compareWeekdayTime(carga.dia, carga.hora, validacion.dia, validacion.hora)
    if (delta !== null && delta <= 0) {
      return 'Validación debe programarse después de carga.'
    }
  }

  if (validacion && envio) {
    const delta = compareWeekdayTime(validacion.dia, validacion.hora, envio.dia, envio.hora)
    if (delta !== null && delta <= 0) {
      return 'Envío debe programarse después de validación.'
    }
  }

  return ''
})
const scheduleRecommendationMessages = computed(() => {
  const messages: string[] = []
  const carga = primaryCargaSlot.value
  const validacion = primaryValidacionSlot.value
  const envio = primaryEnvioSlot.value

  if (carga && validacion) {
    const diff = compareWeekdayTime(carga.dia, carga.hora, validacion.dia, validacion.hora)
    if (diff !== null && diff >= 0 && diff < 60 * 60_000) {
      const suggested = addMinutes(carga.dia, carga.hora, 60)
      if (suggested) {
        messages.push(`Recomendación: programa Validación al menos 1 hora después de Carga (ej. ${suggested.date} a las ${suggested.time}).`)
      }
    }
  }

  if (validacion && envio) {
    const diff = compareWeekdayTime(validacion.dia, validacion.hora, envio.dia, envio.hora)
    if (diff !== null && diff >= 0 && diff < 60 * 60_000) {
      const suggested = addMinutes(validacion.dia, validacion.hora, 60)
      if (suggested) {
        messages.push(`Recomendación: programa Envío al menos 1 hora después de Validación (ej. ${suggested.date} a las ${suggested.time}).`)
      }
    }
  }

  return messages
})
const scheduleReady = computed(() =>
  hasCargaConfig.value &&
  !scheduleValidationError.value
)
const duplicateScheduleError = ref('')

const clearEnvioConfig = () => {
  localData.value.ejecucionEnvio = 'Automatica'
  localData.value.diaEnvio = ''
  localData.value.horaEnvio = ''
  localData.value.envioSlots = []
}

const clearValidacionConfig = () => {
  localData.value.ejecucionValidacion = 'Automatica'
  localData.value.diaValidacion = ''
  localData.value.horaValidacion = ''
  localData.value.validacionSlots = []
  clearEnvioConfig()
}

const addScheduleSlot = (kind: 'carga' | 'validacion' | 'envio') => {
  const slot =
    kind === 'carga'
      ? { dia: localData.value.diaIngesta, hora: localData.value.horaIngesta }
      : kind === 'validacion'
        ? { dia: localData.value.diaValidacion, hora: localData.value.horaValidacion }
        : { dia: localData.value.diaEnvio, hora: localData.value.horaEnvio }

  const currentSlots =
    kind === 'carga'
      ? localData.value.cargaSlots ?? []
      : kind === 'validacion'
        ? localData.value.validacionSlots ?? []
        : localData.value.envioSlots ?? []

  const duplicateExists = currentSlots.some(existing => existing.dia === slot.dia && existing.hora === slot.hora)
  if (duplicateExists) {
    const etapa = kind === 'carga' ? 'Carga' : kind === 'validacion' ? 'Validación' : 'Envío'
    duplicateScheduleError.value = `Ese horario ya existe en ${etapa}.`
    addToast(duplicateScheduleError.value, 'warning', 3000)
    return
  }

  const duplicateDayExists = currentSlots.some(existing => existing.dia === slot.dia)
  if (duplicateDayExists) {
    const etapa = kind === 'carga' ? 'Carga' : kind === 'validacion' ? 'Validación' : 'Envío'
    duplicateScheduleError.value = `Ese día ya está configurado en ${etapa}.`
    addToast(duplicateScheduleError.value, 'warning', 3000)
    return
  }

  duplicateScheduleError.value = ''

  if (kind === 'carga') {
    localData.value.cargaSlots = appendScheduleSlot(localData.value.cargaSlots, slot)
    localData.value.diaIngesta = ''
    localData.value.horaIngesta = ''
  } else if (kind === 'validacion') {
    localData.value.validacionSlots = appendScheduleSlot(localData.value.validacionSlots, slot)
    localData.value.diaValidacion = ''
    localData.value.horaValidacion = ''
  } else {
    localData.value.envioSlots = appendScheduleSlot(localData.value.envioSlots, slot)
    localData.value.diaEnvio = ''
    localData.value.horaEnvio = ''
  }
}

const removeScheduleSlot = (kind: 'carga' | 'validacion' | 'envio', index: number) => {
  const currentList = getSlotsByKind(kind)

  const slot = currentList[index]
  if (!slot) return

  const currentActiveCount = activeSlotsCountByKind(kind)
  if (mustKeepAtLeastOneActive(kind) && isSlotActive(slot) && currentActiveCount <= 1) {
    const etapa = kind === 'carga' ? 'Carga' : 'Validación'
    addToast(`Debe permanecer al menos un horario activo en ${etapa}.`, 'warning', 3000)
    return
  }

  const isPersistedEditSlot = props.mode === 'edit' && Boolean(slot.persisted && slot.horarioId)
  if (isPersistedEditSlot) {
    const horarioId = Number(slot.horarioId)
    const activateIds = new Set(localData.value.horariosActivarIds ?? [])
    const deactivateIds = new Set(localData.value.horariosDesactivarIds ?? [])

    if (isSlotActive(slot)) {
      slot.activo = false
      activateIds.delete(horarioId)
      deactivateIds.add(horarioId)
    } else {
      slot.activo = true
      deactivateIds.delete(horarioId)
      activateIds.add(horarioId)
    }

    localData.value.horariosActivarIds = Array.from(activateIds)
    localData.value.horariosDesactivarIds = Array.from(deactivateIds)
    return
  }

  if (kind === 'carga') {
    localData.value.cargaSlots = deleteScheduleSlot(localData.value.cargaSlots, index)
  } else if (kind === 'validacion') {
    localData.value.validacionSlots = deleteScheduleSlot(localData.value.validacionSlots, index)
  } else {
    localData.value.envioSlots = deleteScheduleSlot(localData.value.envioSlots, index)
  }
}

const getSlotActionLabel = (slot: ScheduleSlot) => {
  if (slot.persisted && props.mode === 'edit') {
    return isSlotActive(slot) ? 'Desactivar' : 'Activar'
  }
  return 'Eliminar'
}

watch(
  () => props.modelValue,
  (value) => {
    const normalized = normalizeScheduleData(value)
    if (isSameScheduleData(normalized, localData.value)) return
    syncingFromParent.value = true
    localData.value = normalized
    syncingFromParent.value = false
  },
  { deep: true, immediate: true }
)

watch(
  localData,
  (value) => {
    if (syncingFromParent.value) return
    const normalized = normalizeScheduleData(value)
    if (isSameScheduleData(normalized, props.modelValue)) return
    emit('update:modelValue', normalized)
  },
  { deep: true }
)

watch(scheduleReady, (ready) => emit('update:scheduleReady', ready), { immediate: true })

watch(hasCargaSlots, (ready) => {
  if (!ready) {
    clearValidacionConfig()
  }
})

watch(hasValidacionSlots, (ready) => {
  if (!ready) {
    clearEnvioConfig()
  }
})

watch(
  () => localData.value.diaIngesta,
  (dia) => {
    if (!dia) {
      localData.value.horaIngesta = ''
    }
  }
)

watch(
  () => localData.value.diaValidacion,
  (dia) => {
    if (!dia) {
      localData.value.horaValidacion = ''
    }
  }
)

watch(
  () => localData.value.diaEnvio,
  (dia) => {
    if (!dia) {
      localData.value.horaEnvio = ''
    }
  }
)

watch(
  () => [localData.value.diaIngesta, localData.value.diaValidacion, localData.value.diaEnvio],
  () => {
    duplicateScheduleError.value = ''

    if (localData.value.diaValidacion && localData.value.diaIngesta && getWeekdayOrder(localData.value.diaValidacion) < getWeekdayOrder(localData.value.diaIngesta)) {
      localData.value.diaValidacion = ''
      localData.value.horaValidacion = ''
      localData.value.diaEnvio = ''
      localData.value.horaEnvio = ''
      return
    }

    if (localData.value.diaEnvio && localData.value.diaValidacion && getWeekdayOrder(localData.value.diaEnvio) < getWeekdayOrder(localData.value.diaValidacion)) {
      localData.value.diaEnvio = ''
      localData.value.horaEnvio = ''
    }
  }
)

watch(validacionHoraOptions, (options) => {
  if (localData.value.horaValidacion && !options.includes(localData.value.horaValidacion)) {
    localData.value.horaValidacion = ''
  }
})

watch(envioHoraOptions, (options) => {
  if (localData.value.horaEnvio && !options.includes(localData.value.horaEnvio)) {
    localData.value.horaEnvio = ''
  }
})

watch(cargaHoraOptions, (options) => {
  if (localData.value.horaIngesta && !options.includes(localData.value.horaIngesta)) {
    localData.value.horaIngesta = ''
  }
})

watch(cargaDayOptions, (options) => {
  if (localData.value.diaIngesta && !options.includes(localData.value.diaIngesta)) {
    localData.value.diaIngesta = ''
  }
})

watch(validacionDayOptions, (options) => {
  if (localData.value.diaValidacion && !options.includes(localData.value.diaValidacion)) {
    localData.value.diaValidacion = ''
  }
})

watch(envioDayOptions, (options) => {
  if (localData.value.diaEnvio && !options.includes(localData.value.diaEnvio)) {
    localData.value.diaEnvio = ''
  }
})
</script>
<template>
  <div>
    <div class="relative pl-3 md:pl-0">
      <div class="absolute left-3 md:left-[19px] top-3 bottom-8 w-0.5 bg-gray-200 z-0"></div>

      <div class="relative z-10 mb-8">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300 z-10"
            :class="hasCargaConfig ? 'bg-blue-500 text-white' : 'bg-[#00357F] text-white'">
            <svg v-if="hasCargaConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span v-else class="font-bold text-sm">1</span>
          </div>

          <div class="relative flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-[#00357F]/30 transition-all">
            <span v-if="hasCargaConfig" class="absolute -top-2.5 right-4 text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm">Configurado</span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h4 class="text-base font-bold text-[#00357F] uppercase tracking-wide">Carga</h4>
              
                <div class="w-full md:w-[320px]">
                  <div class="flex items-center gap-3">
                  <span class="shrink-0 text-[10px] font-bold text-gray-500 uppercase">Ejecución</span>
                  <div class="flex-1">
                    <ConfigField label="Ejecución" v-model="localData.ejecucionIngesta" :options="ejecucionOptions" :hide-label="true" required />
                  </div>
                  </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-300 bg-white p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios</p>
                <span class="text-xs text-slate-500 font-medium">{{ (localData.cargaSlots?.length ?? 0) }} horarios agregados</span>
              </div>

              <div class="flex flex-col md:flex-row items-end gap-3 mb-3">
                <div class="flex-grow w-full">
                  <ConfigField label="Día" v-model="localData.diaIngesta" :options="cargaDayOptions" required />
                </div>
                <div class="w-full md:w-1/3">
                  <ConfigField
                    label="Hora"
                    v-model="localData.horaIngesta"
                    :options="horaOptionsAmPm"
                    :disabled="!localData.diaIngesta"
                    required
                  />
                </div>
                <div class="w-full md:w-auto flex-shrink-0">
                  <button type="button" 
                    class="group relative h-[42px] w-full md:w-auto px-3 py-2 text-sm font-bold rounded-md border border-[#FFD100] text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-200 mb-[1px] inline-flex items-center justify-center" 
                    :disabled="!localData.diaIngesta || !localData.horaIngesta" 
                    @click="addScheduleSlot('carga')">
                    <span class="text-base leading-none">+</span>
                    <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Agregar horario</span>
                  </button>
                </div>
              </div>

              <div class="min-h-[24px]">
                 <p v-if="!localData.cargaSlots?.length" class="text-[11px] text-slate-400 italic">Agrega al menos un horario para habilitar Validación.</p>
                 
                 <div v-else class="flex flex-wrap gap-2">
                    <span v-for="(slot, index) in localData.cargaSlots" :key="`carga-${slot.dia}-${slot.hora}-${index}`" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                      :class="slot.persisted
                        ? (isSlotActive(slot)
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60')
                        : 'bg-slate-100 text-slate-700 border-slate-200'">
                      {{ slot.dia }} {{ formatHourToAmPm(slot.hora) }}
                      <button
                        type="button"
                        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
                        :aria-label="getSlotActionLabel(slot)"
                        :title="getSlotActionLabel(slot)"
                        @click="removeScheduleSlot('carga', index)"
                      >
                        <svg v-if="slot.persisted && mode === 'edit' && isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else-if="slot.persisted && mode === 'edit'" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                        </svg>
                        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M6 6l8 8M14 6l-8 8" stroke-linecap="round" />
                        </svg>
                        <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">{{ getSlotActionLabel(slot) }}</span>
                      </button>
                    </span>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="relative z-10 mb-8 transition-all duration-300" :class="!isValidacionSectionEnabled ? 'opacity-50 grayscale' : 'opacity-100'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300 z-10"
            :class="hasValidacionConfig ? 'bg-blue-500 text-white' : (isValidacionSectionEnabled ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
            <svg v-if="hasValidacionConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else-if="!isValidacionSectionEnabled" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span v-else class="font-bold text-sm">2</span>
          </div>

          <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
             <div v-if="!isValidacionSectionEnabled" class="absolute inset-0 z-20 cursor-not-allowed bg-white/30"></div>
             <span v-if="hasValidacionConfig" class="absolute -top-2.5 right-4 text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm">Configurado</span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 class="text-base font-bold text-[#00357F] uppercase tracking-wide">Validación</h4>
                <span v-if="!isValidacionSectionEnabled" class="text-[10px] text-slate-500 block mt-1">Se habilita al agregar Carga</span>
              </div>
              <div class="w-full md:w-[320px]">
                <div class="flex items-center gap-3">
                  <span class="shrink-0 text-[10px] font-bold text-gray-500 uppercase">Ejecución</span>
                  <div class="flex-1">
                    <ConfigField label="Ejecución" v-model="localData.ejecucionValidacion" :options="ejecucionOptions" :disabled="!isValidacionSectionEnabled" :hide-label="true" required />
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-300 bg-white p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios</p>
                <span class="text-xs text-slate-500 font-medium">{{ (localData.validacionSlots?.length ?? 0) }} horarios agregados</span>
              </div>

              <div class="flex flex-col md:flex-row items-end gap-3 mb-3">
                <div class="flex-grow w-full">
                   <ConfigField label="Día" v-model="localData.diaValidacion" :options="validacionDayOptions" :disabled="!isValidacionSectionEnabled" required />
                </div>
                <div class="w-full md:w-1/3">
                  <ConfigField
                    label="Hora"
                    v-model="localData.horaValidacion"
                    :options="validacionHoraOptionsAmPm"
                    :disabled="!isValidacionSectionEnabled || !localData.diaValidacion"
                    required
                  />
                </div>
                <div class="w-full md:w-auto flex-shrink-0">
                  <button type="button" 
                    class="group relative h-[42px] w-full md:w-auto px-3 py-2 text-sm font-bold rounded-md border border-[#FFD100] text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-200 mb-[1px] inline-flex items-center justify-center" 
                    :disabled="!isValidacionSectionEnabled || !localData.diaValidacion || !localData.horaValidacion" 
                    @click="addScheduleSlot('validacion')">
                    <span class="text-base leading-none">+</span>
                    <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Agregar horario</span>
                  </button>
                </div>
              </div>

              <div class="min-h-[24px]">
                 <p v-if="!localData.validacionSlots?.length" class="text-[11px] text-slate-400 italic">Agrega al menos un horario para habilitar Envío.</p>
                 <div v-else class="flex flex-wrap gap-2">
                    <span v-for="(slot, index) in localData.validacionSlots" :key="`validacion-${slot.dia}-${slot.hora}-${index}`" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                      :class="slot.persisted
                        ? (isSlotActive(slot)
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60')
                        : 'bg-slate-100 text-slate-700 border-slate-200'">
                      {{ slot.dia }} {{ formatHourToAmPm(slot.hora) }}
                      <button
                        type="button"
                        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
                        :aria-label="getSlotActionLabel(slot)"
                        :title="getSlotActionLabel(slot)"
                        @click="removeScheduleSlot('validacion', index)"
                      >
                        <svg v-if="slot.persisted && mode === 'edit' && isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else-if="slot.persisted && mode === 'edit'" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                        </svg>
                        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M6 6l8 8M14 6l-8 8" stroke-linecap="round" />
                        </svg>
                        <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">{{ getSlotActionLabel(slot) }}</span>
                      </button>
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 transition-all duration-300" :class="!isEnvioSectionEnabled ? 'opacity-50 grayscale' : 'opacity-100'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300 z-10"
            :class="hasEnvioConfig ? 'bg-blue-500 text-white' : (isEnvioSectionEnabled ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
            <svg v-if="hasEnvioConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else-if="!isEnvioSectionEnabled" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span v-else class="font-bold text-sm">3</span>
          </div>

          <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
             <div v-if="!isEnvioSectionEnabled" class="absolute inset-0 z-20 cursor-not-allowed bg-white/30"></div>
             <span v-if="hasEnvioConfig" class="absolute -top-2.5 right-4 text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm">Configurado</span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 class="text-base font-bold text-[#00357F] uppercase tracking-wide">Envío</h4>
                <span v-if="!isEnvioSectionEnabled" class="text-[10px] text-slate-500 block mt-1">Se habilita al agregar Validación</span>
              </div>
              <div class="w-full md:w-[320px]">
                <div class="flex items-center gap-3">
                  <span class="shrink-0 text-[10px] font-bold text-gray-500 uppercase">Ejecución</span>
                  <div class="flex-1">
                    <ConfigField label="Ejecución" v-model="localData.ejecucionEnvio" :options="ejecucionOptions" :disabled="!isEnvioSectionEnabled" :hide-label="true" required />
                  </div>
                </div>
              </div>
            </div>

             <div class="rounded-lg border border-slate-300 bg-white p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios</p>
                <span class="text-xs text-slate-500 font-medium">{{ (localData.envioSlots?.length ?? 0) }} horarios agregados</span>
              </div>

              <div class="flex flex-col md:flex-row items-end gap-3 mb-3">
                <div class="flex-grow w-full">
                  <ConfigField label="Día" v-model="localData.diaEnvio" :options="envioDayOptions" :disabled="!isEnvioSectionEnabled" required />
                </div>
                <div class="w-full md:w-1/3">
                  <ConfigField
                    label="Hora"
                    v-model="localData.horaEnvio"
                    :options="envioHoraOptionsAmPm"
                    :disabled="!isEnvioSectionEnabled || !localData.diaEnvio"
                    required
                  />
                </div>
                <div class="w-full md:w-auto flex-shrink-0">
                  <button type="button" 
                    class="group relative h-[42px] w-full md:w-auto px-3 py-2 text-sm font-bold rounded-md border border-[#FFD100] text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-200 mb-[1px] inline-flex items-center justify-center" 
                    :disabled="!isEnvioSectionEnabled || !localData.diaEnvio || !localData.horaEnvio" 
                    @click="addScheduleSlot('envio')">
                    <span class="text-base leading-none">+</span>
                    <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Agregar horario</span>
                  </button>
                </div>
              </div>

              <div class="min-h-[24px]">
                 <div v-if="localData.envioSlots?.length" class="flex flex-wrap gap-2">
                    <span v-for="(slot, index) in localData.envioSlots" :key="`envio-${slot.dia}-${slot.hora}-${index}`" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                      :class="slot.persisted
                        ? (isSlotActive(slot)
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60')
                        : 'bg-slate-100 text-slate-700 border-slate-200'">
                      {{ slot.dia }} {{ formatHourToAmPm(slot.hora) }}
                      <button
                        type="button"
                        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
                        :aria-label="getSlotActionLabel(slot)"
                        :title="getSlotActionLabel(slot)"
                        @click="removeScheduleSlot('envio', index)"
                      >
                        <svg v-if="slot.persisted && mode === 'edit' && isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else-if="slot.persisted && mode === 'edit'" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                        </svg>
                        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M6 6l8 8M14 6l-8 8" stroke-linecap="round" />
                        </svg>
                        <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">{{ getSlotActionLabel(slot) }}</span>
                      </button>
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="scheduleValidationError || duplicateScheduleError || scheduleRecommendationMessages.length" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1 mt-6">
      <p v-if="scheduleValidationError" class="font-semibold text-red-700">{{ scheduleValidationError }}</p>
      <p v-if="duplicateScheduleError" class="font-semibold text-amber-700">{{ duplicateScheduleError }}</p>
      <p v-for="message in scheduleRecommendationMessages" :key="message">{{ message }}</p>
    </div>
  </div>
</template>