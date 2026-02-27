import { computed, ref, watch } from 'vue'
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

export interface UseTareaScheduleConfiguratorProps {
  modelValue: TareaScheduleModel
  mode: 'add' | 'edit'
  dayOptions: Option[]
  hourOptions: Option[]
  executionOptions: Option[]
}

interface UseTareaScheduleConfiguratorEmit {
  updateModelValue: (value: TareaScheduleModel) => void
  updateScheduleReady: (value: boolean) => void
  toggleSlot: (value: TareaToggleSlotPayload) => void
}

const hasValue = (value: unknown) => String(value ?? '').trim() !== ''
const sameValue = (left: unknown, right: unknown) => String(left ?? '') === String(right ?? '')

export function useTareaScheduleConfigurator(
  props: UseTareaScheduleConfiguratorProps,
  emit: UseTareaScheduleConfiguratorEmit
) {
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

  const envioHoraOptions = computed(() => {
    return filterHourOptionsBySelectedDay(localData.value.diaEnvio)
  })

  const envioHoraOptionsAmPm = computed(() =>
    envioHoraOptions.value.map(option => ({ label: formatHourToAmPm(toHourLabel(option?.value)), value: option.value }))
  )

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
    hasCargaConfig.value
    && !scheduleValidationError.value
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

    emit.toggleSlot({
      kind,
      index,
      slot: { ...slot },
      nextActive
    })
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
      emit.updateModelValue(normalized)
    },
    { deep: true, flush: 'sync' }
  )

  watch(scheduleReady, (ready) => emit.updateScheduleReady(ready), { immediate: true })

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

  return {
    localData,
    executionOptions,
    cargaSlotsSorted,
    validacionSlotsSorted,
    envioSlotsSorted,
    hasCargaConfig,
    hasValidacionConfig,
    hasEnvioConfig,
    isValidacionSectionEnabled,
    isEnvioSectionEnabled,
    cargaDayOptions,
    validacionDayOptions,
    envioDayOptions,
    horaOptionsAmPm,
    validacionHoraOptionsAmPm,
    envioHoraOptionsAmPm,
    formatSlotDay,
    formatSlotHour,
    addScheduleSlot,
    removeScheduleSlot,
    validacionRecommendationMessage,
    envioRecommendationMessage,
    scheduleValidationError,
    duplicateScheduleError
  }
}
