<script setup lang="ts">
import BaseModalActions from '@/components/shared/modal/BaseModalActions.vue'
import BaseModalShell from '@/components/shared/modal/BaseModalShell.vue'
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
  <BaseModalShell
    :show="show"
    title="Detalle de Mapeo"
    max-width-class="max-w-lg"
    @close="emit('close')"
  >
    <template #body>
      <div class="p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
        <div v-if="!item" class="text-sm text-slate-500">
          Sin informacion para mostrar.
        </div>

        <div v-else class="space-y-4 text-sm">
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Linea</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getLineaLabel(item.linea?.id) }}</p>
          </div>
          <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Campaña</span>
            <p class="mt-1 font-semibold text-slate-700">{{ getCampanaLabel(item.linea?.campana?.id) }}</p>
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
                <input type="checkbox" :checked="Boolean((item as any).enviar ?? (item as any).envio)" disabled class="h-4 w-4 accent-[#00357F]" />
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
    </template>
    <template #footer>
      <BaseModalActions
        confirm-text="Aceptar"
        :show-cancel="false"
        @confirm="emit('close')"
      />
    </template>
  </BaseModalShell>
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
