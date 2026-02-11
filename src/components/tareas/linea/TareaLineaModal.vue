<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Option {
  label: string
  value: number
}

export interface TareaLineaFormData {
  idABCCatLineaNegocio?: number | ''
  mapeoId?: number | ''
  tipoCarga?: string | ''
  tipoEjecucion?: string | ''
}

interface Props {
  show: boolean
  mode: 'add' | 'edit'
  lineasDisponibles: Option[]
  initialData?: Record<string, any> | null
  isLoading?: boolean
}

interface Emits {
  (e: 'save', data: TareaLineaFormData): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const mapeoOptions: Option[] = [
  { label: 'Mapeo 1', value: 1 },
  { label: 'Mapeo 2', value: 2 },
  { label: 'Mapeo 3', value: 3 }
]

const tipoCargaOptions = ['Enviar', 'Cargar', 'Validar', 'Recibir']
const tipoEjecucionOptions = ['Automatica', 'Manual', 'Hibrida']

const formData = ref<TareaLineaFormData>(initializeFormData())

const isEditing = computed(() => props.mode === 'edit')

watch(
  () => [props.initialData, props.mode],
  () => {
    formData.value = initializeFormData()
  }
)

function initializeFormData(): TareaLineaFormData {
  if (props.initialData) {
    return {
      idABCCatLineaNegocio: props.initialData.idABCCatLineaNegocio ?? '',
      mapeoId: props.initialData.mapeoId ?? '',
      tipoCarga: props.initialData.tipoCarga ?? '',
      tipoEjecucion: props.initialData.tipoEjecucion ?? ''
    }
  }

  return {
    idABCCatLineaNegocio: '',
    mapeoId: '',
    tipoCarga: '',
    tipoEjecucion: ''
  }
}

function handleSave() {
  emit('save', formData.value)
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          {{ mode === 'add' ? 'Nueva tarea' : 'Editar tarea' }}
        </h3>
        <button
          @click="$emit('close')"
          :disabled="isLoading"
          class="text-white/70 hover:text-white transition-colors text-2xl leading-none focus:outline-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar">
        <form @submit.prevent="handleSave" class="space-y-5">
          <div>
            <label for="field-linea" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
              Linea de negocio <span class="text-red-500 ml-1">*</span>
            </label>
            <select
              id="field-linea"
              v-model="formData.idABCCatLineaNegocio"
              class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
              :class="isEditing ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 cursor-pointer'"
              required
              :disabled="isEditing"
            >
              <option value="" disabled class="text-gray-400">Seleccione una opcion</option>
              <option v-for="opt in lineasDisponibles" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="field-mapeo" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
              Mapeo <span class="text-red-500 ml-1">*</span>
            </label>
            <select
              id="field-mapeo"
              v-model="formData.mapeoId"
              class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
              :class="isEditing ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 cursor-pointer'"
              required
              :disabled="isEditing"
            >
              <option value="" disabled class="text-gray-400">Mapeo</option>
              <option v-for="opt in mapeoOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="field-tipo-carga" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
              Tipo de carga <span class="text-red-500 ml-1">*</span>
            </label>
            <select
              id="field-tipo-carga"
              v-model="formData.tipoCarga"
              class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none bg-gray-50"
              required
            >
              <option value="" disabled class="text-gray-400">Seleccione una opcion</option>
              <option v-for="opt in tipoCargaOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>

          <div>
            <label for="field-tipo-ejecucion" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
              Tipo de ejecucion <span class="text-red-500 ml-1">*</span>
            </label>
            <select
              id="field-tipo-ejecucion"
              v-model="formData.tipoEjecucion"
              class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none bg-gray-50"
              required
            >
              <option value="" disabled class="text-gray-400">Seleccione una opcion</option>
              <option v-for="opt in tipoEjecucionOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
            <button
              type="submit"
              class="px-5 py-2.5 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              :disabled="isLoading"
            >
              <svg v-if="isLoading" class="animate-spin h-4 w-4 text-[#00357F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Guardando...' : 'Guardar' }}
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
</style>
