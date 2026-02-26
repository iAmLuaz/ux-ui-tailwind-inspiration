<script setup lang="ts">
import { ClipboardCheck, Layers, Megaphone, Plus } from 'lucide-vue-next'

interface TabItem {
  key: 'linea' | 'campana'
  label: string
}

defineProps<{
  tabs: readonly TabItem[]
  activeTab: 'linea' | 'campana'
}>()

const emit = defineEmits<{
  (e: 'tab-change', tab: 'linea' | 'campana'): void
  (e: 'add'): void
}>()

function resolveIcon(tab: 'linea' | 'campana') {
  return tab === 'linea' ? Layers : Megaphone
}
</script>

<template>
  <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
        <ClipboardCheck class="w-6 h-6" />
        Gestion de Tareas
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Visualiza y administra las tareas por linea y campana.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <div class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
        <button
          v-for="t in tabs"
          :key="t.key"
          @click="emit('tab-change', t.key)"
          class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
          :class="activeTab === t.key
            ? 'bg-[#00357F] text-white shadow-sm cursor-pointer'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
        >
          <component :is="resolveIcon(t.key)" class="w-4 h-4" />
          {{ t.label }}
        </button>
      </div>
      <button
        @click="emit('add')"
        class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Nueva</span>
      </button>
    </div>
  </div>
</template>
