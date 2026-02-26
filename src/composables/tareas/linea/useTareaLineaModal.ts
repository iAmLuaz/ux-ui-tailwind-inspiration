import { computed, ref, watch } from 'vue'
import { addToast } from '@/stores/toastStore'
import { tareaLineaService } from '@/services/tareas/linea/tareaLineaService'
import type { MapeoLineaData } from '@/types/mapeos/linea'
import type { TareaLineaFormData } from '@/types/tareas/modalForms'
import type { Option, ScheduleSlot } from '@/composables/tareas/tareaScheduleUtils'
import {
  normalizeCatalogId,
  resolveIdByLabel,
  resolveMapeoIdFromInitialData,
  toScheduleSlotsByType
} from '@/composables/tareas/tareaFormUtils'
import type {
  TareaScheduleModel,
  TareaToggleSlotPayload
} from '@/components/tareas/shared/TareaScheduleConfigurator.vue'

export interface UseTareaLineaModalProps {
  mode: 'add' | 'edit'
  show: boolean
  lineasDisponibles: Option[]
  mapeosLinea: MapeoLineaData[]
  diasDisponibles: Option[]
  horasDisponibles: Option[]
  ejecucionesDisponibles: Option[]
  initialData?: Record<string, any> | null
  isLoading?: boolean
}

interface UseTareaLineaModalEmit {
  (e: 'save', data: TareaLineaFormData): void
  (e: 'close'): void
}

export function useTareaLineaModal(
  props: UseTareaLineaModalProps,
  emit: UseTareaLineaModalEmit
) {
  const defaultEjecucionId = computed(() => normalizeCatalogId(props.ejecucionesDisponibles?.[0]?.value) || 1)

  const getMapeoLabel = (m: MapeoLineaData) => m.nombre || m.descripcion || `Mapeo ${m.idABCConfigMapeoLinea}`

  const allMapeoOptions = computed(() =>
    props.mapeosLinea.map(m => ({
      label: getMapeoLabel(m),
      value: getMapeoLabel(m),
      idMapeo: Number(m.idABCConfigMapeoLinea ?? 0),
      idLinea: Number(m.linea?.id ?? m.idABCCatLineaNegocio ?? 0)
    }))
  )

  const formData = ref<TareaLineaFormData>(initializeFormData())
  const isScheduleReady = ref(false)
  const initialFormSnapshot = ref('')
  const showActionConfirm = ref(false)
  const pendingAction = ref<'save' | 'cancel' | null>(null)
  const isPatchingHorario = ref(false)

  const isEditing = computed(() => props.mode === 'edit')
  const isLineaSelected = computed(() => Boolean(formData.value.idABCCatLineaNegocio))
  const isAutoMapped = ref(false)

  const filteredMapeoOptions = computed(() => {
    const lineaId = Number(formData.value.idABCCatLineaNegocio ?? 0)
    const list = lineaId
      ? props.mapeosLinea.filter(m => Number(m.linea?.id ?? m.idABCCatLineaNegocio ?? 0) === lineaId)
      : props.mapeosLinea
    return list.map(m => ({
      label: getMapeoLabel(m),
      value: getMapeoLabel(m),
      idMapeo: Number(m.idABCConfigMapeoLinea ?? 0),
      idLinea: Number(m.linea?.id ?? m.idABCCatLineaNegocio ?? 0)
    }))
  })

  const displayedMapeoOptions = computed(() => (isLineaSelected.value ? filteredMapeoOptions.value : allMapeoOptions.value))
  const displayedMapeoOptionsWithCurrent = computed(() => {
    const current = String(formData.value.ingesta || '').trim()
    if (!current) return displayedMapeoOptions.value
    if (displayedMapeoOptions.value.some(opt => String(opt.value) === current)) return displayedMapeoOptions.value
    return [{ label: current, value: current }, ...displayedMapeoOptions.value]
  })

  const isIngestaDisabled = computed(() => isEditing.value || displayedMapeoOptionsWithCurrent.value.length === 0)
  const isHeaderLocked = computed(() => isEditing.value || isAutoMapped.value)
  const ingestaPlaceholder = computed(() => (displayedMapeoOptionsWithCurrent.value.length ? 'Seleccione origen de datos...' : 'Sin mapeos disponibles'))
  const ingestaHelper = computed(() => {
    if (!displayedMapeoOptions.value.length) {
      return 'No hay mapeos para esta linea. Ajusta los filtros o crea un mapeo.'
    }
    if (isAutoMapped.value) {
      return 'Linea asignada desde la ingesta seleccionada.'
    }
    if (isLineaSelected.value) {
      return 'Los mapeos se filtran según la linea seleccionada.'
    }
    return 'Puedes seleccionar una ingesta primero y se autocompletara la linea.'
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
  const confirmText = computed(() => (pendingAction.value === 'save' ? 'Guardar' : 'Aceptar'))
  const confirmCancelText = computed(() => (pendingAction.value === 'save' ? 'Cancelar' : 'Cancelar'))

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
    () => [formData.value.idABCCatLineaNegocio, props.mapeosLinea],
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
        const nextMapeoId = match.idMapeo || ''
        if (formData.value.idABCCatLineaNegocio !== nextLineaId) {
          formData.value.idABCCatLineaNegocio = nextLineaId
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

  const serializeFormState = (value: TareaLineaFormData) => JSON.stringify(value)

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
      ?? stageTask?.idABCConfigTareaLinea
      ?? props.initialData?.idABCConfigTareaLinea
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

    return Number(found?.idABCConfigHorarioTareaLinea ?? found?.horarioId ?? found?.id ?? 0) || 0
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
        const horarios = await tareaLineaService.getHorariosByTarea(taskId)
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
          await tareaLineaService.patchActivarHorario(taskId, horarioId, idUsuario)
        } else {
          await tareaLineaService.patchActivarHorarioBySlot(taskId, slotData, idUsuario)
        }
        addToast('Horario activado correctamente.', 'success', 2500)
      } else {
        if (horarioId) {
          payload.slot.horarioId = horarioId
          await tareaLineaService.patchDesactivarHorario(taskId, horarioId, idUsuario)
        } else {
          await tareaLineaService.patchDesactivarHorarioBySlot(taskId, slotData, idUsuario)
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

  function initializeFormData(): TareaLineaFormData {
    if (props.initialData) {
      const cargaSlots = toScheduleSlotsByType(props.initialData, 1, ['idABCConfigHorarioTareaLinea'])
      const validacionSlots = toScheduleSlotsByType(props.initialData, 2, ['idABCConfigHorarioTareaLinea'])
      const envioSlots = toScheduleSlotsByType(props.initialData, 3, ['idABCConfigHorarioTareaLinea'])
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

  return {
    canSave,
    closeActionConfirm,
    confirmAction,
    confirmCancelText,
    confirmMessage,
    confirmText,
    confirmTitle,
    displayedMapeoOptionsWithCurrent,
    formData,
    handleSave,
    handleToggleSlot,
    ingestaHelper,
    ingestaPlaceholder,
    isAutoMapped,
    isEditing,
    isHeaderLocked,
    isIngestaDisabled,
    isScheduleReady,
    mode: computed(() => props.mode),
    requestCancel,
    resetAllForm,
    resetHeaderSelection,
    restoreInitialInformation,
    scheduleModel,
    showActionConfirm
  }
}
