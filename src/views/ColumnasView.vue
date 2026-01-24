<script setup lang="ts">
import { ref } from 'vue'
import ColumnaLineaCrud from '@/components/columnas/linea/ColumnaLineaCrud.vue'
import ColumnaCampanaCrud from '@/components/columnas/campana/ColumnaCampanaCrud.vue'
import { Layers, Megaphone } from 'lucide-vue-next'

type TabKey = 'linea' | 'campana'

const tabs: {
  key: TabKey
  label: string
  icon: any
}[] = [
  { key: 'linea', label: 'Líneas de negocio', icon: Layers },
  { key: 'campana', label: 'Campañas', icon: Megaphone }
]

const activeTab = ref<TabKey>('linea')
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
    <div class="max-w-7xl mx-auto space-y-10">

      <header class="flex justify-end">
        <div class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm inline-flex">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="activeTab = t.key"
            class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all"
            :class="activeTab === t.key
              ? 'bg-[#00357F] text-white shadow-sm cursor-pointer'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
          >
            <component :is="t.icon" class="w-4 h-4" />
            {{ t.label }}
          </button>
        </div>
      </header>

      <ColumnaLineaCrud v-show="activeTab === 'linea'" />
      <ColumnaCampanaCrud v-show="activeTab === 'campana'" />

    </div>
  </div>
</template>
