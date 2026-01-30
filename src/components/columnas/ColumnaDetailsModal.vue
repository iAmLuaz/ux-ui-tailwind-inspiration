<script setup lang="ts">
import { computed } from 'vue'

interface Option {
	label: string
	value: number
}

interface ColumnaDetailsItem {
	mapeoId: number
	columnaId: number
	bolActivo: boolean
	regex: string | null
	fechaCreacion?: string
	fechaUltimaModificacion?: string
}

const props = defineProps<{
	show: boolean
	item: ColumnaDetailsItem | null
	mapeos?: Option[]
	columnas?: Option[]
	getMapeoLabel?: (id?: number) => string
	getColumnaLabel?: (id?: number) => string
}>()

const emit = defineEmits<{
	(e: 'close'): void
}>()

function formatDate(date?: string) {
	if (!date) return '—'
	const d = new Date(date)
	if (isNaN(d.getTime())) return '—'
	return d.toLocaleString('es-MX', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}

const mapeoLabel = computed(() => {
	const item = props.item
	if (!item) return ''
	if (props.getMapeoLabel) return props.getMapeoLabel(item.mapeoId)
	return (
		props.mapeos?.find(m => m.value === item.mapeoId)?.label ??
		`Mapeo ${item.mapeoId}`
	)
})

const columnaLabel = computed(() => {
	const item = props.item
	if (!item) return ''
	if (props.getColumnaLabel) return props.getColumnaLabel(item.columnaId)
	return (
		props.columnas?.find(c => c.value === item.columnaId)?.label ??
		`Columna ${item.columnaId}`
	)
})
</script>

<template>
	<div
		v-if="show"
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
		@click.self="emit('close')"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]"
		>
			<!-- Header -->
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

			<!-- Body -->
			<div class="p-6 overflow-y-auto custom-scrollbar">
				<div v-if="!item" class="text-sm text-slate-500">
					Sin información para mostrar.
				</div>

				<div v-else class="space-y-4 text-sm">
					<!-- Básico -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Mapeo
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ mapeoLabel }}
							</p>
						</div>

						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Columna
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ columnaLabel }}
							</p>
						</div>

						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Estatus
							</span>
							<p
								class="mt-1 font-semibold"
								:class="item.bolActivo ? 'text-[#00357F]' : 'text-slate-500'"
							>
								{{ item.bolActivo ? 'Activo' : 'Inactivo' }}
							</p>
						</div>
					</div>

					<!-- Regex -->
					  <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
						<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
							Regex
						</span>
						<p class="mt-1 text-slate-600 whitespace-pre-wrap font-mono text-xs">
							{{ item.regex || '(Sin regex)' }}
						</p>
					</div>

                    

					<!-- Fechas -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Creado
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ formatDate(item.fechaCreacion) }}
							</p>
						</div>

						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Última modificación
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ formatDate(item.fechaUltimaModificacion) }}
							</p>
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
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 10px;
}
</style>