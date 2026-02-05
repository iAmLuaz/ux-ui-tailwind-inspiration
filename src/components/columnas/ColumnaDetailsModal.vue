<script setup lang="ts">
import { computed } from 'vue'

interface Option {
	label: string
	value: number
}

interface ColumnaDetailsItem {
	mapeoId?: number
	columnaId?: number
	bolActivo?: boolean
	regex?: string | null
	fechaCreacion?: string
	fechaUltimaModificacion?: string
	columna?: any
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
	const item = props.item as ColumnaDetailsItem | null
	if (!item) return ''
	const mapeoId = item.mapeoId ?? item.columna?.idABCConfigMapeoLinea ?? item.columna?.idABCConfigMapeoCampana
	if (props.getMapeoLabel) return props.getMapeoLabel(mapeoId as number | undefined)
	return (
		props.mapeos?.find(m => m.value === mapeoId)?.label ??
		`Mapeo ${mapeoId ?? ''}`
	)
})

const columnaLabel = computed(() => {
	const item = props.item as ColumnaDetailsItem | null
	if (!item) return ''
	const tipoId = item.columna?.tipo?.id ?? item.columnaId
	if (props.getColumnaLabel) return props.getColumnaLabel(tipoId as number | undefined)
	return (
		props.columnas?.find(c => c.value === tipoId)?.label ??
		`Columna ${tipoId ?? ''}`
	)
})

function getBool(v: any) {
	if (v === undefined || v === null) return '—'
	return v ? 'Sí' : 'No'
}

function getValor(item: ColumnaDetailsItem | null) {
	const valor = item?.columna?.valor ?? item?.valor ?? null
	if (!valor) return null
	return {
		tipoId: valor?.tipo?.id ?? null,
		cadena: {
			tipoId: valor?.cadena?.tipo?.id ?? null,
			minimo: valor?.cadena?.minimo ?? null,
			maximo: valor?.cadena?.maximo ?? null
		},
		numero: {
			tipoId: valor?.numero?.tipo?.id ?? null,
			enteros: valor?.numero?.enteros ?? null,
			decimales: valor?.numero?.decimales ?? null
		}
	}
}
</script>

<template>
	<div
		v-if="props.show"
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
		@click.self="emit('close')"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]"
		>
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
				<div v-if="!props.item" class="text-sm text-slate-500">
					Sin información para mostrar.
				</div>

				<div v-else class="space-y-4 text-sm">
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
								:class="(props.item.columna?.bolActivo ?? props.item.bolActivo) ? 'text-[#00357F]' : 'text-slate-500'"
							>
								{{ (props.item.columna?.bolActivo ?? props.item.bolActivo) ? 'Activo' : 'Inactivo' }}
							</p>
						</div>
					</div>

					<div v-if="(props.item.columna?.regex ?? props.item.regex)" class="bg-slate-50 rounded-lg p-4 border border-slate-200">
					<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
						Regex
					</span>
					<p class="mt-1 text-slate-600 whitespace-pre-wrap font-mono text-xs">
						{{ props.item.columna?.regex ?? props.item.regex }}
					</p>
					</div>

				<div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
					<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Obligatorio</span>
					<p class="mt-1 text-slate-600">{{ (props.item.columna?.obligatorio ?? props.item.obligatorio) ? 'Sí' : 'No' }}</p>
				</div>

				<div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
					<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Valor</span>
					<div class="mt-2 text-slate-600 text-xs space-y-2">
						<div>Tipo: {{ getValor(props.item)?.tipoId ?? '(Sin tipo)' }}</div>
						<div>Cadena — tipo: {{ getValor(props.item)?.cadena.tipoId ?? '(sin)' }}, mínimo: {{ getValor(props.item)?.cadena.minimo ?? '(sin)' }}, máximo: {{ getValor(props.item)?.cadena.maximo ?? '(sin)' }}</div>
						<div>Número — tipo: {{ getValor(props.item)?.numero.tipoId ?? '(sin)' }}, enteros: {{ getValor(props.item)?.numero.enteros ?? '(sin)' }}, decimales: {{ getValor(props.item)?.numero.decimales ?? '(sin)' }}</div>
					</div>
				</div>

                    
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Creado
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ formatDate(props.item.fechaCreacion ?? props.item.columna?.fechaCreacion) }}
							</p>
						</div>

						<div class="bg-slate-50 rounded-lg p-3 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Última modificación
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ formatDate(props.item.fechaUltimaModificacion ?? props.item.columna?.fechaUltimaModificacion) }}
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