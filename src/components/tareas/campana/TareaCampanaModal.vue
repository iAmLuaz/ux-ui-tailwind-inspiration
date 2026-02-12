<script setup lang="ts">
import { ref, watch, computed, defineComponent, h } from 'vue'
import type { MapeoCampanaData } from '@/types/mapeos/campana'

interface Option {
  label: string
  value: number | string
}

export interface TareaCampanaFormData {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  ingesta: string
  carga: string
  ejecucionIngesta: string
  diaIngesta: string
  horaIngesta: string
  validacion: string
  ejecucionValidacion: string
  diaValidacion: string
  horaValidacion: string
  envio: string
  ejecucionEnvio: string
  diaEnvio: string
  horaEnvio: string
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

const ejecucionOptions = ['Automatica', 'Manual', 'Programada']
const diaOptions = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']
const horaOptions = ['20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00']
const getMapeoLabel = (m: MapeoCampanaData) => m.nombre || m.descripcion || `Mapeo ${m.idABCConfigMapeoLinea}`

const allMapeoOptions = computed(() =>
  props.mapeosCampana.map(m => ({
    label: getMapeoLabel(m),
    value: getMapeoLabel(m),
    idLinea: Number(m.idABCCatLineaNegocio ?? 0),
    idCampana: Number(m.idABCCatCampana ?? 0)
  }))
)

const filteredMapeoOptions = computed(() => {
  const lineaId = Number(formData.value.idABCCatLineaNegocio ?? 0)
  const campanaId = Number(formData.value.idABCCatCampana ?? 0)
  const list = props.mapeosCampana.filter(m => {
    const matchLinea = lineaId ? Number(m.idABCCatLineaNegocio) === lineaId : true
    const matchCampana = campanaId ? Number(m.idABCCatCampana) === campanaId : true
    return matchLinea && matchCampana
  })
  return list.map(m => ({
    label: getMapeoLabel(m),
    value: getMapeoLabel(m),
    idLinea: Number(m.idABCCatLineaNegocio ?? 0),
    idCampana: Number(m.idABCCatCampana ?? 0)
  }))
})

const displayedMapeoOptions = computed(() => {
  if (isLineaSelected.value || isCampanaSelected.value) {
    return filteredMapeoOptions.value
  }
  return allMapeoOptions.value
})

const formData = ref<TareaCampanaFormData>(initializeFormData())

const isEditing = computed(() => props.mode === 'edit')
const isLineaSelected = computed(() => Boolean(formData.value.idABCCatLineaNegocio))
const isCampanaSelected = computed(() => Boolean(formData.value.idABCCatCampana))
const isAutoMapped = ref(false)
const isIngestaDisabled = computed(() => displayedMapeoOptions.value.length === 0)
const isHeaderLocked = computed(() => isEditing.value || isAutoMapped.value)
const ingestaPlaceholder = computed(() => {
  if (!displayedMapeoOptions.value.length) {
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
  Boolean(ejecucion && (!dia || hora))

const hasCargaConfig = computed(() =>
  isScheduleComplete(formData.value.ejecucionIngesta, formData.value.diaIngesta, formData.value.horaIngesta)
)
const hasValidacionConfig = computed(() =>
  isScheduleComplete(formData.value.ejecucionValidacion, formData.value.diaValidacion, formData.value.horaValidacion)
)
const hasEnvioConfig = computed(() =>
  isScheduleComplete(formData.value.ejecucionEnvio, formData.value.diaEnvio, formData.value.horaEnvio)
)

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
    const handleChange = (event: Event) => {
      const target = event.target as HTMLSelectElement
      emit('update:modelValue', target.value)
    }

    return () =>
      h('div', [
        h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h(
          'select',
          {
            value: props.modelValue,
            onChange: handleChange,
            disabled: props.disabled,
            required: props.required,
            class: [
              'w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-all outline-none',
              props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#00357F]'
            ]
          },
          [
            h('option', { value: '', disabled: true }, 'Seleccionar'),
            ...props.options.map(opt => h('option', { value: opt, key: opt }, opt))
          ]
        )
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
    const handleChange = (event: Event) => {
      const target = event.target as HTMLSelectElement
      emit('update:modelValue', target.value)
    }

    return () =>
      h('div', [
        props.hideLabel
          ? null
          : h('label', { class: 'block text-[10px] font-bold text-gray-500 uppercase mb-1' }, props.label),
        h(
          'select',
          {
            value: props.modelValue,
            onChange: handleChange,
            disabled: props.disabled,
            required: props.required,
            class: [
              'w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-all outline-none',
              props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#00357F]'
            ]
          },
          [
            h('option', { value: '', disabled: true }, props.placeholder),
            ...props.options.map(opt => h('option', { value: opt.value, key: String(opt.value) }, opt.label))
          ]
        )
      ])
  }
})
watch(
  () => [props.initialData, props.mode],
  () => {
    formData.value = initializeFormData()
  }
)

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      formData.value = initializeFormData()
    }
  }
)

watch(hasCargaConfig, (ready) => {
  if (!ready) {
    formData.value.ejecucionValidacion = ''
    formData.value.diaValidacion = ''
    formData.value.horaValidacion = ''
    formData.value.ejecucionEnvio = ''
    formData.value.diaEnvio = ''
    formData.value.horaEnvio = ''
  }
})

watch(hasValidacionConfig, (ready) => {
  if (!ready) {
    formData.value.ejecucionEnvio = ''
    formData.value.diaEnvio = ''
    formData.value.horaEnvio = ''
  }
})

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
  () => [formData.value.idABCCatLineaNegocio, formData.value.idABCCatCampana, props.mapeosCampana],
  () => {
    if (!displayedMapeoOptions.value.some(opt => opt.value === formData.value.ingesta)) {
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
      isAutoMapped.value = true
    }
  }
)

const resetHeaderSelection = () => {
  formData.value.ingesta = ''
  formData.value.idABCCatLineaNegocio = ''
  formData.value.idABCCatCampana = ''
  isAutoMapped.value = false
}

function initializeFormData(): TareaCampanaFormData {
  if (props.initialData) {
    return {
      idABCCatLineaNegocio: props.initialData.idABCCatLineaNegocio ?? '',
      idABCCatCampana: props.initialData.idABCCatCampana ?? '',
      ingesta: props.initialData.ingesta ?? '',
      carga: 'Carga',
      ejecucionIngesta: props.initialData.carga?.ejecucion ?? 'Automatica',
      diaIngesta: props.initialData.carga?.dia ?? '',
      horaIngesta: props.initialData.carga?.hora ?? '',
      validacion: 'Validacion',
      ejecucionValidacion: props.initialData.validacion?.ejecucion ?? 'Automatica',
      diaValidacion: props.initialData.validacion?.dia ?? '',
      horaValidacion: props.initialData.validacion?.hora ?? '',
      envio: 'Envio',
      ejecucionEnvio: props.initialData.envio?.ejecucion ?? 'Automatica',
      diaEnvio: props.initialData.envio?.dia ?? '',
      horaEnvio: props.initialData.envio?.hora ?? '',
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
    validacion: 'Validacion',
    ejecucionValidacion: 'Automatica',
    diaValidacion: '',
    horaValidacion: '',
    envio: 'Envio',
    ejecucionEnvio: 'Automatica',
    diaEnvio: '',
    horaEnvio: '',
    idUsuario: 1
  }
}

function handleSave() {
  emit('save', formData.value)
}
</script>
<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh] ">
      
      <div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          {{ mode === 'add' ? 'Nuevo Registro' : 'Editar Registro' }}
        </h3>
        <button
          @click="$emit('close')"
          :disabled="isLoading"
          class="text-white/70 hover:text-white transition-colors text-2xl leading-none focus:outline-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar bg-slate-50">
        <form @submit.prevent="handleSave" class="space-y-6">
          
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
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[10px] font-bold text-gray-500 uppercase">Nombre de la ingesta <span class="text-red-500">*</span></span>
                  <button
                    type="button"
                    class="text-[10px] font-bold uppercase tracking-wide text-[#00357F] bg-[#FFD100]/70 hover:bg-[#FFD100] px-2 py-1 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="!isAutoMapped || isEditing"
                    @click="resetHeaderSelection"
                  >
                    Elegir de nuevo
                  </button>
                </div>
                <SelectField
                  label="Nombre de la ingesta"
                  v-model="formData.ingesta"
                  :options="displayedMapeoOptions"
                  required
                  :disabled="isIngestaDisabled"
                  :placeholder="ingestaPlaceholder"
                  hide-label
                />
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
                    <ConfigField label="Día" v-model="formData.diaIngesta" :options="diaOptions" />
                    <ConfigField
                      label="Hora"
                      v-model="formData.horaIngesta"
                      :options="horaOptions"
                      :disabled="!formData.diaIngesta"
                      :required="Boolean(formData.diaIngesta)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="relative z-10 mb-6 transition-all duration-300" :class="!hasCargaConfig ? 'opacity-50 grayscale' : 'opacity-100'">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300"
                  :class="hasValidacionConfig ? 'bg-blue-500 text-white' : (hasCargaConfig ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
                   <svg v-if="hasValidacionConfig" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                   <svg v-else-if="!hasCargaConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   <span v-else class="font-bold text-sm">2</span>
                </div>

                <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                  <div v-if="!hasCargaConfig" class="absolute inset-0 z-20 cursor-not-allowed bg-white/10"></div> <h4 class="text-sm font-bold text-[#00357F] uppercase tracking-wide mb-3 flex items-center justify-between">
                    <span>Validación</span>
                    <span v-if="!hasCargaConfig" class="text-[10px] text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded">Pendiente de Carga</span>
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ConfigField label="Ejecución" v-model="formData.ejecucionValidacion" :options="ejecucionOptions" :disabled="!hasCargaConfig" required />
                    <ConfigField label="Día" v-model="formData.diaValidacion" :options="diaOptions" :disabled="!hasCargaConfig" />
                    <ConfigField
                      label="Hora"
                      v-model="formData.horaValidacion"
                      :options="horaOptions"
                      :disabled="!hasCargaConfig || !formData.diaValidacion"
                      :required="Boolean(formData.diaValidacion)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="relative z-10 transition-all duration-300" :class="!hasValidacionConfig ? 'opacity-50 grayscale' : 'opacity-100'">
              <div class="flex items-start gap-4">
                 <div class="flex-shrink-0 w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300"
                  :class="hasEnvioConfig ? 'bg-blue-500 text-white' : (hasValidacionConfig ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
                   <svg v-if="hasEnvioConfig" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                   <svg v-else-if="!hasValidacionConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   <span v-else class="font-bold text-sm">3</span>
                </div>

                <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
                  <div v-if="!hasValidacionConfig" class="absolute inset-0 z-20 cursor-not-allowed bg-white/10"></div>
                  
                  <h4 class="text-sm font-bold text-[#00357F] uppercase tracking-wide mb-3 flex items-center justify-between">
                    <span>Envío</span>
                    <span v-if="!hasValidacionConfig" class="text-[10px] text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded">Pendiente de Validación</span>
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ConfigField label="Ejecución" v-model="formData.ejecucionEnvio" :options="ejecucionOptions" :disabled="!hasValidacionConfig" required />
                    <ConfigField label="Día" v-model="formData.diaEnvio" :options="diaOptions" :disabled="!hasValidacionConfig" />
                    <ConfigField
                      label="Hora"
                      v-model="formData.horaEnvio"
                      :options="horaOptions"
                      :disabled="!hasValidacionConfig || !formData.diaEnvio"
                      :required="Boolean(formData.diaEnvio)"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div class="flex justify-end pt-4 mt-6">
            <button
              type="submit"
              class="px-8 py-3 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-300/50 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-3"
              :disabled="isLoading || isIngestaDisabled"
            >
              <svg v-if="isLoading" class="animate-spin h-5 w-5 text-[#00357F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'Guardando configuración...' : 'Guardar' }}</span>
            </button>
          </div>
        </form>
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
