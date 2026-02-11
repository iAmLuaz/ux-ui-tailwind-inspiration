<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import ColumnaLineaCrud from '@/components/columnas/linea/ColumnaLineaCrud.vue'

const props = defineProps<{
  show: boolean
  mapeoId?: number | string | null
  mapeoNombre?: string
  columnas?: unknown[]
  lineasDisponibles?: unknown[]
  selectedLineaId?: number | string | null
  selectedLineaNombre?: string | null
}>()

const emit = defineEmits(['close'])

watch(() => props.show, (val) => {
  try { document.body.style.overflow = val ? 'hidden' : '' } catch (_) {}
})

onUnmounted(() => { try { document.body.style.overflow = '' } catch (_) {} })
</script>

<template>
  <div v-if="props.show" class="fixed inset-0 z-[99999] flex items-center justify-center">
    <div class="fixed inset-0 z-[99990] bg-black/60" @click="emit('close')"></div>

    <div class="w-[95%] max-w-6xl z-[99999]">
      <div class="bg-white rounded-xl shadow-xl overflow-hidden">
        <div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">Columnas del mapeo {{ props.mapeoNombre ?? '-' }}</h3>
          <button
            @click="emit('close')"
            class="text-white/70 hover:text-white transition-colors text-2xl leading-none focus:outline-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div class="p-4">
          <ColumnaLineaCrud
            :mapeo-id="props.mapeoId"
            :mapeo-nombre="props.mapeoNombre"
            :selected-linea-id="props.selectedLineaId"
            :selected-linea-nombre="props.selectedLineaNombre ?? null"
          />
        </div>
      </div>
    </div>
  </div>
</template>
