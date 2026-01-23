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
const campanaByMapeoId = ref(new Map<number, number>())

type ColumnaRow = ColumnaData | ColumnaCampanaData
const columnas = ref<ColumnaRow[]>([])
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

const mapeoId = 1

function mapCatalogosToOptions(items: { id: number; nombre: string; bolActivo: boolean }[]) {
	return items
		.filter(item => item.bolActivo !== false)
		.map(item => ({ label: item.nombre, value: item.id }))
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
		const map = new Map<number, number>()
		list.forEach(item => {
			if (item.idABCConfigMapeoLinea && item.idABCCatCampana) {
				map.set(Number(item.idABCConfigMapeoLinea), Number(item.idABCCatCampana))
			}
		})
		campanaByMapeoId.value = map
	} catch (e: any) {
		console.warn('[fetchMapeoCampanaCatalogMap] error', e)
	}
}

async function fetchColumnas() {
	isLoading.value = true
	error.value = null
	try {
		const data = activeTab.value === 'linea'
			? await columnaService.getColumnasByMapeo(mapeoId)
			: await columnaService.getColumnasCampana()
		columnas.value = data
		// DEBUG: log response to verify endpoint data
		console.log('[fetchColumnas] activeTab=', activeTab.value, 'received', Array.isArray(data) ? data.length : typeof data, data)

		if (selectedFilters.lineas.length === 0 && lineasDisponibles.value.length) {
			// keep empty to avoid filtering on init
		}
		// keep filters empty on init; only filter when user selects
	} catch (e: any) {
		error.value = e.message
	} finally {
		isLoading.value = false
	}
}

const getLineaLabel = (id?: number) => lineasDisponibles.value.find(x => x.value === id)?.label || 'N/A'

const getColumnaNombre = (item: ColumnaRow) => {
	const found = columnasCatalogo.value.find(x => x.value === item.idABCCatColumna)
	return found?.label || `Columna ${item.idABCCatColumna}`
}

const getColumnaLabel = (id?: number) =>
	columnasCatalogo.value.find(x => x.value === id)?.label || (id ? `Columna ${id}` : 'N/A')

const getCampanaLabelByMapeoId = (mapeoId?: number) => {
	if (!mapeoId) return 'N/A'
	const campanaId = campanaByMapeoId.value.get(mapeoId)
	const label = campanasCatalogo.value.find(x => x.value === campanaId)?.label
	return label ? label : `Campaña ${mapeoId}`
}

const getMapeoId = (item: ColumnaRow) =>
	'idABCConfigMapeoCampana' in item ? item.idABCConfigMapeoCampana : item.idABCConfigMapeoLinea

const mapeosDisponibles = computed(() => {
	const ids = new Set<number>()
	columnas.value.forEach(c => ids.add(getMapeoId(c)))
	return Array.from(ids).sort((a, b) => a - b).map(id => ({
		label: `Mapeo ${id}`,
		value: id
	}))
})

const nombresDisponibles = computed(() => {
	const names = new Set<string>()
	columnas.value.forEach(c => names.add(getColumnaNombre(c)))
	return Array.from(names).sort().map(n => ({
		label: n,
		value: n
	}))
})

const filteredColumnas = computed(() => {
	return columnas.value.filter(item => {
		const lineaId = 'idABCCatLineaNegocio' in item ? (item as any).idABCCatLineaNegocio : undefined
		const matchLinea = selectedFilters.lineas.length
			? lineaId === undefined || lineaId === null
				? true
				: selectedFilters.lineas.includes(lineaId)
			: true
		const matchMapeo = selectedFilters.mapeos.length
			? selectedFilters.mapeos.includes(getMapeoId(item))
			: true
		const matchNombre = selectedFilters.nombres.length
			? selectedFilters.nombres.includes(getColumnaNombre(item))
			: true
		const matchStatus = selectedFilters.status.length
			? selectedFilters.status.includes(item.bolActivo)
			: true
		const matchCampana = activeTab.value === 'campana'
			? ('idABCCatCampana' in item
				? (selectedFilters.campanas.length
					? selectedFilters.campanas.includes(item.idABCCatCampana)
					: true)
				: selectedFilters.campanas.length === 0)
			: true

		return matchLinea && matchMapeo && matchNombre && matchStatus && matchCampana
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
		if ('idABCCatCampana' in c) ids.add(c.idABCCatCampana)
	})
	return Array.from(ids).sort((a, b) => a - b).map(id => ({
		label: campanasCatalogo.value.find(x => x.value === id)?.label || `Campaña ${id}`,
		value: id
	}))
})

const showDetailsModal = ref(false)
const detailsItem = ref<ColumnaRow | null>(null)

function openDetails(item: ColumnaRow) {
	detailsItem.value = item
	showDetailsModal.value = true
}

const toggleFilterMenu = (column: string) => {
	openFilter.value = openFilter.value === column ? null : column
}

function toggleStatus(item: ColumnaRow) {
	return handleToggleStatus(item)
}

const showModal = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const selectedItem = ref<ColumnaRow | null>(null)

function openAddModal() {
	modalMode.value = 'add'
	selectedItem.value = null
	showModal.value = true
}

function handleEdit(item: ColumnaRow) {
	modalMode.value = 'edit'
	selectedItem.value = item
	showModal.value = true
}

async function handleSave(formData: any) {
	isLoading.value = true
	try {
		const newColumnaId = Number(formData.idABCCatColumna)
		const newColumnaNombre = columnasCatalogo.value.find(x => x.value === newColumnaId)?.label || `Columna ${newColumnaId}`
		const isDuplicate = columnas.value.some(item => {
			if (modalMode.value === 'edit' && selectedItem.value && item === selectedItem.value) return false
			const itemNombre = columnasCatalogo.value.find(x => x.value === item.idABCCatColumna)?.label || `Columna ${item.idABCCatColumna}`
			return item.idABCCatColumna === newColumnaId || itemNombre === newColumnaNombre
		})
		if (isDuplicate) {
			error.value = `La columna "${newColumnaNombre}" ya existe.`
			return
		}

		const selectedMapeo = Number(formData.mapeoId ?? selectedFilters.mapeos[0] ?? mapeoId)
		const basePayload = {
			idABCCatColumna: newColumnaId,
			bolCarga: Boolean(formData.bolCarga),
			bolValidacion: Boolean(formData.bolValidacion),
			bolEnvio: Boolean(formData.bolEnvio),
			regex: String(formData.regex ?? ''),
			idUsuario: 1
		}

		if (modalMode.value === 'add') {
			if (activeTab.value === 'campana') {
				await columnaService.createColumnaCampana(selectedMapeo, {
					idABCCatColumna: basePayload.idABCCatColumna,
					idUsuario: basePayload.idUsuario,
					regex: basePayload.regex
				})
			} else {
				await columnaService.createColumnaLinea(selectedMapeo, {
					idABCCatColumna: basePayload.idABCCatColumna,
					idUsuario: basePayload.idUsuario,
					regex: basePayload.regex
				})
			}
		} else if (selectedItem.value) {
			if (activeTab.value === 'campana') {
				await columnaService.updateColumnaCampana({
					idABCConfigMapeoCampana: getMapeoId(selectedItem.value),
					...basePayload
				})
			} else {
				await columnaService.updateColumnaLinea({
					idABCConfigMapeoLinea: getMapeoId(selectedItem.value),
					...basePayload
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

async function handleToggleStatus(item: ColumnaRow) {
	isLoading.value = true
	try {
		const basePayload = {
			idABCCatColumna: item.idABCCatColumna,
			idUsuario: 1
		}
		if (activeTab.value === 'campana') {
			const payload = {
				idABCConfigMapeoCampana: getMapeoId(item),
				...basePayload
			}
			if (item.bolActivo) {
				await columnaService.patchDesactivarColumnaCampana(payload)
			} else {
				await columnaService.patchActivarColumnaCampana(payload)
			}
		} else {
			const payload = {
				idABCConfigMapeoLinea: getMapeoId(item),
				...basePayload
			}
			if (item.bolActivo) {
				await columnaService.patchDesactivarColumnaLinea(payload)
			} else {
				await columnaService.patchActivarColumnaLinea(payload)
			}
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
	}
	fetchColumnas()
}

onMounted(() => {
	fetchCatalogosBase()
	fetchMapeoCampanaCatalogMap()
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
				:get-campana-label-by-mapeo-id="getCampanaLabelByMapeoId"
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
		@close="showDetailsModal = false"
	/>
</template>