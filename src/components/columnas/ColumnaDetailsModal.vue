<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import BaseModalActions from '@/components/shared/modal/BaseModalActions.vue'
import BaseModalShell from '@/components/shared/modal/BaseModalShell.vue'
import { catalogosService } from '@/services/catalogos/catalogosService'

interface Option {
	label: string
	value: number
}

interface ColumnaDetailsItem {
	mapeoId?: number
	columnaId?: number
	bolActivo?: boolean
	obligatorio?: boolean | null
	valor?: any
	regex?: string | null
	fechaCreacion?: string
	fechaUltimaModificacion?: string
	columna?: any
	lineaId?: number
	campanaId?: number
}

const props = defineProps<{
	show: boolean
	item: ColumnaDetailsItem | null
	mapeos?: Option[]
	rawMapeos?: any[]
	columnas?: Option[]
	getMapeoLabel?: (id?: number) => string
	getColumnaLabel?: (id?: number) => string
    lineas?: Option[]
    campanas?: Option[]
    selectedLineaId?: number | string | null
    selectedLineaNombre?: string | null
    selectedCampanaId?: number | string | null
    selectedCampanaNombre?: string | null
	selectedMapeoId?: number | string | null
	selectedMapeoNombre?: string | null
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
	const selectedName = props.selectedMapeoNombre
	if (selectedName) return selectedName
	const mapeoId = props.selectedMapeoId ?? (item.mapeoId ?? item.columna?.idABCConfigMapeoLinea ?? item.columna?.idABCConfigMapeoCampana)
	if (props.getMapeoLabel) return props.getMapeoLabel(mapeoId as number | undefined)
	return (
		props.mapeos?.find(m => Number(m.value) === Number(mapeoId))?.label ??
		props.rawMapeos?.find?.((r: any) => Number(r.id ?? r.idABCConfigMapeoCampana ?? r.idABCConfigMapeoLinea ?? r.id_mapeo) === Number(mapeoId))?.nombre ??
		props.rawMapeos?.find?.((r: any) => Number(r.id ?? r.idABCConfigMapeoCampana ?? r.idABCConfigMapeoLinea ?? r.id_mapeo) === Number(mapeoId))?.descripcion ??
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

const lineaLabel = computed(() => {
	const item = props.item as ColumnaDetailsItem | null
	if (!item) return ''
	const id = (props.selectedLineaId ?? (item.columna?.lineaId ?? undefined)) as number | undefined
	if (props.selectedLineaNombre) return props.selectedLineaNombre
	return (
		props.lineas?.find(l => l.value === id)?.label ?? `Línea ${id ?? ''}`
	)
})

const campanaLabel = computed(() => {
	const item = props.item as ColumnaDetailsItem | null
	if (!item) return ''
	const id = (props.selectedCampanaId ?? (item.columna?.campanaId ?? undefined)) as number | undefined
	if (props.selectedCampanaNombre) return props.selectedCampanaNombre
	return (
		props.campanas?.find(c => c.value === id)?.label ?? `Campaña ${id ?? ''}`
	)
})

const hasLinea = computed(() => {
	const item = props.item as ColumnaDetailsItem | null
	const id = (props.selectedLineaId ?? (item?.columna?.lineaId ?? item?.lineaId ?? null)) as number | null
	return id !== undefined && id !== null
})

const hasCampana = computed(() => {
	const item = props.item as ColumnaDetailsItem | null
	const id = (props.selectedCampanaId ?? (item?.columna?.campanaId ?? item?.campanaId ?? null)) as number | null
	return id !== undefined && id !== null
})

const statusIsActive = computed(() => {
	const item = props.item as ColumnaDetailsItem | null
	if (!item) return false
	if (item.bolActivo !== undefined && item.bolActivo !== null) return Boolean(item.bolActivo)
	return Boolean(item.columna?.bolActivo)
})

// function getBool(v: any) {
// 	if (v === undefined || v === null) return '—'
// 	return v ? 'Sí' : 'No'
// }

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

const valor = computed(() => getValor(props.item))

const valMap = ref<Record<number, string>>({})
const cdnMap = ref<Record<number, string>>({})
const nmrMap = ref<Record<number, string>>({})

async function fetchValorCatalogs() {
	try {
		const catalogos = await catalogosService.getCatalogosAgrupados()
		const nmr = catalogos.find(group => group.codigo === 'NMR')?.registros ?? []
		const cdn = catalogos.find(group => group.codigo === 'CDN')?.registros ?? []
		const val = catalogos.find(group => group.codigo === 'VAL')?.registros ?? []
		valMap.value = (val || []).reduce((acc: any, it: any) => ({ ...acc, [it.id]: it.nombre }), {})
		cdnMap.value = (cdn || []).reduce((acc: any, it: any) => ({ ...acc, [it.id]: it.nombre }), {})
		nmrMap.value = (nmr || []).reduce((acc: any, it: any) => ({ ...acc, [it.id]: it.nombre }), {})
	} catch (e) {
		valMap.value = {}
		cdnMap.value = {}
		nmrMap.value = {}
	}
}

onMounted(() => {
	fetchValorCatalogs()
})

function mapTipoName(id: number | null | undefined) {
	if (id === null || id === undefined) return '(Sin configuración)'
	return (valMap.value[id] ?? cdnMap.value[id] ?? nmrMap.value[id] ?? String(id))
}

function mapCadenaTipoName(id: number | null | undefined) {
	if (id === null || id === undefined) return '(Sin configuración)'
	return (cdnMap.value[id] ?? String(id))
}

function mapNumeroTipoName(id: number | null | undefined) {
	if (id === null || id === undefined) return '(Sin configuración)'
	return (nmrMap.value[id] ?? String(id))
}
</script>

<template>
	<BaseModalShell
		:show="props.show"
		title="Detalle de Columna"
		max-width-class="max-w-lg"
		@close="emit('close')"
	>
		<template #body>
			<div class="p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
				<div v-if="!props.item" class="text-sm text-slate-500">
					Sin información para mostrar.
				</div>

				<div v-else class="space-y-4 text-sm">
					<div v-if="hasLinea" class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
							Línea
						</span>
						<p class="mt-1 font-semibold text-slate-700">
							{{ lineaLabel }}
						</p>
					</div>

					<div v-if="hasCampana" class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
							Campaña
						</span>
						<p class="mt-1 font-semibold text-slate-700">
							{{ campanaLabel }}
						</p>
					</div>
					<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
							Mapeo
						</span>
						<p class="mt-1 font-semibold text-slate-700">
							{{ mapeoLabel }}
						</p>
					</div>

					<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
							Columna
						</span>
						<p class="mt-1 font-semibold text-slate-700">
							{{ columnaLabel }}
						</p>
						
					</div>
					<div class="grid grid-cols-3 gap-3">

						<div class="bg-slate-50 rounded-lg p-2 border border-slate-200 flex flex-col items-start">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Estatus</span>
							<p class="mt-3 font-semibold" :class="statusIsActive ? 'text-[#00357F]' : 'text-slate-500'">
								{{ statusIsActive ? 'Activo' : 'Inactivo' }}
							</p>
						</div>

						<div class="bg-slate-50 rounded-lg p-2 border border-slate-200 flex flex-col items-start">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Obligatorio</span>
							<label class="inline-flex items-center gap-2 mt-3">
								<input type="checkbox" :checked="Boolean(props.item.columna?.obligatorio ?? props.item.obligatorio)" disabled class="h-4 w-4 accent-[#00357F]" />
							</label>
						</div>

						<div v-if="(props.item.columna?.regex ?? props.item.regex)" class="bg-slate-50 rounded-lg p-2 border border-slate-200 flex flex-col items-start">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Regex
							</span>
							<p class="mt-3 text-slate-600 whitespace-pre-wrap font-mono text-xs">
								{{ props.item.columna?.regex ?? props.item.regex }}
							</p>
						</div>
						
					</div>

					<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
						
						<div class="p-2">
							<div class="grid grid-cols-1 gap-4">
								<div class="grid grid-cols-2">
									<div class="flex items-center gap-2 pb-2 border-b border-slate-100 ">
										<div class=" bg-gray-50 text-gray-600 rounded-md">
											<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</div>
									<div>
									<div class="text-sm font-semibold text-slate-700">
										<p class="text-[10px] text-slate-400 uppercase font-bold leading-none">Tipo de valor</p>
										<p class="text-sm font-semibold text-slate-700 mt-1">
											{{ mapTipoName(valor?.tipoId) }}
										</p>
									</div>
								</div>
								</div>
								<div class="flex items-center gap-2 pb-2 border-b border-slate-100" v-if="valor?.tipoId === 2" >
									<div class=" bg-gray-50 text-gray-600 rounded-md">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h18M3 12h18m-7 7h7" />
										</svg>
									</div>
									<div>
										<p class="text-[10px] text-slate-400 uppercase font-bold leading-none">Subtipo de Cadena</p>
										<p class="text-sm font-semibold text-slate-700 mt-1">{{ mapCadenaTipoName(valor?.cadena?.tipoId) }}</p>
									</div>
								</div>

								<div class="flex items-center gap-2 pb-2 border-b border-slate-100" v-if="valor?.tipoId === 1">
									<div class=" bg-gray-50 text-gray-600 rounded-md">
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
										</svg>
									</div>
									<div>
										<p class="text-[10px] text-slate-400 uppercase font-bold leading-none">Subtipo de Número</p>
										<p class="text-sm font-semibold text-slate-700 mt-1">{{ mapNumeroTipoName(valor?.numero?.tipoId) }}</p>
									</div>
								</div>
							</div>

							<div v-if="valor?.tipoId === 2" class="space-y-3">

								<div class="grid grid-cols-2 gap-2">
								<div class=" p-2 rounded-lg border border-slate-100 shadow-sm">
									<span class="block text-[10px] text-slate-400 uppercase font-medium"> Mínimo</span>
									<span class="text-sm font-mono font-semibold text-slate-600">{{ valor?.cadena?.minimo ?? '—' }}</span>
								</div>
								<div class=" p-2 rounded-lg border border-slate-100 shadow-sm">
									<span class="block text-[10px] text-slate-400 uppercase font-medium"> Máximo</span>
									<span class="text-sm font-mono font-semibold text-slate-600">{{ valor?.cadena?.maximo ?? '—' }}</span>
								</div>
								</div>
							</div>

							<div v-if="valor?.tipoId === 1" class="space-y-3">

								<div class="grid grid-cols-2 gap-2">
								<div class=" p-2 rounded-lg border border-slate-100 shadow-sm">
									<span class="block text-[10px] text-slate-400 uppercase font-medium">Enteros</span>
									<span class="text-sm font-mono font-semibold text-slate-600">{{ valor?.numero?.enteros ?? '0' }}</span>
								</div>
								<div class=" p-2 rounded-lg border border-slate-100 shadow-sm" v-if="valor?.numero?.tipoId === 2">
									<span class="block text-[10px] text-slate-400 uppercase font-medium">Decimales</span>
									<span class="text-sm font-mono font-semibold text-slate-600">{{ valor?.numero?.decimales ?? '0' }}</span>
								</div>
								</div>
							</div>

							</div>
						</div>
						</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
							<span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
								Creado
							</span>
							<p class="mt-1 font-semibold text-slate-700">
								{{ formatDate(props.item.fechaCreacion ?? props.item.columna?.fechaCreacion) }}
							</p>
						</div>

						<div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
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
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 10px;
}
</style>