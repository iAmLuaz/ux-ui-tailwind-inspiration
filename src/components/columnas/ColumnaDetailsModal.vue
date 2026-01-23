<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnaData, ColumnaCampanaData } from '../../types/columna'

interface Props {
  show: boolean
  item?: ColumnaData | ColumnaCampanaData | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const mapeoId = computed(() => {
  const item = props.item
  if (!item) return null
  return 'idABCConfigMapeoCampana' in item
    ? item.idABCConfigMapeoCampana
    : item.idABCConfigMapeoLinea
})

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
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          Detalle de Columna
        </h3>
        <button
          @click="emit('close')"
          class="text-white/70 hover:text-white transition-colors text-2xl leading-none focus:outline-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar">
        <div v-if="!item" class="text-sm text-slate-500">
          Sin información para mostrar.
        </div>

        <div v-else class="space-y-4 text-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Mapeo</span>
              <p class="mt-1 font-semibold text-slate-700">#{{ mapeoId }}</p>
            </div>
            <div v-if="'idABCCatCampana' in item" class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Campaña</span>
              <p class="mt-1 font-semibold text-slate-700">{{ item.idABCCatCampana }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Columna</span>
              <p class="mt-1 font-semibold text-slate-700">{{ item.idABCCatColumna }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estatus</span>
              <p class="mt-1 font-semibold" :class="item.bolActivo ? 'text-[#00357F]' : 'text-slate-500'">
                {{ item.bolActivo ? 'Activo' : 'Inactivo' }}
              </p>
            </div>
          </div>

          <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Regex</span>
            <p class="mt-1 text-slate-600 whitespace-pre-wrap">{{ item.regex }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Carga</span>
              <p class="mt-1 font-semibold text-slate-700">{{ item.bolCarga ? 'Sí' : 'No' }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Validación</span>
              <p class="mt-1 font-semibold text-slate-700">{{ item.bolValidacion ? 'Sí' : 'No' }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Envío</span>
              <p class="mt-1 font-semibold text-slate-700">{{ item.bolEnvio ? 'Sí' : 'No' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Creado</span>
              <p class="mt-1 text-slate-600">{{ formatTimestamp(item.fecCreacion) }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Modificado</span>
              <p class="mt-1 text-slate-600">{{ formatTimestamp(item.fecUltModificacion) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>
