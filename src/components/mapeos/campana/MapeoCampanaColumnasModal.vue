<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import ColumnaCampanaCrud from '@/components/columnas/campana/ColumnaCampanaCrud.vue'

const props = defineProps<{
  show: boolean
  mapeoId?: number | string | null 
  mapeoNombre?: string
  columnas?: unknown[]
  lineasDisponibles?: unknown[]
  selectedLineaId?: number | string | null
  selectedCampanaId?: number | string | null
  selectedLineaNombre?: string | null
  selectedCampanaNombre?: string | null
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
        <div class="px-5 py-3 bg-[#00357F] border-b border-white/10 flex justify-between items-center shrink-0">
          <h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">Columnas del mapeo {{ props.mapeoNombre ?? '-' }}</h3>
          <button
            @click="emit('close')"
            class="h-8 w-8 inline-flex items-center justify-center rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xl leading-none focus:outline-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div class="p-6 bg-slate-50">
          <ColumnaCampanaCrud
            :mapeo-id="props.mapeoId"
            :mapeo-nombre="props.mapeoNombre"
            :selected-linea-id="props.selectedLineaId"
            :selected-campana-id="props.selectedCampanaId"
            :selected-linea-nombre="props.selectedLineaNombre ?? null"
            :selected-campana-nombre="props.selectedCampanaNombre ?? null"
          />
        </div>
      </div>
    </div>
  </div>
</template>
