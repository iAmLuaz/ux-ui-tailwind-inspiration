<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'

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
  envio?: boolean
  idUsuario?: number | ''
}

interface Props {
  show: boolean
  mode: 'add' | 'edit'
  lineasDisponibles: Option[]
  campanasDisponibles: Option[]
  existingMapeos: { idABCConfigMapeoCampana?: number; nombre?: string }[]
  initialData?: Record<string, any> | null
  isLoading?: boolean
}

interface Emits {
  (e: 'save', data: MapeoCampanaFormData): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const formData = ref<MapeoCampanaFormData>(initializeFormData())

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

function initializeFormData(): MapeoCampanaFormData {
  if (props.initialData) {
    return {
      idABCCatLineaNegocio: props.initialData.idABCCatLineaNegocio ?? '',
      idABCCatCampana: props.initialData.idABCCatCampana ?? '',
      nombre: props.initialData.nombre ?? '',
      descripcion: props.initialData.descripcion ?? '',
      validar: props.initialData.validar ?? false,
      envio: props.initialData.envio ?? false,
      idUsuario: props.initialData.idUsuario ?? props.initialData.idABCUsuario ?? 1
    }
  }

  return {
    idABCCatLineaNegocio: '',
    idABCCatCampana: '',
    nombre: '',
    descripcion: '',
    validar: false,
    envio: false,
    idUsuario: 1
  }
}

function handleSave() {
  if (isDuplicateName.value) return
  emit('save', formData.value)
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
      <div class="px-5 py-3 bg-[#00357F] border-b border-white/10 flex justify-between items-center shrink-0">
        <h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">
          {{ mode === 'add' ? 'Nuevo Registro' : 'Editar Registro' }}
        </h3>
      </div>

      <form @submit.prevent="handleSave" class="flex flex-col min-h-0 flex-1">
        <div class="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-5">
          <div>
            <label for="field-linea" class="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Linea de negocio <span class="text-red-500 ml-1">*</span>
            </label>
            <SearchableSelect
              :model-value="formData.idABCCatLineaNegocio ?? null"
              @update:model-value="(v) => (formData.idABCCatLineaNegocio = Number(v))"
              :options="lineasDisponibles"
              placeholder="Seleccione una opcion"
              :disabled="isEditing"
              :required="true"
            />
          </div>

          <div>
            <label for="field-campana" class="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Campana <span class="text-red-500 ml-1">*</span>
            </label>
            <SearchableSelect
              :model-value="formData.idABCCatCampana ?? null"
              @update:model-value="(v) => (formData.idABCCatCampana = Number(v))"
              :options="campanasDisponibles"
              placeholder="Seleccione una opcion"
              :disabled="isEditing"
              :required="true"
            />
          </div>

          <div>
            <label for="field-nombre" class="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Nombre <span class="text-red-500 ml-1">*</span>
            </label>
            <input
              id="field-nombre"
              v-model="formData.nombre"
              placeholder="Escribe aqui..."
              type="text"
              required
              class="w-full px-4 py-2.5 border rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400 bg-gray-50"
              :class="isDuplicateName ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-300'"
            />
            <p v-if="isDuplicateName" class="text-xs text-red-500 mt-1">Ya existe un mapeo con este nombre.</p>
          </div>

          <div>
            <label for="field-descripcion" class="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Descripcion <span class="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="field-descripcion"
              v-model="formData.descripcion"
              placeholder="Escribe aqui..."
              class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400 resize-none"
              required
              rows="3"
            />
          </div>

          <div class="flex gap-4 items-center">
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="formData.validar" class="w-4 h-4" />
              <span class="text-sm font-medium text-gray-700">Validar</span>
            </label>

            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="formData.envio" class="w-4 h-4" />
              <span class="text-sm font-medium text-gray-700">Enviar</span>
            </label>
          </div>

          </div>
        </div>

        <div class="shrink-0 flex justify-end gap-3 p-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
            @click="$emit('close')"
            :disabled="isLoading"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            :disabled="isLoading || isDuplicateName"
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
