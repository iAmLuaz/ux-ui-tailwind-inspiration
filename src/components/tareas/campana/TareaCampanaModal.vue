<script setup lang="ts">
import { ref, watch, computed, defineComponent, h } from 'vue'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'

interface Option {
  label: string
  value: number | string
}

interface ScheduleSlot {
  dia: string
  hora: string
}

export interface TareaCampanaFormData {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  ingesta: string
  carga: string
  ejecucionIngesta: string
  diaIngesta: string
  horaIngesta: string
  cargaSlots?: ScheduleSlot[]
  validacion: string
  ejecucionValidacion: string
  diaValidacion: string
  horaValidacion: string
  validacionSlots?: ScheduleSlot[]
  envio: string
  ejecucionEnvio: string
  diaEnvio: string
  horaEnvio: string
  envioSlots?: ScheduleSlot[]
  idUsuario?: number | ''
}

interface Props {
  show: boolean
  mode: 'add' | 'edit'
  lineasDisponibles: Option[]
  campanasDisponibles: Option[]
  mapeosCampana: MapeoCampanaData[]
  initialData?: Record<string, any> | null
  isLoading?: boolean
}

interface Emits {
  (e: 'save', data: TareaCampanaFormData): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const ejecucionOptions = ['Automatica', 'Manual', 'Hibrida']
const pad2 = (value: number) => String(value).padStart(2, '0')
const formatDateIso = (value: Date) => `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
const todayIso = formatDateIso(new Date())
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
const weekdayToIndex: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6
}
const getNextWeekdayIso = (weekdayIndex: number) => {
  const baseDate = new Date()
  baseDate.setHours(0, 0, 0, 0)
  const currentWeekday = baseDate.getDay()
  const offset = (weekdayIndex - currentWeekday + 7) % 7
  baseDate.setDate(baseDate.getDate() + offset)
  return formatDateIso(baseDate)
}
const normalizeDateInputValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw) return ''

  if (isIsoDate(raw)) return raw

  const isoDateTimeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})T/)
  if (isoDateTimeMatch) {
    const [, year, month, day] = isoDateTimeMatch
    return `${year}-${month}-${day}`
  }

  const ymdMatch = raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
  if (ymdMatch) {
    const [, year, monthRaw, dayRaw] = ymdMatch
    return `${year}-${pad2(Number(monthRaw))}-${pad2(Number(dayRaw))}`
  }

  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (dmyMatch) {
    const [, dayRaw, monthRaw, year] = dmyMatch
    return `${year}-${pad2(Number(monthRaw))}-${pad2(Number(dayRaw))}`
  }

  const weekday = weekdayToIndex[normalizeText(raw)]
  if (weekday !== undefined) {
    return getNextWeekdayIso(weekday)
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateIso(parsed)
  }

  return ''
}
const toDateTimeMs = (date: string, time: string): number | null => {
  if (!isIsoDate(date) || !time) return null
  const [yearRaw, monthRaw, dayRaw] = date.split('-')
  const [hoursRaw, minutesRaw] = time.split(':')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if ([year, month, day, hours, minutes].some(Number.isNaN)) return null
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime()
}
const addMinutes = (date: string, time: string, minutesToAdd: number) => {
  const baseMs = toDateTimeMs(date, time)
  if (baseMs === null) return null
  const result = new Date(baseMs + minutesToAdd * 60_000)
  return {
    date: formatDateIso(result),
    time: `${pad2(result.getHours())}:${pad2(result.getMinutes())}`
  }
}
const buildHoraOptions = () => {
  const result: string[] = []
  for (let hour = 20; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      result.push(`${pad2(hour)}:${pad2(minute)}`)
    }
  }
  for (let hour = 0; hour <= 2; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 2 && minute > 0) continue
      result.push(`${pad2(hour)}:${pad2(minute)}`)
    }
  }
  return result
}
const horaOptions = buildHoraOptions()
const getMapeoLabel = (m: MapeoCampanaData) => m.nombre || m.descripcion || `Mapeo ${m.idABCConfigMapeoLinea}`

const allMapeoOptions = computed(() =>
  props.mapeosCampana.map(m => ({
    label: getMapeoLabel(m),
    value: getMapeoLabel(m),
    idLinea: Number(m.linea?.id ?? m.idABCCatLineaNegocio ?? 0),
    idCampana: Number(m.linea?.campana?.id ?? m.idABCCatCampana ?? 0)
  }))
)

const filteredMapeoOptions = computed(() => {
  const lineaId = Number(formData.value.idABCCatLineaNegocio ?? 0)
  const campanaId = Number(formData.value.idABCCatCampana ?? 0)
  const list = props.mapeosCampana.filter(m => {
    const mLineaId = Number(m.linea?.id ?? m.idABCCatLineaNegocio ?? 0)
    const mCampanaId = Number(m.linea?.campana?.id ?? m.idABCCatCampana ?? 0)
    const matchLinea = lineaId ? mLineaId === lineaId : true
    const matchCampana = campanaId ? mCampanaId === campanaId : true
    return matchLinea && matchCampana
  })
  return list.map(m => ({
    label: getMapeoLabel(m),
    value: getMapeoLabel(m),
    idLinea: Number(m.linea?.id ?? m.idABCCatLineaNegocio ?? 0),
    idCampana: Number(m.linea?.campana?.id ?? m.idABCCatCampana ?? 0)
  }))
})

const displayedMapeoOptions = computed(() => {
  if (isLineaSelected.value || isCampanaSelected.value) {
    return filteredMapeoOptions.value
  }
  return allMapeoOptions.value
})
const displayedMapeoOptionsWithCurrent = computed(() => {
  const current = String(formData.value.ingesta || '').trim()
  if (!current) return displayedMapeoOptions.value
  if (displayedMapeoOptions.value.some(opt => String(opt.value) === current)) return displayedMapeoOptions.value
  return [{ label: current, value: current }, ...displayedMapeoOptions.value]
})

const formData = ref<TareaCampanaFormData>(initializeFormData())
const isValidacionStarted = ref(false)
const isEnvioStarted = ref(false)

const isEditing = computed(() => props.mode === 'edit')
const isLineaSelected = computed(() => Boolean(formData.value.idABCCatLineaNegocio))
const isCampanaSelected = computed(() => Boolean(formData.value.idABCCatCampana))
const isAutoMapped = ref(false)
const isIngestaDisabled = computed(() => isEditing.value || displayedMapeoOptionsWithCurrent.value.length === 0)
const isHeaderLocked = computed(() => isEditing.value || isAutoMapped.value)
const ingestaPlaceholder = computed(() => {
  if (!displayedMapeoOptionsWithCurrent.value.length) {
    return 'Sin mapeos disponibles'
  }
  return 'Seleccione origen de datos...'
})
const ingestaHelper = computed(() => {
  if (!displayedMapeoOptions.value.length) {
    return 'No hay mapeos para esta combinación. Ajusta los filtros o crea un mapeo.'
  }
  if (isAutoMapped.value) {
    return 'Linea y campaña asignadas desde la ingesta seleccionada.'
  }
  if (isLineaSelected.value || isCampanaSelected.value) {
    return 'Los mapeos se filtran según la linea y la campaña seleccionadas.'
  }
  return 'Puedes seleccionar una ingesta primero y se autocompletara la linea y campaña.'
})
const isScheduleComplete = (ejecucion: string, dia: string, hora: string) =>
  Boolean(ejecucion && dia && hora)

const hasCargaConfig = computed(() =>
  (formData.value.cargaSlots?.length ?? 0) > 0 ||
  isScheduleComplete(formData.value.ejecucionIngesta, formData.value.diaIngesta, formData.value.horaIngesta)
)
const hasValidacionConfig = computed(() =>
  (formData.value.validacionSlots?.length ?? 0) > 0 ||
  isScheduleComplete(formData.value.ejecucionValidacion, formData.value.diaValidacion, formData.value.horaValidacion)
)
const hasEnvioConfig = computed(() =>
  (formData.value.envioSlots?.length ?? 0) > 0 ||
  isScheduleComplete(formData.value.ejecucionEnvio, formData.value.diaEnvio, formData.value.horaEnvio)
)
const isValidacionSectionEnabled = computed(() => hasCargaConfig.value && isValidacionStarted.value)
const isEnvioSectionEnabled = computed(() => hasValidacionConfig.value && isEnvioStarted.value)
const canStartValidacion = computed(() => hasCargaConfig.value && !isValidacionStarted.value)
const canStartEnvio = computed(() => hasValidacionConfig.value && isValidacionStarted.value && !isEnvioStarted.value)
const minDiaIngesta = computed(() =>
  isEditing.value ? (formData.value.diaIngesta || todayIso) : todayIso
)
const minDiaValidacion = computed(() => {
  const base = formData.value.diaIngesta || todayIso
  if (isEditing.value && formData.value.diaValidacion) {
    return formData.value.diaValidacion < base ? formData.value.diaValidacion : base
  }
  return base
})
const minDiaEnvio = computed(() => {
  const base = formData.value.diaValidacion || formData.value.diaIngesta || todayIso
  if (isEditing.value && formData.value.diaEnvio) {
    return formData.value.diaEnvio < base ? formData.value.diaEnvio : base
  }
  return base
})
const validacionHoraOptions = computed(() => {
  if (formData.value.diaValidacion && formData.value.diaValidacion === formData.value.diaIngesta && formData.value.horaIngesta) {
    const cargaMs = toDateTimeMs(formData.value.diaIngesta, formData.value.horaIngesta)
    return horaOptions.filter(option => {
      const optionMs = toDateTimeMs(formData.value.diaValidacion, option)
      return optionMs !== null && cargaMs !== null && optionMs > cargaMs
    })
  }
  return horaOptions
})
const envioHoraOptions = computed(() => {
  if (formData.value.diaEnvio && formData.value.diaEnvio === formData.value.diaValidacion && formData.value.horaValidacion) {
    const validacionMs = toDateTimeMs(formData.value.diaValidacion, formData.value.horaValidacion)
    return horaOptions.filter(option => {
      const optionMs = toDateTimeMs(formData.value.diaEnvio, option)
      return optionMs !== null && validacionMs !== null && optionMs > validacionMs
    })
  }
  return horaOptions
})
const scheduleValidationError = computed(() => {
  const cargaDia = formData.value.diaIngesta
  const validacionDia = formData.value.diaValidacion
  const envioDia = formData.value.diaEnvio

  if (!isEditing.value && cargaDia && cargaDia < todayIso) {
    return 'La fecha de carga no puede ser anterior a hoy.'
  }
  if (isValidacionStarted.value && validacionDia && validacionDia < minDiaValidacion.value) {
    return 'La fecha de validación no puede ser anterior a la fecha de carga.'
  }
  if (isEnvioStarted.value && envioDia && envioDia < minDiaEnvio.value) {
    return 'La fecha de envío no puede ser anterior a la fecha de validación.'
  }

  if (isValidacionStarted.value && hasCargaConfig.value && hasValidacionConfig.value) {
    const cargaMs = toDateTimeMs(cargaDia, formData.value.horaIngesta)
    const validacionMs = toDateTimeMs(validacionDia, formData.value.horaValidacion)
    if (cargaMs !== null && validacionMs !== null && validacionMs <= cargaMs) {
      return 'Validación debe programarse después de carga.'
    }
  }

  if (isEnvioStarted.value && hasValidacionConfig.value && hasEnvioConfig.value) {
    const validacionMs = toDateTimeMs(validacionDia, formData.value.horaValidacion)
    const envioMs = toDateTimeMs(envioDia, formData.value.horaEnvio)
    if (validacionMs !== null && envioMs !== null && envioMs <= validacionMs) {
      return 'Envío debe programarse después de validación.'
    }
  }

  return ''
})
const scheduleRecommendationMessages = computed(() => {
  const messages: string[] = []

  if (isValidacionStarted.value && hasCargaConfig.value && hasValidacionConfig.value) {
    const cargaMs = toDateTimeMs(formData.value.diaIngesta, formData.value.horaIngesta)
    const validacionMs = toDateTimeMs(formData.value.diaValidacion, formData.value.horaValidacion)
    if (cargaMs !== null && validacionMs !== null) {
      const diff = validacionMs - cargaMs
      if (diff >= 0 && diff < 60 * 60_000) {
        const suggested = addMinutes(formData.value.diaIngesta, formData.value.horaIngesta, 60)
        if (suggested) {
          messages.push(`Recomendación: programa Validación al menos 1 hora después de Carga (ej. ${suggested.date} a las ${suggested.time}).`)
        }
      }
    }
  }

  if (isEnvioStarted.value && hasValidacionConfig.value && hasEnvioConfig.value) {
    const validacionMs = toDateTimeMs(formData.value.diaValidacion, formData.value.horaValidacion)
    const envioMs = toDateTimeMs(formData.value.diaEnvio, formData.value.horaEnvio)
    if (validacionMs !== null && envioMs !== null) {
      const diff = envioMs - validacionMs
      if (diff >= 0 && diff < 60 * 60_000) {
        const suggested = addMinutes(formData.value.diaValidacion, formData.value.horaValidacion, 60)
        if (suggested) {
          messages.push(`Recomendación: programa Envío al menos 1 hora después de Validación (ej. ${suggested.date} a las ${suggested.time}).`)
        }
      }
    }
  }

  return messages
})
const canSave = computed(() =>
  Boolean(formData.value.ingesta) &&
  hasCargaConfig.value &&
  (!isValidacionStarted.value || hasValidacionConfig.value) &&
  (!isEnvioStarted.value || hasEnvioConfig.value) &&
  !scheduleValidationError.value
)

const syncStartedSectionsFromData = () => {
  isValidacionStarted.value = Boolean(formData.value.diaValidacion || formData.value.horaValidacion)
  isEnvioStarted.value = Boolean(formData.value.diaEnvio || formData.value.horaEnvio)
}

const clearEnvioConfig = () => {
  formData.value.ejecucionEnvio = 'Automatica'
  formData.value.diaEnvio = ''
  formData.value.horaEnvio = ''
  formData.value.envioSlots = []
}

const clearValidacionConfig = () => {
  formData.value.ejecucionValidacion = 'Automatica'
  formData.value.diaValidacion = ''
  formData.value.horaValidacion = ''
  formData.value.validacionSlots = []
  clearEnvioConfig()
}

const startValidacionConfig = () => {
  if (!canStartValidacion.value) return
  isValidacionStarted.value = true
}

const startEnvioConfig = () => {
  if (!canStartEnvio.value) return
  isEnvioStarted.value = true
}

const addScheduleSlot = (kind: 'carga' | 'validacion' | 'envio') => {
  const slot =
    kind === 'carga'
      ? { dia: formData.value.diaIngesta, hora: formData.value.horaIngesta }
      : kind === 'validacion'
        ? { dia: formData.value.diaValidacion, hora: formData.value.horaValidacion }
        : { dia: formData.value.diaEnvio, hora: formData.value.horaEnvio }

  if (!slot.dia || !slot.hora) return

  if (kind === 'carga') {
    const list = formData.value.cargaSlots ?? []
    if (!list.some(item => item.dia === slot.dia && item.hora === slot.hora)) {
      formData.value.cargaSlots = [...list, slot]
    }
  } else if (kind === 'validacion') {
    const list = formData.value.validacionSlots ?? []
    if (!list.some(item => item.dia === slot.dia && item.hora === slot.hora)) {
      formData.value.validacionSlots = [...list, slot]
    }
  } else {
    const list = formData.value.envioSlots ?? []
    if (!list.some(item => item.dia === slot.dia && item.hora === slot.hora)) {
      formData.value.envioSlots = [...list, slot]
    }
  }
}

const removeScheduleSlot = (kind: 'carga' | 'validacion' | 'envio', index: number) => {
  if (kind === 'carga') {
    const list = [...(formData.value.cargaSlots ?? [])]
    list.splice(index, 1)
    formData.value.cargaSlots = list
  } else if (kind === 'validacion') {
    const list = [...(formData.value.validacionSlots ?? [])]
    list.splice(index, 1)
    formData.value.validacionSlots = list
  } else {
    const list = [...(formData.value.envioSlots ?? [])]
    list.splice(index, 1)
    formData.value.envioSlots = list
  }
}

const ConfigField = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    options: {
      type: Array as () => string[],
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h(SearchableSelect, {
          modelValue: props.modelValue || null,
          options: props.options.map(opt => ({ label: opt, value: opt })),
          placeholder: 'Seleccionar',
          disabled: props.disabled,
          required: props.required,
          'onUpdate:modelValue': (value: string | number) => emit('update:modelValue', String(value ?? ''))
        })
      ])
  }
})

const DateField = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    minDate: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h('input', {
          type: 'date',
          value: props.modelValue,
          min: props.minDate || undefined,
          disabled: props.disabled,
          required: props.required,
          class: 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00357F]/20 focus:border-[#00357F] disabled:bg-slate-100 disabled:cursor-not-allowed',
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value)
        })
      ])
  }
})

const SelectField = defineComponent({
  props: {
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array as () => Option[],
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: 'Seleccionar'
    },
    hideLabel: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        props.hideLabel
          ? null
          : h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h(SearchableSelect, {
          modelValue: props.modelValue || null,
          options: props.options,
          placeholder: props.placeholder,
          disabled: props.disabled,
          required: props.required,
          'onUpdate:modelValue': (value: string | number) => emit('update:modelValue', value)
        })
      ])
  }
})
watch(
  () => [props.initialData, props.mode],
  () => {
    formData.value = initializeFormData()
    syncStartedSectionsFromData()
  }
)

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      formData.value = initializeFormData()
      syncStartedSectionsFromData()
    }
  }
)

watch(hasCargaConfig, (ready) => {
  if (!ready) {
    isValidacionStarted.value = false
    isEnvioStarted.value = false
    clearValidacionConfig()
  }
})

watch(hasValidacionConfig, (ready) => {
  if (!ready) {
    isEnvioStarted.value = false
    clearEnvioConfig()
  }
})

watch(
  () => [formData.value.diaValidacion, formData.value.horaValidacion],
  ([dia, hora]) => {
    if (!dia && !hora) {
      isValidacionStarted.value = false
      isEnvioStarted.value = false
      clearEnvioConfig()
    }
  }
)

watch(
  () => [formData.value.diaEnvio, formData.value.horaEnvio],
  ([dia, hora]) => {
    if (!dia && !hora) {
      isEnvioStarted.value = false
    }
  }
)

watch(
  () => formData.value.diaIngesta,
  (dia) => {
    if (!dia) {
      formData.value.horaIngesta = ''
    }
  }
)

watch(
  () => formData.value.diaValidacion,
  (dia) => {
    if (!dia) {
      formData.value.horaValidacion = ''
    }
  }
)

watch(
  () => formData.value.diaEnvio,
  (dia) => {
    if (!dia) {
      formData.value.horaEnvio = ''
    }
  }
)

watch(
  () => [formData.value.diaIngesta, formData.value.diaValidacion, formData.value.diaEnvio],
  () => {
    if (formData.value.diaValidacion && formData.value.diaIngesta && formData.value.diaValidacion < formData.value.diaIngesta) {
      formData.value.diaValidacion = ''
      formData.value.horaValidacion = ''
      formData.value.diaEnvio = ''
      formData.value.horaEnvio = ''
      return
    }

    if (formData.value.diaEnvio && formData.value.diaValidacion && formData.value.diaEnvio < formData.value.diaValidacion) {
      formData.value.diaEnvio = ''
      formData.value.horaEnvio = ''
    }
  }
)

watch(validacionHoraOptions, (options) => {
  if (formData.value.horaValidacion && !options.includes(formData.value.horaValidacion)) {
    formData.value.horaValidacion = ''
  }
})

watch(envioHoraOptions, (options) => {
  if (formData.value.horaEnvio && !options.includes(formData.value.horaEnvio)) {
    formData.value.horaEnvio = ''
  }
})

watch(
  () => [formData.value.idABCCatLineaNegocio, formData.value.idABCCatCampana, props.mapeosCampana],
  () => {
    if (!displayedMapeoOptions.value.some(opt => opt.value === formData.value.ingesta)) {
      if (isEditing.value) return
      formData.value.ingesta = ''
      isAutoMapped.value = false
    }
  }
)

watch(
  () => formData.value.ingesta,
  (value) => {
    if (!value) {
      isAutoMapped.value = false
      return
    }

    const match = allMapeoOptions.value.find(opt => opt.value === value)
    if (match) {
      formData.value.idABCCatLineaNegocio = match.idLinea || ''
      formData.value.idABCCatCampana = match.idCampana || ''
      isAutoMapped.value = !isEditing.value
    }
  }
)

const resetHeaderSelection = () => {
  formData.value.ingesta = ''
  formData.value.idABCCatLineaNegocio = ''
  formData.value.idABCCatCampana = ''
  isAutoMapped.value = false
}

const resetAllForm = () => {
  formData.value = initializeFormData()
  isAutoMapped.value = false
  syncStartedSectionsFromData()
}

function initializeFormData(): TareaCampanaFormData {
  if (props.initialData) {
    const diaIngesta = normalizeDateInputValue(props.initialData.carga?.dia ?? props.initialData.diaIngesta)
    const horaIngesta = String(props.initialData.carga?.hora ?? props.initialData.horaIngesta ?? '')
    const diaValidacion = normalizeDateInputValue(props.initialData.validacion?.dia ?? props.initialData.diaValidacion)
    const horaValidacion = String(props.initialData.validacion?.hora ?? props.initialData.horaValidacion ?? '')
    const diaEnvio = normalizeDateInputValue(props.initialData.envio?.dia ?? props.initialData.diaEnvio)
    const horaEnvio = String(props.initialData.envio?.hora ?? props.initialData.horaEnvio ?? '')

    return {
      idABCCatLineaNegocio: props.initialData.idABCCatLineaNegocio ?? '',
      idABCCatCampana: props.initialData.idABCCatCampana ?? '',
      ingesta: props.initialData.ingesta ?? '',
      carga: 'Carga',
      ejecucionIngesta: props.initialData.carga?.ejecucion ?? 'Automatica',
      diaIngesta,
      horaIngesta,
      cargaSlots: diaIngesta && horaIngesta
        ? [{ dia: diaIngesta, hora: horaIngesta }]
        : [],
      validacion: 'Validacion',
      ejecucionValidacion: props.initialData.validacion?.ejecucion ?? 'Automatica',
      diaValidacion,
      horaValidacion,
      validacionSlots: diaValidacion && horaValidacion
        ? [{ dia: diaValidacion, hora: horaValidacion }]
        : [],
      envio: 'Envio',
      ejecucionEnvio: props.initialData.envio?.ejecucion ?? 'Automatica',
      diaEnvio,
      horaEnvio,
      envioSlots: diaEnvio && horaEnvio
        ? [{ dia: diaEnvio, hora: horaEnvio }]
        : [],
      idUsuario: props.initialData.idUsuario ?? props.initialData.idABCUsuario ?? 1
    }
  }

  return {
    idABCCatLineaNegocio: '',
    idABCCatCampana: '',
    ingesta: '',
    carga: 'Carga',
    ejecucionIngesta: 'Automatica',
    diaIngesta: '',
    horaIngesta: '',
    cargaSlots: [],
    validacion: 'Validacion',
    ejecucionValidacion: 'Automatica',
    diaValidacion: '',
    horaValidacion: '',
    validacionSlots: [],
    envio: 'Envio',
    ejecucionEnvio: 'Automatica',
    diaEnvio: '',
    horaEnvio: '',
    envioSlots: [],
    idUsuario: 1
  }
}

function handleSave() {
  if (!canSave.value) return
  emit('save', formData.value)
}
</script>
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh] ">
      
      <div class="px-5 py-3 bg-[#00357F] border-b border-white/10 flex justify-between items-center shrink-0">
        <h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">
          {{ mode === 'add' ? 'Nuevo Registro' : 'Editar Registro' }}
        </h3>
      </div>

      <form @submit.prevent="handleSave" class="flex flex-col min-h-0 flex-1">
        <div class="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
          <div class="space-y-6">
          
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SelectField
                label="Linea de Negocio"
                v-model="formData.idABCCatLineaNegocio"
                :options="lineasDisponibles"
                required
                :disabled="isHeaderLocked"
                placeholder="Seleccione linea..."
              />

              <SelectField
                label="Campaña"
                v-model="formData.idABCCatCampana"
                :options="campanasDisponibles"
                required
                :disabled="isHeaderLocked"
                placeholder="Seleccione campaña..."
              />

              <div class="md:col-span-2">
                <span class="text-[10px] font-bold text-gray-500 uppercase">Nombre de la ingesta <span class="text-red-500">*</span></span>
                <div class="mt-1 flex items-center gap-2">
                  <div class="flex-1">
                    <SelectField
                      label="Nombre de la ingesta"
                      v-model="formData.ingesta"
                      :options="displayedMapeoOptionsWithCurrent"
                      required
                      :disabled="isIngestaDisabled"
                      :placeholder="ingestaPlaceholder"
                      hide-label
                    />
                  </div>
                  <button
                    type="button"
                    title="Elegir de nuevo"
                    aria-label="Elegir de nuevo"
                    class="shrink-0 h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-[#00357F] bg-[#FFD100]/70 hover:bg-[#FFD100] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="!isAutoMapped || isEditing"
                    @click="resetHeaderSelection"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
                    </svg>
                  </button>
                </div>
                <p class="text-[11px] text-gray-500 mt-1">{{ ingestaHelper }}</p>
              </div>
            </div>
          </div>

          <div class="relative pl-4 md:pl-0">
            <div class="absolute left-4 md:left-[23px] top-4 bottom-10 w-0.5 bg-gray-200 z-0"></div>

            <div class="relative z-10 mb-6">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300"
                  :class="hasCargaConfig ? 'bg-blue-500 text-white' : 'bg-[#00357F] text-white'">
                   <svg v-if="hasCargaConfig" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                   <span v-else class="font-bold text-sm">1</span>
                </div>
                
                <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 group hover:border-[#00357F]/30 transition-all">
                  <h4 class="text-sm font-bold text-[#00357F] uppercase tracking-wide mb-3 flex items-center gap-2">
                    Carga
                    <span v-if="hasCargaConfig" class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Configurado</span>
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ConfigField label="Ejecución" v-model="formData.ejecucionIngesta" :options="ejecucionOptions" required />
                    <DateField label="Día" v-model="formData.diaIngesta" :min-date="minDiaIngesta" required />
                    <ConfigField
                      label="Hora"
                      v-model="formData.horaIngesta"
                      :options="horaOptions"
                      :disabled="!formData.diaIngesta"
                      required
                    />
                  </div>
                  <div class="mt-3 flex items-center justify-between gap-3">
                    <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#00357F]/25 text-[#00357F] hover:bg-[#00357F]/5" @click="addScheduleSlot('carga')">Agregar horario</button>
                    <span class="text-[11px] text-slate-500">{{ (formData.cargaSlots?.length ?? 0) }} horarios agregados</span>
                  </div>
                  <div v-if="formData.cargaSlots?.length" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(slot, index) in formData.cargaSlots" :key="`carga-${slot.dia}-${slot.hora}-${index}`" class="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200">
                      {{ slot.dia }} {{ slot.hora }}
                      <button type="button" class="text-slate-500 hover:text-red-600" @click="removeScheduleSlot('carga', index)">×</button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="relative z-10 mb-4 pl-16">
              <button
                type="button"
                class="px-4 py-2 text-xs font-bold rounded-lg border transition"
                :class="canStartValidacion ? 'text-[#00357F] border-[#00357F]/30 bg-white hover:bg-slate-50' : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'"
                :disabled="!canStartValidacion"
                @click="startValidacionConfig"
              >
                Comenzar configuración de Validación
              </button>
            </div>

            <div class="relative z-10 mb-6 transition-all duration-300" :class="!isValidacionSectionEnabled ? 'opacity-50 grayscale' : 'opacity-100'">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300"
                  :class="hasValidacionConfig ? 'bg-blue-500 text-white' : (isValidacionSectionEnabled ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
                   <svg v-if="hasValidacionConfig" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                   <svg v-else-if="!isValidacionSectionEnabled" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   <span v-else class="font-bold text-sm">2</span>
                </div>

                <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                  <div v-if="!isValidacionSectionEnabled" class="absolute inset-0 z-20 cursor-not-allowed bg-white/10"></div> <h4 class="text-sm font-bold text-[#00357F] uppercase tracking-wide mb-3 flex items-center justify-between">
                    <span>Validación</span>
                    <span v-if="!isValidacionSectionEnabled" class="text-[10px] text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded">Inicia con el botón</span>
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ConfigField label="Ejecución" v-model="formData.ejecucionValidacion" :options="ejecucionOptions" :disabled="!isValidacionSectionEnabled" required />
                    <DateField label="Día" v-model="formData.diaValidacion" :min-date="minDiaValidacion" :disabled="!isValidacionSectionEnabled" required />
                    <ConfigField
                      label="Hora"
                      v-model="formData.horaValidacion"
                      :options="validacionHoraOptions"
                      :disabled="!isValidacionSectionEnabled || !formData.diaValidacion"
                      required
                    />
                  </div>
                  <div class="mt-3 flex items-center justify-between gap-3">
                    <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#00357F]/25 text-[#00357F] hover:bg-[#00357F]/5 disabled:opacity-50" :disabled="!isValidacionSectionEnabled" @click="addScheduleSlot('validacion')">Agregar horario</button>
                    <span class="text-[11px] text-slate-500">{{ (formData.validacionSlots?.length ?? 0) }} horarios agregados</span>
                  </div>
                  <div v-if="formData.validacionSlots?.length" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(slot, index) in formData.validacionSlots" :key="`validacion-${slot.dia}-${slot.hora}-${index}`" class="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200">
                      {{ slot.dia }} {{ slot.hora }}
                      <button type="button" class="text-slate-500 hover:text-red-600" @click="removeScheduleSlot('validacion', index)">×</button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="relative z-10 mb-4 pl-16">
              <button
                type="button"
                class="px-4 py-2 text-xs font-bold rounded-lg border transition"
                :class="canStartEnvio ? 'text-[#00357F] border-[#00357F]/30 bg-white hover:bg-slate-50' : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'"
                :disabled="!canStartEnvio"
                @click="startEnvioConfig"
              >
                Comenzar configuración de Envío
              </button>
            </div>

            <div class="relative z-10 transition-all duration-300" :class="!isEnvioSectionEnabled ? 'opacity-50 grayscale' : 'opacity-100'">
              <div class="flex items-start gap-4">
                 <div class="flex-shrink-0 w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300"
                  :class="hasEnvioConfig ? 'bg-blue-500 text-white' : (isEnvioSectionEnabled ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
                   <svg v-if="hasEnvioConfig" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                   <svg v-else-if="!isEnvioSectionEnabled" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   <span v-else class="font-bold text-sm">3</span>
                </div>

                <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
                  <div v-if="!isEnvioSectionEnabled" class="absolute inset-0 z-20 cursor-not-allowed bg-white/10"></div>
                  
                  <h4 class="text-sm font-bold text-[#00357F] uppercase tracking-wide mb-3 flex items-center justify-between">
                    <span>Envío</span>
                    <span v-if="!isEnvioSectionEnabled" class="text-[10px] text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded">Inicia con el botón</span>
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ConfigField label="Ejecución" v-model="formData.ejecucionEnvio" :options="ejecucionOptions" :disabled="!isEnvioSectionEnabled" required />
                    <DateField label="Día" v-model="formData.diaEnvio" :min-date="minDiaEnvio" :disabled="!isEnvioSectionEnabled" required />
                    <ConfigField
                      label="Hora"
                      v-model="formData.horaEnvio"
                      :options="envioHoraOptions"
                      :disabled="!isEnvioSectionEnabled || !formData.diaEnvio"
                      required
                    />
                  </div>
                  <div class="mt-3 flex items-center justify-between gap-3">
                    <button type="button" class="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#00357F]/25 text-[#00357F] hover:bg-[#00357F]/5 disabled:opacity-50" :disabled="!isEnvioSectionEnabled" @click="addScheduleSlot('envio')">Agregar horario</button>
                    <span class="text-[11px] text-slate-500">{{ (formData.envioSlots?.length ?? 0) }} horarios agregados</span>
                  </div>
                  <div v-if="formData.envioSlots?.length" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(slot, index) in formData.envioSlots" :key="`envio-${slot.dia}-${slot.hora}-${index}`" class="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200">
                      {{ slot.dia }} {{ slot.hora }}
                      <button type="button" class="text-slate-500 hover:text-red-600" @click="removeScheduleSlot('envio', index)">×</button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          </div>

          <div v-if="scheduleValidationError || scheduleRecommendationMessages.length" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
            <p v-if="scheduleValidationError" class="font-semibold text-red-700">{{ scheduleValidationError }}</p>
            <p v-for="message in scheduleRecommendationMessages" :key="message">{{ message }}</p>
          </div>
        </div>

        <div class="shrink-0 flex items-center justify-between gap-3 p-4 border-t border-gray-100 bg-white">
          <button
            v-if="mode === 'add'"
            type="button"
            title="Restaurar todo"
            aria-label="Restaurar todo"
            class="h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-slate-500 bg-white border border-slate-200 hover:text-[#00357F] hover:border-[#00357F]/30 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="isLoading"
            @click="resetAllForm"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
            </svg>
          </button>
          <div v-else></div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="px-8 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="$emit('close')"
              :disabled="isLoading"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-8 py-3 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300/50 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-3"
              :disabled="isLoading || isIngestaDisabled || !canSave"
            >
              <svg v-if="isLoading" class="animate-spin h-5 w-5 text-[#00357F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Guardando configuración...' : 'Guardar' }}</span>
            </button>
          </div>
        </div>
      </form>
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

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
