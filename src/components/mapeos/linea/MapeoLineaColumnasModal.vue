<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import ColumnaLineaCrud from '@/components/columnas/linea/ColumnaLineaCrud.vue'
import BaseModalShell from '@/components/shared/modal/BaseModalShell.vue'

const props = defineProps<{
  show: boolean
  mapeoId?: number | string | null
  mapeoNombre?: string
  columnas?: unknown[]
  lineasDisponibles?: unknown[]
  selectedLineaId?: number | string | null
  selectedLineaNombre?: string | null
}>()

const emit = defineEmits(['close', 'saved'])

watch(() => props.show, (val) => {
  try { document.body.style.overflow = val ? 'hidden' : '' } catch (_) {}
})

onUnmounted(() => { try { document.body.style.overflow = '' } catch (_) {} })
</script>

<template>
  <BaseModalShell
    :show="props.show"
    :title="`Columnas del mapeo ${props.mapeoNombre ?? '-'}`"
    max-width-class="max-w-6xl"
    z-index-class="z-[99999]"
    panel-class="rounded-xl shadow-xl"
    @close="emit('close')"
  >
    <template #body>
      <div class="p-6 bg-slate-50">
        <ColumnaLineaCrud
          :mapeo-id="props.mapeoId"
          :mapeo-nombre="props.mapeoNombre"
          :selected-linea-id="props.selectedLineaId"
          :selected-linea-nombre="props.selectedLineaNombre ?? null"
          @saved="emit('saved')"
        />
      </div>
    </template>
  </BaseModalShell>
</template>
