<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  title?: string
  currentAction: string
  completed: number
  total: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Guardando cambios'
})

const safeTotal = computed(() => Math.max(1, Number(props.total ?? 0)))
const safeCompleted = computed(() => Math.max(0, Math.min(Number(props.completed ?? 0), safeTotal.value)))
const percent = computed(() => Math.round((safeCompleted.value / safeTotal.value) * 100))
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl p-5">
      <h3 class="text-base font-bold text-[#00357F]">{{ title }}</h3>
      <p class="text-sm text-slate-600 mt-1">{{ currentAction || 'Procesando...' }}</p>

      <div class="mt-4">
        <div class="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            class="h-full bg-[#FFD100] transition-all duration-300"
            :style="{ width: `${percent}%` }"
          ></div>
        </div>
        <div class="mt-2 flex items-center justify-between text-xs text-slate-600">
          <span>{{ safeCompleted }} / {{ safeTotal }} acciones</span>
          <span>{{ percent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
