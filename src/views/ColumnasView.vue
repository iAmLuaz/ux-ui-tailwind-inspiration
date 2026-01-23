<!-- // src/views/ColumnasView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { catalogosService } from '../services/catalogosService'
import { mapeoService } from '../services/mapeoService'
import { columnaService } from '../services/columnaService'
import type { ColumnaData, ColumnaCampanaData } from '../types/columna'
import ColumnaTable from '@/components/columnas/ColumnaTable.vue'
import ColumnaModal from '@/components/columnas/ColumnaModal.vue'
import ColumnaDetailsModal from '@/components/columnas/ColumnaDetailsModal.vue'
import { Layers, Megaphone, Plus } from 'lucide-vue-next'

const tabs = [
	{ key: 'linea', label: 'Líneas de negocio', icon: Layers },
	{ key: 'campana', label: 'Campañas', icon: Megaphone }
] as const
type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('linea')

interface Option {
	label: string
	value: number
}

const lineasDisponibles = ref<Option[]>([])
const campanasCatalogo = ref<Option[]>([])
const columnasCatalogo = ref<Option[]>([])
const mapeosLineaDisponibles = ref<Option[]>([])
const mapeosCampanaDisponibles = ref<Option[]>([])

interface NormalizedColumna {
	tipo: 'linea' | 'campana'
	mapeoId: number
	columnaId: number
	bolActivo: boolean
	bolCarga: boolean
	bolValidacion: boolean
	bolEnvio: boolean
	regex: string
	campanaId?: number
}

const columnas = ref<NormalizedColumna[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const openFilter = ref<string | null>(null)

const pageSize = 10
const currentPage = ref(1)

const selectedFilters = reactive({
	lineas: [] as number[],
	mapeos: [] as number[],
	campanas: [] as number[],
	nombres: [] as string[],
	status: [] as boolean[]
})

function mapCatalogosToOptions(items: { id: number; nombre: string; bolActivo: boolean }[]) {
	return items
		.filter(item => item.bolActivo !== false)
		.map(item => ({ label: item.nombre, value: item.id }))
}

function toNumber(value: any, fallback = 0) {
	const n = Number(value)
	return Number.isFinite(n) ? n : fallback
}

async function fetchCatalogosBase() {
	try {
		const [lineas, campanas, columnas] = await Promise.all([
			catalogosService.getCatalogos('LNN'),
			catalogosService.getCatalogos('CMP'),
			catalogosService.getCatalogos('CLM')
		])
		lineasDisponibles.value = mapCatalogosToOptions(lineas)
		campanasCatalogo.value = mapCatalogosToOptions(campanas)
		columnasCatalogo.value = mapCatalogosToOptions(columnas)

	} catch (e: any) {
		error.value = e.message
	}
}

async function fetchMapeoCampanaCatalogMap() {
	try {
		const list = await mapeoService.getMapeosCampana()
		const unique = new Map<number, string>()	
		list.forEach(item => {
			const id = Number(item.idABCConfigMapeoLinea)
			const label = item.nombre || item.descripcion || `Mapeo ${id}`
			if (id) unique.set(id, label)
		})
		mapeosCampanaDisponibles.value = Array.from(unique.entries()).map(([value, label]) => ({
			label,
			value
		}))
	} catch (e: any) {
		console.warn('[fetchMapeoCampanaCatalogMap] error', e)
	}
}

async function fetchMapeosLineaDisponibles() {
	try {
		const list = await mapeoService.getAllMapeos()
		const unique = new Map<number, string>()
		list.forEach(item => {
			const id = Number(item.idABCConfigMapeoLinea)
			const label = item.nombre || item.descripcion || `Mapeo ${id}`
			if (id) unique.set(id, label)
		})
		mapeosLineaDisponibles.value = Array.from(unique.entries()).map(([value, label]) => ({
			label,
			value
		}))
	} catch (e: any) {
		console.warn('[fetchMapeosLineaDisponibles] error', e)
	}
}

function normalizeColumnas(
	data: (ColumnaData | ColumnaCampanaData)[],
	tipo: 'linea' | 'campana'
): NormalizedColumna[] {
	return data.map(item => ({
		tipo,
		mapeoId:
			tipo === 'campana'
				? toNumber(
					(item as ColumnaCampanaData).idABCConfigMapeoCampana ??
						(item as any).idABCConfigMapeoLinea ??
						(item as any).id_mapeo_campana ??
						(item as any).id_mapeo ??
						(item as any).idCampanaMapeo
				)
				: toNumber(
					(item as ColumnaData).idABCConfigMapeoLinea ??
						(item as any).id_mapeo ??
						(item as any).id
				),
		columnaId: toNumber(
			(item as any).idABCCatColumna ??
				(item as any).id_cat_columna ??
				(item as any).idColumna ??
				(item as any).id_columna
		),
		bolActivo: item.bolActivo,
		bolCarga: item.bolCarga,
		bolValidacion: item.bolValidacion,
		bolEnvio: item.bolEnvio,
		regex: item.regex,
		campanaId:
			tipo === 'campana'
				? toNumber(
					(item as ColumnaCampanaData).idABCCatCampana ??
						(item as any).id_campana
				)
				: undefined
	}))
}

async function fetchColumnas() {
	isLoading.value = true
	error.value = null
	try {
		const raw = activeTab.value === 'linea'
			? await columnaService.getColumnasLinea()
			: await columnaService.getColumnasCampana()
		columnas.value = normalizeColumnas(raw, activeTab.value)
	} catch (e: any) {
		error.value = e.message
	} finally {
		isLoading.value = false
	}
}

const getColumnaLabel = (id?: number | string) =>
	columnasCatalogo.value.find(x => Number(x.value) === Number(id))?.label || (id ? `Columna ${id}` : 'N/A')

const getMapeoLabel = (id?: number) =>
	mapeosDisponibles.value.find(x => Number(x.value) === Number(id))?.label || (id ? `Mapeo ${id}` : 'N/A')

const getLineaLabel = (id?: number) =>
	lineasDisponibles.value.find(x => Number(x.value) === Number(id))?.label || (id ? `Línea ${id}` : 'N/A')

const mapeosDisponibles = computed(() =>
	activeTab.value === 'campana' ? mapeosCampanaDisponibles.value : mapeosLineaDisponibles.value
)

const nombresDisponibles = computed(() => {
	const names = new Set<string>()
	columnas.value.forEach(c => names.add(getColumnaLabel(c.columnaId)))
	return Array.from(names).sort().map(n => ({
		label: n,
		value: n
	}))
})

const filteredColumnas = computed(() => {
	return columnas.value.filter(c => {
		if (selectedFilters.mapeos.length && !selectedFilters.mapeos.includes(c.mapeoId)) return false
		if (selectedFilters.status.length && !selectedFilters.status.includes(c.bolActivo)) return false
		if (selectedFilters.nombres.length && !selectedFilters.nombres.includes(getColumnaLabel(c.columnaId))) return false
		if (c.tipo === 'campana' && selectedFilters.campanas.length && !selectedFilters.campanas.includes(c.campanaId!)) return false
		return true
	})
})

const totalPages = computed(() =>
	Math.max(1, Math.ceil(filteredColumnas.value.length / pageSize))
)

const paginatedColumnas = computed(() => {
	const start = (currentPage.value - 1) * pageSize
	return filteredColumnas.value.slice(start, start + pageSize)
})

const canPrevPage = computed(() => currentPage.value > 1)
const canNextPage = computed(() => currentPage.value < totalPages.value)

function prevPage() {
	if (!canPrevPage.value) return
	currentPage.value -= 1
}

function nextPage() {
	if (!canNextPage.value) return
	currentPage.value += 1
}
const campanasDisponibles = computed(() => {
	if (activeTab.value !== 'campana') return [] as { label: string; value: number }[]
	const ids = new Set<number>()
	columnas.value.forEach(c => {
		if (c.campanaId) ids.add(c.campanaId)
	})
	return Array.from(ids).sort((a, b) => a - b).map(id => ({
		label: campanasCatalogo.value.find(x => x.value === id)?.label || `Campaña ${id}`,
		value: id
	}))
})

const showDetailsModal = ref(false)
const detailsItem = ref<NormalizedColumna | null>(null)

function openDetails(item: NormalizedColumna) {
	detailsItem.value = item
	showDetailsModal.value = true
}

const toggleFilterMenu = (column: string) => {
	openFilter.value = openFilter.value === column ? null : column
}

function toggleStatus(item: NormalizedColumna) {
	return handleToggleStatus(item)
}

const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedItem = ref<NormalizedColumna | null>(null)

function openAddModal() {
	modalMode.value = 'add'
	selectedItem.value = null
	showModal.value = true
}

function handleEdit(item: NormalizedColumna) {
	modalMode.value = 'edit'
	selectedItem.value = item
	showModal.value = true
}

async function handleSave(formData: any) {
	isLoading.value = true
	try {
		const payloadBase = {
			idABCCatColumna: Number(formData.idABCCatColumna),
			bolCarga: Boolean(formData.bolCarga),
			bolValidacion: Boolean(formData.bolValidacion),
			bolEnvio: Boolean(formData.bolEnvio),
			regex: String(formData.regex ?? ''),
			idUsuario: 1
		}

		const mapeoIdFinal = Number(formData.mapeoId)
		if (!mapeoIdFinal) throw new Error('Mapeo inválido')

		if (modalMode.value === 'add') {
			if (activeTab.value === 'campana') {
				await columnaService.createColumnaCampana(mapeoIdFinal, payloadBase)
			} else {
				await columnaService.createColumnaLinea(mapeoIdFinal, payloadBase)
			}
		} else if (selectedItem.value) {
			if (selectedItem.value.tipo === 'campana') {
				await columnaService.updateColumnaCampana({
					idABCConfigMapeoCampana: selectedItem.value.mapeoId,
					...payloadBase
				})
			} else {
				await columnaService.updateColumnaLinea({
					idABCConfigMapeoLinea: selectedItem.value.mapeoId,
					...payloadBase
				})
			}
		}

		showModal.value = false
		await fetchColumnas()
	} catch (e: any) {
		error.value = e.message
	} finally {
		isLoading.value = false
	}
}

async function handleToggleStatus(item: NormalizedColumna) {
	isLoading.value = true
	try {
		const wasActive = item.bolActivo
		item.bolActivo = !item.bolActivo
		const payload = {
			idUsuario: 1,
			idABCCatColumna: item.columnaId
		}

		if (item.tipo === 'campana') {
			await columnaService[
				wasActive ? 'patchDesactivarColumnaCampana' : 'patchActivarColumnaCampana'
			]({
				idABCConfigMapeoCampana: item.mapeoId,
				...payload
			})
		} else {
			await columnaService[
				wasActive ? 'patchDesactivarColumnaLinea' : 'patchActivarColumnaLinea'
			]({
				idABCConfigMapeoLinea: item.mapeoId,
				...payload
			})
		}
	} catch (e: any) {
		error.value = e.message
	} finally {
		await fetchColumnas()
		isLoading.value = false
	}
}

function handleTabChange(tab: TabKey) {
	if (activeTab.value === tab) return
	activeTab.value = tab
	selectedFilters.lineas = []
	selectedFilters.mapeos = []
	selectedFilters.campanas = []
	selectedFilters.nombres = []
	selectedFilters.status = []
	currentPage.value = 1
	if (activeTab.value === 'campana') {
		fetchMapeoCampanaCatalogMap()
	} else {
		fetchMapeosLineaDisponibles()
	}
	fetchColumnas()
}

onMounted(() => {
	fetchCatalogosBase()
	fetchMapeoCampanaCatalogMap()
	fetchMapeosLineaDisponibles()
	fetchColumnas()
})

watch(filteredColumnas, () => {
	if (currentPage.value > totalPages.value) {
		currentPage.value = totalPages.value
	}
})
</script>

<template>
	<div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="openFilter = null">
		<div class="max-w-7xl mx-auto space-y-4">
			<div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
				<div>
				<h1 class="text-2xl font-bold text-[#00357F] tracking-tight">Columnas</h1>
				<p class="text-sm text-slate-500 mt-1">Gestión de columnas por mapeo.</p>
				</div>
				<div class="flex items-center gap-3">
					<div class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
						<button
							v-for="t in tabs"
							:key="t.key"
							@click="handleTabChange(t.key)"
							class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
							:class="activeTab === t.key
								? 'bg-[#00357F] text-white shadow-sm cursor-pointer'
								: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
						>
							<component :is="t.icon" class="w-4 h-4" />
							{{ t.label }}
						</button>
					</div>

					<button
						@click="openAddModal"
						class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
					>
						<Plus class="w-4 h-4" />
						<span>Nuevo</span>
					</button>
				</div>
			</div>

			<ColumnaTable
				:active-tab="activeTab"
				:lineas-disponibles="lineasDisponibles"
				:mapeos-disponibles="mapeosDisponibles"
				:campanas-disponibles="campanasDisponibles"
				:nombres-disponibles="nombresDisponibles"
				:selected-filters="selectedFilters"
				:open-filter="openFilter"
				:filtered-columnas="paginatedColumnas"
				:total-columnas="filteredColumnas.length"
				:current-page="currentPage"
				:total-pages="totalPages"
				:can-prev-page="canPrevPage"
				:can-next-page="canNextPage"
				:is-loading="isLoading"
				:get-linea-label="getLineaLabel"
				:get-columna-label="getColumnaLabel"
				@toggle-filter="toggleFilterMenu"
				@view-details="openDetails"
				@select-all-lineas="selectedFilters.lineas = lineasDisponibles.map(x => x.value)"
				@select-all-mapeos="selectedFilters.mapeos = mapeosDisponibles.map(x => Number(x.value))"
				@select-all-campanas="selectedFilters.campanas = campanasDisponibles.map(x => Number(x.value))"
				@select-all-nombres="selectedFilters.nombres = nombresDisponibles.map(x => String(x.value))"
				@toggle-status="toggleStatus"
				@edit="handleEdit"
				@prev-page="prevPage"
				@next-page="nextPage"
			/>

			<p v-if="error" class="text-sm text-red-600">{{ error }}</p>
		</div>
	</div>

	<ColumnaModal
		:show="showModal"
		:mode="modalMode"
		:active-tab="activeTab"
		:mapeos-disponibles="mapeosDisponibles"
		:columnas-disponibles="columnasCatalogo"
		:initial-data="selectedItem"
		:is-loading="isLoading"
		@save="handleSave"
		@close="showModal = false"
	/>

	<ColumnaDetailsModal
		:show="showDetailsModal"
		:item="detailsItem"
		:get-mapeo-label="getMapeoLabel"
		:get-columna-label="getColumnaLabel"
		@close="showDetailsModal = false"
	/>
</template>