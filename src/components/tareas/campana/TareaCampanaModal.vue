<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import { SelectField } from '@/components/tareas/shared/tareaFormFields'
import TareaScheduleConfigurator, {
  type TareaScheduleModel,
  type TareaToggleSlotPayload
} from '@/components/tareas/shared/TareaScheduleConfigurator.vue'
import ModalActionConfirmOverlay from '@/components/shared/ModalActionConfirmOverlay.vue'
import { addToast } from '@/stores/toastStore'
import { tareaCampanaService } from '@/services/tareas/campana/tareaCampanaService'
import {
  type Option,
  type ScheduleSlot
} from '@/composables/tareas/tareaScheduleUtils'
import {
  normalizeCatalogId,
  resolveIdByLabel,
  resolveMapeoIdFromInitialData,
  toScheduleSlotsByType
} from '@/composables/tareas/tareaFormUtils'

export interface TareaCampanaFormData {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  idMapeo?: number | ''
  ingesta: string
  carga: string
  ejecucionIngesta: number | ''
  diaIngesta: number | ''
  horaIngesta: number | ''
  cargaSlots?: ScheduleSlot[]
  validacion: string
  ejecucionValidacion: number | ''
  diaValidacion: number | ''
  horaValidacion: number | ''
  validacionSlots?: ScheduleSlot[]
  envio: string
  ejecucionEnvio: number | ''
  diaEnvio: number | ''
  horaEnvio: number | ''
  envioSlots?: ScheduleSlot[]
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
  idUsuario?: number | ''
}

interface Props {
  show: boolean
  mode: 'add' | 'edit'
  lineasDisponibles: Option[]
  campanasDisponibles: Option[]
  mapeosCampana: MapeoCampanaData[]
  diasDisponibles: Option[]
  horasDisponibles: Option[]
  ejecucionesDisponibles: Option[]
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

const defaultEjecucionId = computed(() => normalizeCatalogId(props.ejecucionesDisponibles?.[0]?.value) || 1)

const getMapeoLabel = (m: MapeoCampanaData) => m.nombre || m.descripcion || `Mapeo ${m.idABCConfigMapeoLinea}`

const allMapeoOptions = computed(() =>
  props.mapeosCampana.map(m => ({
    label: getMapeoLabel(m),
    value: getMapeoLabel(m),
    idMapeo: Number(m.idABCConfigMapeoLinea ?? 0),
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
    idMapeo: Number(m.idABCConfigMapeoLinea ?? 0),
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
const isScheduleReady = ref(false)
const initialFormSnapshot = ref('')
const showActionConfirm = ref(false)
const pendingAction = ref<'save' | 'cancel' | null>(null)
const isPatchingHorario = ref(false)

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
const canSave = computed(() =>
  isScheduleReady.value && Number(formData.value.idMapeo ?? 0) > 0
)
const isDirty = computed(() => serializeFormState(formData.value) !== initialFormSnapshot.value)
const confirmTitle = computed(() => (pendingAction.value === 'save' ? 'Confirmar guardado' : 'Descartar cambios'))
const confirmMessage = computed(() =>
  pendingAction.value === 'save'
    ? '¿Estás seguro de guardar los cambios de este registro?'
    : 'Se detectaron cambios sin guardar. ¿Deseas cancelar y descartar la información modificada?'
)
const confirmText = computed(() => (pendingAction.value === 'save' ? 'Guardar' : 'Descartar'))
const confirmCancelText = computed(() => (pendingAction.value === 'save' ? 'Volver' : 'Seguir editando'))

const scheduleModel = computed<TareaScheduleModel>({
  get: () => ({
    carga: formData.value.carga,
    ejecucionIngesta: formData.value.ejecucionIngesta,
    diaIngesta: formData.value.diaIngesta,
    horaIngesta: formData.value.horaIngesta,
    cargaSlots: formData.value.cargaSlots,
    validacion: formData.value.validacion,
    ejecucionValidacion: formData.value.ejecucionValidacion,
    diaValidacion: formData.value.diaValidacion,
    horaValidacion: formData.value.horaValidacion,
    validacionSlots: formData.value.validacionSlots,
    envio: formData.value.envio,
    ejecucionEnvio: formData.value.ejecucionEnvio,
    diaEnvio: formData.value.diaEnvio,
    horaEnvio: formData.value.horaEnvio,
    envioSlots: formData.value.envioSlots,
    horariosDesactivarIds: formData.value.horariosDesactivarIds,
    horariosActivarIds: formData.value.horariosActivarIds
  }),
  set: (value) => {
    formData.value = {
      ...formData.value,
      ...value
    }
  }
})
watch(
  () => [props.initialData, props.mode],
  () => {
    setInitialFormState()
  }
)

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      setInitialFormState()
    }
  }
)

watch(
  () => [formData.value.idABCCatLineaNegocio, formData.value.idABCCatCampana, props.mapeosCampana],
  () => {
    const currentIngesta = String(formData.value.ingesta ?? '')
    const hasCurrentInOptions = displayedMapeoOptions.value.some(opt => String(opt.value) === currentIngesta)
    if (hasCurrentInOptions || isEditing.value) return

    if (currentIngesta) {
      formData.value.ingesta = ''
      formData.value.idMapeo = ''
    }
    if (isAutoMapped.value) {
      isAutoMapped.value = false
    }
  }
)

watch(
  () => formData.value.ingesta,
  (value) => {
    if (!value) {
      if (isAutoMapped.value) {
        isAutoMapped.value = false
      }
      return
    }

    const match = allMapeoOptions.value.find(opt => opt.value === value)
    if (match) {
      const nextLineaId = match.idLinea || ''
      const nextCampanaId = match.idCampana || ''
      const nextMapeoId = match.idMapeo || ''

      if (formData.value.idABCCatLineaNegocio !== nextLineaId) {
        formData.value.idABCCatLineaNegocio = nextLineaId
      }
      if (formData.value.idABCCatCampana !== nextCampanaId) {
        formData.value.idABCCatCampana = nextCampanaId
      }
      if (formData.value.idMapeo !== nextMapeoId) {
        formData.value.idMapeo = nextMapeoId
      }

      const nextAutoMapped = !isEditing.value
      if (isAutoMapped.value !== nextAutoMapped) {
        isAutoMapped.value = nextAutoMapped
      }
      return
    }

    if (isAutoMapped.value) {
      isAutoMapped.value = false
    }
    if (formData.value.idMapeo) {
      formData.value.idMapeo = ''
    }
  }
)

const resetHeaderSelection = () => {
  formData.value.ingesta = ''
  formData.value.idMapeo = ''
  formData.value.idABCCatLineaNegocio = ''
  formData.value.idABCCatCampana = ''
  isAutoMapped.value = false
}

const resetAllForm = () => {
  formData.value = initializeFormData()
  isAutoMapped.value = false
}

const restoreInitialInformation = () => {
  formData.value = initializeFormData()
  isAutoMapped.value = false
}

const serializeFormState = (value: TareaCampanaFormData) => JSON.stringify(value)

const setInitialFormState = () => {
  formData.value = initializeFormData()
  isAutoMapped.value = false
  initialFormSnapshot.value = serializeFormState(formData.value)
}

const closeActionConfirm = () => {
  showActionConfirm.value = false
  pendingAction.value = null
}

const requestSave = () => {
  if (!canSave.value) return

  if (isEditing.value) {
    pendingAction.value = 'save'
    showActionConfirm.value = true
    return
  }

  emit('save', formData.value)
}

const requestCancel = () => {
  if (isEditing.value && isDirty.value) {
    pendingAction.value = 'cancel'
    showActionConfirm.value = true
    return
  }

  emit('close')
}

const confirmAction = () => {
  if (pendingAction.value === 'save') {
    emit('save', formData.value)
  } else if (pendingAction.value === 'cancel') {
    emit('close')
  }

  closeActionConfirm()
}

const stageTypeByKind = {
  carga: 1,
  validacion: 2,
  envio: 3
} as const

function resolveTaskIdByKind(kind: keyof typeof stageTypeByKind) {
  const fromIds = Number(props.initialData?.idsTarea?.[kind] ?? 0)
  if (fromIds > 0) return fromIds

  const stageTask = props.initialData?.tareasPorTipo?.[kind]
  return Number(
    stageTask?.id
    ?? stageTask?.idABCConfigTareaCampana
    ?? props.initialData?.idABCConfigTareaCampana
    ?? 0
  ) || 0
}

function resolveHorarioIdFromList(slot: ScheduleSlot, horarios: any[], kind: keyof typeof stageTypeByKind) {
  void kind
  const dayId = Number(slot?.dia ?? 0)
  const hourId = Number(slot?.hora ?? 0)

  const found = (Array.isArray(horarios) ? horarios : []).find((item: any) => {
    const itemDayId = Number(item?.dia?.id ?? item?.idABCCatDia ?? 0)
    const itemHourId = Number(item?.dia?.hora?.id ?? item?.hora?.id ?? item?.idABCCatHora ?? 0)
    return itemDayId === dayId && itemHourId === hourId
  })

  return Number(found?.idABCConfigHorarioTareaCampana ?? found?.horarioId ?? found?.id ?? 0) || 0
}

async function handleToggleSlot(payload: TareaToggleSlotPayload) {
  if (!isEditing.value) return
  if (isPatchingHorario.value) return

  const taskId = resolveTaskIdByKind(payload.kind)
  if (!taskId) {
    addToast('No se pudo identificar la tarea para actualizar el horario.', 'warning', 3500)
    return
  }

  let horarioId = Number(payload.slot?.horarioId ?? 0)

  try {
    isPatchingHorario.value = true

    if (!horarioId) {
      const horarios = await tareaCampanaService.getHorariosByTarea(taskId)
      horarioId = resolveHorarioIdFromList(payload.slot, horarios, payload.kind)
    }

    const idUsuario = Number(formData.value.idUsuario ?? props.initialData?.idUsuario ?? props.initialData?.idABCUsuario ?? 1)
    const slotData = {
      dia: Number(payload.slot?.dia ?? 0),
      hora: Number(payload.slot?.hora ?? 0)
    }

    if (payload.nextActive) {
      if (horarioId) {
        payload.slot.horarioId = horarioId
        await tareaCampanaService.patchActivarHorario(taskId, horarioId, idUsuario)
      } else {
        await tareaCampanaService.patchActivarHorarioBySlot(taskId, slotData, idUsuario)
      }
      addToast('Horario activado correctamente.', 'success', 2500)
    } else {
      if (horarioId) {
        payload.slot.horarioId = horarioId
        await tareaCampanaService.patchDesactivarHorario(taskId, horarioId, idUsuario)
      } else {
        await tareaCampanaService.patchDesactivarHorarioBySlot(taskId, slotData, idUsuario)
      }
      addToast('Horario desactivado correctamente.', 'success', 2500)
    }
  } catch (error: any) {
    payload.slot.activo = !payload.nextActive
    addToast(error?.message ?? 'No se pudo actualizar el horario.', 'error', 3500)
  } finally {
    isPatchingHorario.value = false
  }
}

function initializeFormData(): TareaCampanaFormData {
  if (props.initialData) {
    const cargaSlots = toScheduleSlotsByType(props.initialData, 1, ['idABCConfigHorarioTareaCampana'])
    const validacionSlots = toScheduleSlotsByType(props.initialData, 2, ['idABCConfigHorarioTareaCampana'])
    const envioSlots = toScheduleSlotsByType(props.initialData, 3, ['idABCConfigHorarioTareaCampana'])
    const tareaCarga = props.initialData.tareasPorTipo?.carga ?? props.initialData.tarea
    const tareaValidacion = props.initialData.tareasPorTipo?.validacion ?? props.initialData.tarea
    const tareaEnvio = props.initialData.tareasPorTipo?.envio ?? props.initialData.tarea

    const isEditMode = props.mode === 'edit'
    const diaIngesta = isEditMode
      ? ''
      : (cargaSlots[0]?.dia ?? resolveIdByLabel(props.diasDisponibles, props.initialData.carga?.dia ?? props.initialData.diaIngesta))
    const horaIngesta = isEditMode
      ? ''
      : (cargaSlots[0]?.hora ?? resolveIdByLabel(props.horasDisponibles, props.initialData.carga?.hora ?? props.initialData.horaIngesta))
    const diaValidacion = isEditMode
      ? ''
      : (validacionSlots[0]?.dia ?? resolveIdByLabel(props.diasDisponibles, props.initialData.validacion?.dia ?? props.initialData.diaValidacion))
    const horaValidacion = isEditMode
      ? ''
      : (validacionSlots[0]?.hora ?? resolveIdByLabel(props.horasDisponibles, props.initialData.validacion?.hora ?? props.initialData.horaValidacion))
    const diaEnvio = isEditMode
      ? ''
      : (envioSlots[0]?.dia ?? resolveIdByLabel(props.diasDisponibles, props.initialData.envio?.dia ?? props.initialData.diaEnvio))
    const horaEnvio = isEditMode
      ? ''
      : (envioSlots[0]?.hora ?? resolveIdByLabel(props.horasDisponibles, props.initialData.envio?.hora ?? props.initialData.horaEnvio))

    const ejecucionIngesta = normalizeCatalogId(
      props.initialData.carga?.ejecucionId
      ?? tareaCarga?.ejecucion?.id
      ?? resolveIdByLabel(props.ejecucionesDisponibles, props.initialData.carga?.ejecucion)
    ) || defaultEjecucionId.value
    const ejecucionValidacion = normalizeCatalogId(
      props.initialData.validacion?.ejecucionId
      ?? tareaValidacion?.ejecucion?.id
      ?? resolveIdByLabel(props.ejecucionesDisponibles, props.initialData.validacion?.ejecucion)
    ) || defaultEjecucionId.value
    const ejecucionEnvio = normalizeCatalogId(
      props.initialData.envio?.ejecucionId
      ?? tareaEnvio?.ejecucion?.id
      ?? resolveIdByLabel(props.ejecucionesDisponibles, props.initialData.envio?.ejecucion)
    ) || defaultEjecucionId.value

    return {
      idABCCatLineaNegocio: props.initialData.idABCCatLineaNegocio ?? '',
      idABCCatCampana: props.initialData.idABCCatCampana ?? '',
      idMapeo: resolveMapeoIdFromInitialData(props.initialData),
      ingesta: props.initialData.ingesta ?? '',
      carga: 'Carga',
      ejecucionIngesta,
      diaIngesta,
      horaIngesta,
      cargaSlots,
      validacion: 'Validación',
      ejecucionValidacion,
      diaValidacion,
      horaValidacion,
      validacionSlots,
      envio: 'Envío',
      ejecucionEnvio,
      diaEnvio,
      horaEnvio,
      envioSlots,
      horariosDesactivarIds: [],
      horariosActivarIds: [],
      idUsuario: props.initialData.idUsuario ?? props.initialData.idABCUsuario ?? 1
    }
  }

  return {
    idABCCatLineaNegocio: '',
    idABCCatCampana: '',
    idMapeo: '',
    ingesta: '',
    carga: 'Carga',
    ejecucionIngesta: defaultEjecucionId.value,
    diaIngesta: '',
    horaIngesta: '',
    cargaSlots: [],
    validacion: 'Validación',
    ejecucionValidacion: defaultEjecucionId.value,
    diaValidacion: '',
    horaValidacion: '',
    validacionSlots: [],
    envio: 'Envío',
    ejecucionEnvio: defaultEjecucionId.value,
    diaEnvio: '',
    horaEnvio: '',
    envioSlots: [],
    horariosDesactivarIds: [],
    horariosActivarIds: [],
    idUsuario: 1
  }
}

function handleSave() {
  requestSave()
}
</script>
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh] ">
      
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

          <TareaScheduleConfigurator
            v-model="scheduleModel"
            :mode="mode"
            :day-options="diasDisponibles"
            :hour-options="horasDisponibles"
            :execution-options="ejecucionesDisponibles"
            @update:schedule-ready="isScheduleReady = $event"
            @toggle-slot="handleToggleSlot"
          />

          <div v-if="mode === 'edit'" class="flex justify-end">
            <button
              type="button"
              title="Restaurar información"
              aria-label="Restaurar información"
              class="group relative h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-slate-500 bg-white border border-slate-200 hover:text-[#00357F] hover:border-[#00357F]/30 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="isLoading"
              @click="restoreInitialInformation"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
              </svg>
              <span class="pointer-events-none absolute right-0 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Restaurar información</span>
            </button>
          </div>

          </div>
        </div>

        <div class="shrink-0 flex items-center justify-between gap-3 p-4 border-t border-gray-100 bg-white">
          <div>
            <button
              v-if="mode === 'add'"
              type="button"
              title="Restaurar todo"
              aria-label="Restaurar todo"
              class="h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-slate-500 bg-white border border-slate-200 hover:text-[#00357F] hover:border-[#00357F]/30 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="isLoading || showActionConfirm"
              @click="resetAllForm"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="px-8 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-gray-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="requestCancel"
              :disabled="isLoading || showActionConfirm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-8 py-3 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300/50 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-3"
              :disabled="isLoading || !canSave || showActionConfirm"
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

      <ModalActionConfirmOverlay
        :show="showActionConfirm"
        :title="confirmTitle"
        :message="confirmMessage"
        :confirm-text="confirmText"
        :cancel-text="confirmCancelText"
        :is-loading="isLoading"
        @confirm="confirmAction"
        @cancel="closeActionConfirm"
      />
    </div>
  </div>
</template>
<style scoped>
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
