<script setup lang="ts">
import { Activity, Database, LayoutGrid } from 'lucide-vue-next'

defineProps<{
  totals: {
    tareas: number
    totalRegistros: number
    totalProcesados: number
    activos: number
  }
  formatNumber: (value?: number) => string
}>()
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
    <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
      <div class="flex items-center justify-between">
        <p class="text-[11px] uppercase tracking-wide text-slate-400">Tareas</p>
        <LayoutGrid class="w-4 h-4 text-slate-400" />
      </div>
      <p class="text-lg font-semibold text-slate-800 tabular-nums">{{ totals.tareas }}</p>
    </div>
    <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
      <div class="flex items-center justify-between">
        <p class="text-[11px] uppercase tracking-wide text-slate-400">Registros</p>
        <Database class="w-4 h-4 text-slate-400" />
      </div>
      <p class="text-lg font-semibold text-slate-800 tabular-nums">{{ formatNumber(totals.totalRegistros) }}</p>
    </div>
    <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
      <div class="flex items-center justify-between">
        <p class="text-[11px] uppercase tracking-wide text-slate-400">Procesados</p>
        <Activity class="w-4 h-4 text-slate-400" />
      </div>
      <p class="text-lg font-semibold text-slate-800 tabular-nums">{{ formatNumber(totals.totalProcesados) }}</p>
    </div>
    <div class="bg-white border border-slate-200 rounded-lg px-3 py-2">
      <div class="flex items-center justify-between">
        <p class="text-[11px] uppercase tracking-wide text-slate-400">Dictaminar Activos</p>
        <Activity class="w-4 h-4 text-slate-400" />
      </div>
      <p class="text-lg font-semibold text-[#00357F] tabular-nums">{{ totals.activos }}</p>
    </div>
  </div>
</template>
