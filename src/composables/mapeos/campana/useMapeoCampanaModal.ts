import { computed, ref, watch } from 'vue'

interface Option {
  label: string
  value: number
}

export interface MapeoCampanaFormData {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  nombre: string
  descripcion: string
  validar?: boolean
  enviar?: boolean
  idUsuario?: number | ''
}

export interface UseMapeoCampanaModalProps {
  show: boolean
  mode: 'add' | 'edit'
  lineasDisponibles: Option[]
  campanasDisponibles: Option[]
  existingMapeos: { idABCConfigMapeoCampana?: number; nombre?: string }[]
  initialData?: Record<string, any> | null
  isLoading?: boolean
}

interface UseMapeoCampanaModalEmit {
  (e: 'save', data: MapeoCampanaFormData): void
  (e: 'close'): void
}

export function useMapeoCampanaModal(
  props: UseMapeoCampanaModalProps,
  emit: UseMapeoCampanaModalEmit
) {
  const formData = ref<MapeoCampanaFormData>(initializeFormData())
  const initialFormSnapshot = ref('')
  const showActionConfirm = ref(false)
  const pendingAction = ref<'save' | 'cancel' | null>(null)
  const touchedFields = ref({
    nombre: false,
    descripcion: false
  })

  const isEditing = computed(() => props.mode === 'edit')

  const normalizeName = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  const isDuplicateName = computed(() => {
    if (isEditing.value) return false
    const name = normalizeName(formData.value.nombre || '')
    if (!name) return false
    return props.existingMapeos.some(item => normalizeName(item.nombre || '') === name)
  })

  const nombreLength = computed(() => String(formData.value.nombre ?? '').trim().length)
  const descripcionLength = computed(() => String(formData.value.descripcion ?? '').trim().length)

  const nombreLengthError = computed(() => {
    if (!nombreLength.value) return 'El nombre es obligatorio.'
    if (nombreLength.value < 3 || nombreLength.value > 30) {
      return 'El nombre debe tener entre 3 y 30 caracteres.'
    }
    return ''
  })

  const descripcionLengthError = computed(() => {
    if (!descripcionLength.value) return 'La descripción es obligatoria.'
    if (descripcionLength.value < 3 || descripcionLength.value > 100) {
      return 'La descripción debe tener entre 3 y 100 caracteres.'
    }
    return ''
  })

  const hasTextValidationError = computed(() => Boolean(nombreLengthError.value || descripcionLengthError.value))
  const showNombreLengthError = computed(() => touchedFields.value.nombre && Boolean(nombreLengthError.value))
  const showDescripcionLengthError = computed(() => touchedFields.value.descripcion && Boolean(descripcionLengthError.value))

  const isDirty = computed(() => serializeFormState(formData.value) !== initialFormSnapshot.value)
  const confirmTitle = computed(() => (pendingAction.value === 'save' ? 'Confirmar guardado' : 'Descartar cambios'))
  const confirmMessage = computed(() =>
    pendingAction.value === 'save'
      ? '¿Estás seguro de guardar los cambios de este registro?'
      : 'Se detectaron cambios sin guardar. ¿Deseas cancelar y descartar la información modificada?'
  )
  const confirmText = computed(() => (pendingAction.value === 'save' ? 'Guardar' : 'Aceptar'))
  const confirmCancelText = computed(() => 'Cancelar')

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

  function initializeFormData(): MapeoCampanaFormData {
    if (props.initialData) {
      const lineaId = props.initialData.linea?.id ?? props.initialData.idABCCatLineaNegocio ?? ''
      const campanaId = props.initialData.linea?.campana?.id ?? props.initialData.idABCCatCampana ?? ''
      return {
        idABCCatLineaNegocio: lineaId,
        idABCCatCampana: campanaId,
        nombre: props.initialData.nombre ?? '',
        descripcion: props.initialData.descripcion ?? '',
        validar: props.initialData.validar ?? props.initialData.valida ?? true,
        enviar: props.initialData.enviar ?? props.initialData.envio ?? true,
        idUsuario: props.initialData.idUsuario ?? props.initialData.idABCUsuario ?? 1
      }
    }

    return {
      idABCCatLineaNegocio: '',
      idABCCatCampana: '',
      nombre: '',
      descripcion: '',
      validar: true,
      enviar: true,
      idUsuario: 1
    }
  }

  function serializeFormState(value: MapeoCampanaFormData) {
    return JSON.stringify(value)
  }

  function setInitialFormState() {
    formData.value = initializeFormData()
    touchedFields.value = {
      nombre: false,
      descripcion: false
    }
    initialFormSnapshot.value = serializeFormState(formData.value)
  }

  function restoreInitialInformation() {
    formData.value = initializeFormData()
    touchedFields.value = {
      nombre: false,
      descripcion: false
    }
  }

  function closeActionConfirm() {
    showActionConfirm.value = false
    pendingAction.value = null
  }

  function requestSave() {
    if (isEditing.value) {
      pendingAction.value = 'save'
      showActionConfirm.value = true
      return
    }

    if (isDuplicateName.value || hasTextValidationError.value) {
      touchedFields.value.nombre = true
      touchedFields.value.descripcion = true
      return
    }

    emit('save', formData.value)
  }

  function requestCancel() {
    if (isEditing.value && isDirty.value) {
      pendingAction.value = 'cancel'
      showActionConfirm.value = true
      return
    }

    emit('close')
  }

  function confirmAction() {
    if (pendingAction.value === 'save') {
      if (isDuplicateName.value || hasTextValidationError.value) {
        touchedFields.value.nombre = true
        touchedFields.value.descripcion = true
        closeActionConfirm()
        return
      }

      emit('save', formData.value)
    } else if (pendingAction.value === 'cancel') {
      emit('close')
    }

    closeActionConfirm()
  }

  function handleSave() {
    requestSave()
  }

  return {
    formData,
    touchedFields,
    isEditing,
    isDuplicateName,
    showNombreLengthError,
    showDescripcionLengthError,
    nombreLengthError,
    descripcionLengthError,
    showActionConfirm,
    confirmTitle,
    confirmMessage,
    confirmText,
    confirmCancelText,
    restoreInitialInformation,
    requestCancel,
    handleSave,
    confirmAction,
    closeActionConfirm
  }
}
