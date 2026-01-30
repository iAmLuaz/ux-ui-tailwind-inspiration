<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import ColumnaLineaCrud from './columnas/linea/ColumnaLineaCrud.vue'
import type { ColumnaGetResponse as ColumnaData } from '../types/columna'

interface Option { label: string; value: number }

const props = defineProps<{
  show: boolean
  mapeoId?: number | string | null
  mapeoNombre?: string
  columnas?: ColumnaData[]
  lineasDisponibles?: Option[]
}>()

const emit = defineEmits(['close', 'toggle', 'edit', 'details'])

// Disable body scroll when modal is open
watch(() => props.show, (val) => {
  try { document.body.style.overflow = val ? 'hidden' : '' } catch (_) {}
})

onUnmounted(() => { try { document.body.style.overflow = '' } catch (_) {} })
</script>

<template>
  <div v-if="props.show" class="fixed inset-0 z-[99999] flex items-center justify-center">
    <div class="fixed inset-0 z-[99990] bg-black/40" @click="emit('close')"></div>

    <div class="w-[95%] max-w-6xl z-[99999]">
      <div class="bg-white rounded-xl shadow-xl overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h3 class="text-lg font-semibold">Columnas de: {{ props.mapeoNombre ?? '-' }}</h3>
          <button @click="emit('close')" class="text-slate-500 hover:text-slate-800">Cerrar</button>
        </div>

        <div class="p-4">
          <ColumnaLineaCrud :mapeo-id="props.mapeoId" />
        </div>

        <div class="px-6 py-3 border-t text-right bg-slate-50">
          <button @click="emit('close')" class="px-4 py-2 bg-[#00357F] text-white rounded">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>
