<script setup lang="ts">
import { Activity } from 'lucide-vue-next'
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
    <div class="max-w-7xl mx-auto space-y-4">
      <div>
        <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
          <Activity class="w-6 h-6" />
          Monitoreo de Tareas
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Vista independiente para seguimiento operativo de tareas.
        </p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
        Pendiente: definir contenido de monitoreo.
      </div>
    </div>
  </div>
</template>
