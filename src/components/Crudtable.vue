<script setup>
import { ref } from 'vue'

const props = defineProps({
  titulo: String,
  columnas: Array,
  datos: Array,
  camposConfig: {
    type: Object,
    default: () => ({})
  }
})

const showModal = ref(false)
const isEditMode = ref(false)
const formData = ref({})

const openAddModal = () => {
  isEditMode.value = false
  showModal.value = true
  if (props.datos && props.datos.length > 0) {
    const keys = Object.keys(props.datos[0])
    formData.value = keys.reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
  } else {
    formData.value = {} 
  }
}

const openEditModal = (item) => {
  isEditMode.value = true
  showModal.value = true
  formData.value = { ...item }
}

const handleSave = () => {
  alert(`Datos ${isEditMode.value ? 'Editados' : 'Guardados'}:\n${JSON.stringify(formData.value, null, 2)}`)
  showModal.value = false
}

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1)
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans">
    <div class="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
      
      <header class="flex flex-col md:flex-row justify-between items-center p-6 border-b border-gray-100 gap-4">
        <h1 class="text-2xl font-extrabold text-[#00357F] tracking-tight relative">
          {{ titulo }}
          <span class="absolute -bottom-2 left-0 w-12 h-1 bg-[#FFD100] rounded-full"></span>
        </h1>
        <button 
          @click="openAddModal" 
          class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Nuevo Registro
        </button>
      </header>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-[#00357F]">
            <tr>
              <th 
                v-for="(col, index) in columnas" 
                :key="index"
                class="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
              >
                {{ col }}
              </th>
              <th class="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="(item, index) in datos" :key="index" class="hover:bg-blue-50/50 transition-colors duration-150">
             <td 
                v-for="(value, key) in item" 
                :key="key"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
              >
                <template v-if="key === 'status'">
                  <div class="flex items-center gap-2">
                    <span 
                      class="h-2.5 w-2.5 rounded-full"
                      :class="value === 1 ? 'bg-blue-500' : 'bg-red-500'"
                    ></span>
                    
                    <span class="font-medium text-gray-700">
                      {{ value === 1 ? 'Activado' : 'Desactivado' }}
                    </span>
                  </div>
                </template>
                
                <template v-else>
                  {{ value }}
                </template>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openEditModal(item)" 
                    class="p-2 text-[#00357F] bg-blue-100/50 rounded-lg hover:bg-[#FFD100] hover:text-[#00357F] transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    class="p-2 text-red-600 bg-red-100/50 rounded-lg hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    
  </div>
</template>