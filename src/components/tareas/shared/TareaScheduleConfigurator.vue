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
  normalizeWeekdayInputValue,
  toHoraLabel,
  type Option,
  type ScheduleSlot
} from '@/composables/tareas/tareaScheduleUtils'
import { normalizeCatalogId } from '@/composables/tareas/tareaFormUtils'

type CatalogIdValue = number | ''

const normalizeCatalogIdValue = (value: unknown): CatalogIdValue => normalizeCatalogId(value)

export interface TareaScheduleModel {
  carga: string
  ejecucionIngesta: CatalogIdValue
  diaIngesta: CatalogIdValue
  horaIngesta: CatalogIdValue
  cargaSlots?: ScheduleSlot[]
  validacion: string
  ejecucionValidacion: CatalogIdValue
  diaValidacion: CatalogIdValue
  horaValidacion: CatalogIdValue
  validacionSlots?: ScheduleSlot[]
  envio: string
  ejecucionEnvio: CatalogIdValue
  diaEnvio: CatalogIdValue
  horaEnvio: CatalogIdValue
  envioSlots?: ScheduleSlot[]
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
}

export interface TareaToggleSlotPayload {
  kind: 'carga' | 'validacion' | 'envio'
  index: number
  slot: ScheduleSlot
  nextActive: boolean
}

interface Props {
  modelValue: TareaScheduleModel
  mode: 'add' | 'edit'
  dayOptions: Option[]
  hourOptions: Option[]
  executionOptions: Option[]
}

interface Emits {
  (e: 'update:modelValue', value: TareaScheduleModel): void
  (e: 'update:scheduleReady', value: boolean): void
  (e: 'toggle-slot', value: TareaToggleSlotPayload): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasValue = (value: unknown) => String(value ?? '').trim() !== ''
const sameValue = (left: unknown, right: unknown) => String(left ?? '') === String(right ?? '')

const resolveDefaultExecution = (): CatalogIdValue => normalizeCatalogIdValue(props.executionOptions?.[0]?.value)

const dayLabelByValue = computed(() => {
  const map = new Map<string, string>()
  for (const option of props.dayOptions ?? []) {
    const key = String(option?.value ?? '').trim()
    if (!key) continue
    map.set(key, normalizeWeekdayInputValue(option?.label) || String(option?.label ?? ''))
  }
  return map
})

const executionOptions = computed(() => props.executionOptions ?? [])

const hourLabelByValue = computed(() => {
  const map = new Map<string, string>()
  for (const option of props.hourOptions ?? []) {
    const key = String(option?.value ?? '').trim()
    if (!key) continue
    map.set(key, toHoraLabel(option?.label))
  }
  return map
})

const toDayLabel = (value: unknown) => dayLabelByValue.value.get(String(value ?? '').trim()) || ''
const toHourLabel = (value: unknown) => hourLabelByValue.value.get(String(value ?? '').trim()) || ''

const validDayOptions = computed(() =>
  (props.dayOptions ?? []).filter(option => getWeekdayOrder(normalizeWeekdayInputValue(option?.label)) > 0)
)

const toMinutesOfDay = (value: unknown) => {
  const label = toHoraLabel(value)
  const [hoursRaw, minutesRaw] = String(label ?? '').split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if ([hours, minutes].some(Number.isNaN)) return Number.POSITIVE_INFINITY
  return (hours * 60) + minutes
}

const normalizeScheduleData = (value?: Partial<TareaScheduleModel>): TareaScheduleModel => ({
  carga: value?.carga ?? 'Carga',
  ejecucionIngesta: normalizeCatalogIdValue(value?.ejecucionIngesta ?? resolveDefaultExecution()),
  diaIngesta: normalizeCatalogIdValue(value?.diaIngesta),
  horaIngesta: normalizeCatalogIdValue(value?.horaIngesta),
  cargaSlots: [...(value?.cargaSlots ?? [])],
  validacion: value?.validacion ?? 'Validación',
  ejecucionValidacion: normalizeCatalogIdValue(value?.ejecucionValidacion ?? resolveDefaultExecution()),
  diaValidacion: normalizeCatalogIdValue(value?.diaValidacion),
  horaValidacion: normalizeCatalogIdValue(value?.horaValidacion),
  validacionSlots: [...(value?.validacionSlots ?? [])],
  envio: value?.envio ?? 'Envío',
  ejecucionEnvio: normalizeCatalogIdValue(value?.ejecucionEnvio ?? resolveDefaultExecution()),
  diaEnvio: normalizeCatalogIdValue(value?.diaEnvio),
  horaEnvio: normalizeCatalogIdValue(value?.horaEnvio),
  envioSlots: [...(value?.envioSlots ?? [])],
  horariosDesactivarIds: [...(value?.horariosDesactivarIds ?? [])],
  horariosActivarIds: [...(value?.horariosActivarIds ?? [])]
})

const sortSlots = (slots?: ScheduleSlot[]) =>
  [...(slots ?? [])]
    .filter(slot => hasValue(slot?.dia) && hasValue(slot?.hora))
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

const compareSlotsForDisplay = (left: ScheduleSlot, right: ScheduleSlot) => {
  const leftActive = isSlotActive(left) ? 0 : 1
  const rightActive = isSlotActive(right) ? 0 : 1
  if (leftActive !== rightActive) return leftActive - rightActive

  const leftDay = getWeekdayOrder(normalizeWeekdayInputValue(toDayLabel(left?.dia)))
  const rightDay = getWeekdayOrder(normalizeWeekdayInputValue(toDayLabel(right?.dia)))
  if (leftDay !== rightDay) return leftDay - rightDay

  const leftMinutes = toMinutesOfDay(left?.hora)
  const rightMinutes = toMinutesOfDay(right?.hora)
  if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes

  return 0
}

const sortSlotsForDisplay = (slots?: ScheduleSlot[]) => [...(slots ?? [])].sort(compareSlotsForDisplay)

const getSlotsByKind = (kind: 'carga' | 'validacion' | 'envio') =>
  kind === 'carga'
    ? localData.value.cargaSlots ?? []
    : kind === 'validacion'
      ? localData.value.validacionSlots ?? []
      : localData.value.envioSlots ?? []

const cargaSlotsSorted = computed(() => sortSlotsForDisplay(localData.value.cargaSlots))
const validacionSlotsSorted = computed(() => sortSlotsForDisplay(localData.value.validacionSlots))
const envioSlotsSorted = computed(() => sortSlotsForDisplay(localData.value.envioSlots))

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

const primaryCargaSlot = computed(() => cargaSlotsSorted.value.find(isSlotActive) ?? null)
const primaryValidacionSlot = computed(() => validacionSlotsSorted.value.find(isSlotActive) ?? null)
const primaryEnvioSlot = computed(() => envioSlotsSorted.value.find(isSlotActive) ?? null)

const toSlotSchedule = (slot?: ScheduleSlot | null) => {
  if (!slot) return null
  const day = normalizeWeekdayInputValue(toDayLabel(slot.dia))
  const hour = toHourLabel(slot.hora)
  if (!day || !hour) return null
  return { day, hour }
}

const cargaDayOptions = computed(() => validDayOptions.value)
const validacionDayOptions = computed(() => validDayOptions.value)
const envioDayOptions = computed(() => validDayOptions.value)

const hourOptionsOrdered = computed(() =>
  [...(props.hourOptions ?? [])]
    .filter(option => Boolean(toHourLabel(option?.label) || toHourLabel(option?.value)))
    .sort((left, right) => {
      const leftMinutes = toMinutesOfDay(left?.label)
      const rightMinutes = toMinutesOfDay(right?.label)
      return leftMinutes - rightMinutes
    })
)

const getTakenHoursByDay = (selectedDay: CatalogIdValue) => {
  const dayKey = String(selectedDay ?? '').trim()
  if (!dayKey) return new Set<string>()

  const allSlots = [
    ...(localData.value.cargaSlots ?? []),
    ...(localData.value.validacionSlots ?? []),
    ...(localData.value.envioSlots ?? [])
  ]

  return new Set(
    allSlots
      .filter(slot => String(slot?.dia ?? '').trim() === dayKey)
      .map(slot => String(slot?.hora ?? '').trim())
      .filter(Boolean)
  )
}

const filterHourOptionsBySelectedDay = (selectedDay: CatalogIdValue) => {
  const taken = getTakenHoursByDay(selectedDay)
  if (!taken.size) return hourOptionsOrdered.value
  return hourOptionsOrdered.value.filter(option => !taken.has(String(option?.value ?? '').trim()))
}

const validacionHoraOptions = computed(() => {
  return filterHourOptionsBySelectedDay(localData.value.diaValidacion)
})

const cargaHoraOptions = computed(() => filterHourOptionsBySelectedDay(localData.value.diaIngesta))

const horaOptionsAmPm = computed(() =>
  cargaHoraOptions.value.map(option => ({ label: formatHourToAmPm(toHourLabel(option?.value)), value: option.value }))
)

const validacionHoraOptionsAmPm = computed(() =>
  validacionHoraOptions.value.map(option => ({ label: formatHourToAmPm(toHourLabel(option?.value)), value: option.value }))
)

const envioHoraOptionsAmPm = computed(() =>
  envioHoraOptions.value.map(option => ({ label: formatHourToAmPm(toHourLabel(option?.value)), value: option.value }))
)
const envioHoraOptions = computed(() => {
  return filterHourOptionsBySelectedDay(localData.value.diaEnvio)
})

const formatSlotDay = (value: unknown) => toDayLabel(value)
const formatSlotHour = (value: unknown) => formatHourToAmPm(toHourLabel(value))

const scheduleValidationError = computed(() => {
  const carga = toSlotSchedule(primaryCargaSlot.value)
  const validacion = toSlotSchedule(primaryValidacionSlot.value)
  const envio = toSlotSchedule(primaryEnvioSlot.value)

  if (validacion && carga && getWeekdayOrder(validacion.day) < getWeekdayOrder(carga.day)) {
    return 'El día de validación no puede ser anterior al día de carga.'
  }
  if (envio && validacion && getWeekdayOrder(envio.day) < getWeekdayOrder(validacion.day)) {
    return 'El día de envío no puede ser anterior al día de validación.'
  }

  if (carga && validacion) {
    const delta = compareWeekdayTime(carga.day, carga.hour, validacion.day, validacion.hour)
    if (delta !== null && delta <= 0) {
      return 'Validación debe programarse después de carga.'
    }
  }

  if (validacion && envio) {
    const delta = compareWeekdayTime(validacion.day, validacion.hour, envio.day, envio.hour)
    if (delta !== null && delta <= 0) {
      return 'Envío debe programarse después de validación.'
    }
  }

  return ''
})

const validacionRecommendationMessage = computed(() => {
  const shouldShow =
    isValidacionSectionEnabled.value
    && !hasValidacionConfig.value
    && !hasValue(localData.value.horaValidacion)

  if (!shouldShow) return ''

  const carga = toSlotSchedule(primaryCargaSlot.value)
  if (!carga) {
    return 'Recomendación: programa Validación al menos 1 hora después de Carga.'
  }

  const suggested = addMinutes(carga.day, carga.hour, 60)
  if (!suggested) {
    return 'Recomendación: programa Validación al menos 1 hora después de Carga.'
  }

  return `Recomendación: programa Validación al menos 1 hora después de Carga (ej. ${suggested.date} a las ${formatHourToAmPm(suggested.time)}).`
})

const envioRecommendationMessage = computed(() => {
  const shouldShow =
    isEnvioSectionEnabled.value
    && !hasEnvioConfig.value
    && !hasValue(localData.value.horaEnvio)

  if (!shouldShow) return ''

  const validacion = toSlotSchedule(primaryValidacionSlot.value)
  if (!validacion) {
    return 'Recomendación: programa Envío al menos 1 hora después de Validación.'
  }

  const suggested = addMinutes(validacion.day, validacion.hour, 60)
  if (!suggested) {
    return 'Recomendación: programa Envío al menos 1 hora después de Validación.'
  }

  return `Recomendación: programa Envío al menos 1 hora después de Validación (ej. ${suggested.date} a las ${formatHourToAmPm(suggested.time)}).`
})

const scheduleReady = computed(() =>
  hasCargaConfig.value &&
  !scheduleValidationError.value
)
const duplicateScheduleError = ref('')

const clearEnvioConfig = () => {
  localData.value.ejecucionEnvio = resolveDefaultExecution()
  localData.value.diaEnvio = ''
  localData.value.horaEnvio = ''
  localData.value.envioSlots = []
}

const clearValidacionConfig = () => {
  localData.value.ejecucionValidacion = resolveDefaultExecution()
  localData.value.diaValidacion = ''
  localData.value.horaValidacion = ''
  localData.value.validacionSlots = []
  clearEnvioConfig()
}

const stageLabelByKind: Record<'carga' | 'validacion' | 'envio', string> = {
  carga: 'Carga',
  validacion: 'Validación',
  envio: 'Envío'
}

const hasOverlappingSlot = (kind: 'carga' | 'validacion' | 'envio', slot: ScheduleSlot) => {
  const dayKey = String(slot?.dia ?? '').trim()
  const hourKey = String(slot?.hora ?? '').trim()
  if (!dayKey || !hourKey) return null

  const allKinds: Array<'carga' | 'validacion' | 'envio'> = ['carga', 'validacion', 'envio']
  for (const currentKind of allKinds) {
    const found = getSlotsByKind(currentKind)
      .filter(isSlotActive)
      .find(existing => String(existing?.dia ?? '').trim() === dayKey && String(existing?.hora ?? '').trim() === hourKey)
    if (found) {
      return {
        stage: stageLabelByKind[currentKind],
        sameStage: currentKind === kind
      }
    }
  }

  return null
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
  const overlap = duplicateExists ? { stage: stageLabelByKind[kind], sameStage: true } : hasOverlappingSlot(kind, slot)
  if (overlap) {
    duplicateScheduleError.value = overlap.sameStage
      ? `Ese horario ya existe en ${overlap.stage}.`
      : `Ese horario se traslapa con ${overlap.stage}.`
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

const resolveSlotIndex = (kind: 'carga' | 'validacion' | 'envio', slotToToggle: ScheduleSlot) => {
  const currentList = getSlotsByKind(kind)
  const targetHorarioId = Number(slotToToggle?.horarioId ?? 0)
  if (targetHorarioId > 0) {
    const indexById = currentList.findIndex(slot => Number(slot?.horarioId ?? 0) === targetHorarioId)
    if (indexById >= 0) return indexById
  }

  return currentList.findIndex(slot =>
    String(slot?.dia ?? '') === String(slotToToggle?.dia ?? '')
    && String(slot?.hora ?? '') === String(slotToToggle?.hora ?? '')
  )
}

const removeScheduleSlot = (kind: 'carga' | 'validacion' | 'envio', slotToToggle: ScheduleSlot) => {
  const currentList = getSlotsByKind(kind)
  const index = resolveSlotIndex(kind, slotToToggle)

  if (index < 0) return
  const slot = currentList[index]
  if (!slot) return

  const currentActiveCount = activeSlotsCountByKind(kind)
  if (mustKeepAtLeastOneActive(kind) && isSlotActive(slot) && currentActiveCount <= 1) {
    const etapa = kind === 'carga' ? 'Carga' : 'Validación'
    addToast(`Debe permanecer al menos un horario activo en ${etapa}.`, 'warning', 3000)
    return
  }

  const nextActive = !isSlotActive(slot)
  slot.activo = nextActive

  emit('toggle-slot', {
    kind,
    index,
    slot: { ...slot },
    nextActive
  })
}

const getSlotActionLabel = (slot: ScheduleSlot) => {
  return isSlotActive(slot) ? 'Desactivar' : 'Activar'
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
  { deep: true, flush: 'sync' }
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

    const diaIngesta = normalizeWeekdayInputValue(toDayLabel(localData.value.diaIngesta))
    const diaValidacion = normalizeWeekdayInputValue(toDayLabel(localData.value.diaValidacion))
    const diaEnvio = normalizeWeekdayInputValue(toDayLabel(localData.value.diaEnvio))

    if (diaValidacion && diaIngesta && getWeekdayOrder(diaValidacion) < getWeekdayOrder(diaIngesta)) {
      localData.value.diaValidacion = ''
      localData.value.horaValidacion = ''
      localData.value.diaEnvio = ''
      localData.value.horaEnvio = ''
      return
    }

    if (diaEnvio && diaValidacion && getWeekdayOrder(diaEnvio) < getWeekdayOrder(diaValidacion)) {
      localData.value.diaEnvio = ''
      localData.value.horaEnvio = ''
    }
  }
)

watch(validacionHoraOptions, (options) => {
  if (localData.value.horaValidacion && !options.some(option => sameValue(option.value, localData.value.horaValidacion))) {
    localData.value.horaValidacion = ''
  }
})

watch(envioHoraOptions, (options) => {
  if (localData.value.horaEnvio && !options.some(option => sameValue(option.value, localData.value.horaEnvio))) {
    localData.value.horaEnvio = ''
  }
})

watch(cargaHoraOptions, (options) => {
  if (localData.value.horaIngesta && !options.some(option => sameValue(option.value, localData.value.horaIngesta))) {
    localData.value.horaIngesta = ''
  }
})

watch(cargaDayOptions, (options) => {
  if (localData.value.diaIngesta && !options.some(option => sameValue(option.value, localData.value.diaIngesta))) {
    localData.value.diaIngesta = ''
  }
})

watch(validacionDayOptions, (options) => {
  if (localData.value.diaValidacion && !options.some(option => sameValue(option.value, localData.value.diaValidacion))) {
    localData.value.diaValidacion = ''
  }
})

watch(envioDayOptions, (options) => {
  if (localData.value.diaEnvio && !options.some(option => sameValue(option.value, localData.value.diaEnvio))) {
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
                    <ConfigField label="Ejecución" v-model="localData.ejecucionIngesta" :options="executionOptions" :hide-label="true" required />
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
                    <span v-for="(slot, index) in cargaSlotsSorted" :key="`carga-${slot.dia}-${slot.hora}-${slot.horarioId ?? index}`" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                      :class="isSlotActive(slot)
                        ? (slot.persisted
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200')
                        : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'">
                      {{ formatSlotDay(slot.dia) }} {{ formatSlotHour(slot.hora) }}
                      <button
                        type="button"
                        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
                        :aria-label="getSlotActionLabel(slot)"
                        :title="getSlotActionLabel(slot)"
                        @click="removeScheduleSlot('carga', slot)"
                      >
                        <svg v-if="isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
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
                    <ConfigField label="Ejecución" v-model="localData.ejecucionValidacion" :options="executionOptions" :disabled="!isValidacionSectionEnabled" :hide-label="true" required />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="validacionRecommendationMessage"
              class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              {{ validacionRecommendationMessage }}
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
                    <span v-for="(slot, index) in validacionSlotsSorted" :key="`validacion-${slot.dia}-${slot.hora}-${slot.horarioId ?? index}`" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                      :class="isSlotActive(slot)
                        ? (slot.persisted
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200')
                        : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'">
                      {{ formatSlotDay(slot.dia) }} {{ formatSlotHour(slot.hora) }}
                      <button
                        type="button"
                        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
                        :aria-label="getSlotActionLabel(slot)"
                        :title="getSlotActionLabel(slot)"
                        @click="removeScheduleSlot('validacion', slot)"
                      >
                        <svg v-if="isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
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
                    <ConfigField label="Ejecución" v-model="localData.ejecucionEnvio" :options="executionOptions" :disabled="!isEnvioSectionEnabled" :hide-label="true" required />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="envioRecommendationMessage"
              class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              {{ envioRecommendationMessage }}
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
                    <span v-for="(slot, index) in envioSlotsSorted" :key="`envio-${slot.dia}-${slot.hora}-${slot.horarioId ?? index}`" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
                      :class="isSlotActive(slot)
                        ? (slot.persisted
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200')
                        : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'">
                      {{ formatSlotDay(slot.dia) }} {{ formatSlotHour(slot.hora) }}
                      <button
                        type="button"
                        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
                        :aria-label="getSlotActionLabel(slot)"
                        :title="getSlotActionLabel(slot)"
                        @click="removeScheduleSlot('envio', slot)"
                      >
                        <svg v-if="isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
                          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
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

    <div v-if="scheduleValidationError || duplicateScheduleError" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1 mt-6">
      <p v-if="scheduleValidationError" class="font-semibold text-red-700">{{ scheduleValidationError }}</p>
      <p v-if="duplicateScheduleError" class="font-semibold text-amber-700">{{ duplicateScheduleError }}</p>
    </div>
  </div>
</template>