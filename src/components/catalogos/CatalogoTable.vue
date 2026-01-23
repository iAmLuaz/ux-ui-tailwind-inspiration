<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { CatalogoItem } from '../../types/catalogos'

interface Props {
  items: CatalogoItem[]
  isLoading: boolean
}

const props = defineProps<Props>()

function formatTimestamp(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col min-h-[400px] h-[87vh] max-h-[calc(100vh-2rem)]">
    <div class="overflow-x-auto flex-1" style="height: 100%; display: flex; justify-content: space-between; flex-flow: column nowrap;">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
            <th class="px-4 py-3">Activo</th>
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Fecha de creación</th>
            <th class="px-4 py-3">Última modificación</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="props.isLoading">
            <td colspan="100%" class="px-4 py-12">
              <div class="flex flex-col items-center justify-center text-slate-500">
                <div class="w-6 h-6 border-2 border-[#00357F] border-t-transparent rounded-full animate-spin mb-2"></div>
                <span class="text-sm font-medium">Cargando datos...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="props.items.length === 0">
            <td colspan="100%" class="px-4 py-12">
              <div class="flex flex-col items-center justify-center text-slate-400">
                <Search class="w-8 h-8 mb-2 opacity-50" />
                <span class="text-sm">No hay registros.</span>
              </div>
            </td>
          </tr>
          <tr v-else v-for="item in props.items" :key="`${item.codigo}-${item.id}`" class="text-sm hover:bg-blue-50/30 transition-colors">
            <td class="px-4 py-2.5">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border"
                :class="item.bolActivo ? 'bg-blue-50 text-[#00357F] border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'"
              >
                {{ item.bolActivo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-2.5 text-slate-600">{{ item.codigo }}</td>
            <td class="px-4 py-2.5 font-semibold text-slate-700">{{ item.nombre }}</td>
            <td class="px-4 py-2.5 text-slate-600">{{ formatTimestamp(item.fecCreacion) }}</td>
            <td class="px-4 py-2.5 text-slate-600">{{ formatTimestamp(item.fecUltModificacion) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center rounded-b-xl">
        <span>Mostrando {{ props.items.length }} registros</span>
        <div class="flex gap-2 items-center">
          <button class="hover:text-[#00357F] disabled:opacity-50" disabled>Anterior</button>
          <span class="text-[11px] text-slate-400">1 / 1</span>
          <button class="hover:text-[#00357F] disabled:opacity-50" disabled>Siguiente</button>
        </div>
      </div>
    </div>
  </div>
</template>
