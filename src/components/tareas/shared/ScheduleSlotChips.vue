<script setup lang="ts">
import type { ScheduleSlot } from '@/composables/tareas/tareaScheduleUtils'

interface Props {
  slots: ScheduleSlot[]
  stage: 'carga' | 'validacion' | 'envio'
  formatDay: (value: unknown) => string
  formatHour: (value: unknown) => string
}

interface Emits {
  (e: 'toggle', slot: ScheduleSlot): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSlotActive = (slot?: ScheduleSlot) => (slot?.activo ?? true) !== false
const getSlotActionLabel = (slot: ScheduleSlot) => (isSlotActive(slot) ? 'Desactivar' : 'Activar')
const getSlotClass = (slot: ScheduleSlot) => {
  if (!isSlotActive(slot)) return 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'
  return slot.persisted
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-slate-100 text-slate-700 border-slate-200'
}

const onToggle = (slot: ScheduleSlot) => emit('toggle', slot)
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="(slot, index) in props.slots"
      :key="`${props.stage}-${slot.dia}-${slot.hora}-${slot.horarioId ?? index}`"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
      :class="getSlotClass(slot)"
    >
      {{ props.formatDay(slot.dia) }} {{ props.formatHour(slot.hora) }}
      <button
        type="button"
        class="group relative ml-1 h-5 w-5 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-[#00357F] hover:bg-white/80 transition-colors"
        :aria-label="getSlotActionLabel(slot)"
        :title="getSlotActionLabel(slot)"
        @click="onToggle(slot)"
      >
        <svg v-if="isSlotActive(slot)" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
          <path d="M6.8 10.2l2.1 2.1 4.3-4.3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
        </svg>
        <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">{{ getSlotActionLabel(slot) }}</span>
      </button>
    </span>
  </div>
</template>
