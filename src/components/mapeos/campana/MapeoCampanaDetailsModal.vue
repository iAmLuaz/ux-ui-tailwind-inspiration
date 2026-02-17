<script setup lang="ts">
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import { ref, onMounted } from 'vue'
import { catalogosService } from '@/services/catalogos/catalogosService'

interface Props {
  show: boolean
  item?: MapeoCampanaData | null
  getLineaLabel: (id?: number) => string
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const campanas = ref<{ id: number; nombre: string }[]>([])

onMounted(async () => {
  try {
    const catalogos = await catalogosService.getCatalogosAgrupados()
    const list: any[] = catalogos.find(group => group.codigo === 'CMP')?.registros ?? []
    campanas.value = (list || []).filter(c => c.bolActivo !== false).map(c => ({ id: c.id, nombre: c.nombre }))
  } catch (_) {
    campanas.value = []
  }
})

function getCampanaLabel(id?: number) {
  if (id === undefined || id === null) return '-'
  return campanas.value.find(c => Number(c.id) === Number(id))?.nombre ?? `Campaña ${id}`
}

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
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
      <div class="px-4 py-2.5 bg-[#00357F] border-b border-white/10 flex items-center shrink-0">
        <h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">
          Detalle de Mapeo
        </h3>
      </div>

      <div class="p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
        <div v-if="!item" class="text-sm text-slate-500">
          Sin informacion para mostrar.
        </div>

        <div v-else class="space-y-4 text-sm">
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Linea</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getLineaLabel(item.idABCCatLineaNegocio) }}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Campaña</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getCampanaLabel(item.idABCCatCampana) }}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Mapeo</span>
            <p class="mt-1 font-semibold text-slate-700">{{ item.nombre }}</p>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-3 gap-3">
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estatus</span>
              <p class="mt-1 font-semibold" :class="item.bolActivo ? 'text-[#00357F]' : 'text-slate-500'">
                {{ item.bolActivo ? 'Activo' : 'Inactivo' }}
              </p>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200 flex flex-col items-start">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Validar</span>

              <label class="inline-flex items-center gap-2 mt-3">
                <input type="checkbox" :checked="Boolean(item.validar)" disabled class="h-4 w-4 accent-[#00357F]" />
              </label>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200 flex flex-col items-start">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Enviar</span>

              <label class="inline-flex items-center gap-2 mt-3">
                <input type="checkbox" :checked="Boolean(item.envio)" disabled class="h-4 w-4 accent-[#00357F]" />
              </label>
            </div>
          </div>

          <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Descripcion</span>
            <p class="mt-1 text-slate-600 whitespace-pre-wrap">{{ item.descripcion }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Creado</span>
              <p class="mt-1 text-slate-600">{{ formatTimestamp(item.fechaCreacion) }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
              <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Modificado</span>
              <p class="mt-1 text-slate-600">{{ formatTimestamp(item.fechaUltimaModificacion) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 flex justify-end gap-3 p-3 border-t border-gray-100 bg-white">
        <button
          type="button"
          class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
          @click="emit('close')"
        >
          Cerrar
        </button>
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
