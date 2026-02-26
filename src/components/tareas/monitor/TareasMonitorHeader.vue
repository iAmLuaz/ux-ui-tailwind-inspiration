<script setup lang="ts">
import { Activity, Layers, Megaphone } from 'lucide-vue-next'

interface TabItem {
  key: 'linea' | 'campana'
  label: string
}

const props = defineProps<{
  tabs: readonly TabItem[]
  activeTab: 'linea' | 'campana'
}>()

const emit = defineEmits<{
  (e: 'tab-change', value: 'linea' | 'campana'): void
}>()

function resolveIcon(key: TabItem['key']) {
  return key === 'linea' ? Layers : Megaphone
}
</script>

<template>
  <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
        <Activity class="w-6 h-6" />
        Monitoreo de Tareas
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Vista operativa tipo administrador de tareas (solo lectura).
      </p>
    </div>

    <div class="bg-white p-1 rounded-lg border border-slate-200 flex">
      <button
        v-for="t in props.tabs"
        :key="t.key"
        @click="emit('tab-change', t.key)"
        class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
        :class="props.activeTab === t.key
          ? 'bg-[#00357F] text-white cursor-pointer'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
      >
        <component :is="resolveIcon(t.key)" class="w-4 h-4" />
        {{ t.label }}
      </button>
    </div>
  </div>
</template>
