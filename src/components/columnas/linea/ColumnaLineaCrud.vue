<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useColumnasLinea } from '@/composables/columnas/linea/useColumnasLinea'
import ColumnaLineaTable from './ColumnaLineaTable.vue'
import ColumnaLineaModal from './ColumnaLineaModal.vue'
import ColumnaDetailsModal from '../ColumnaDetailsModal.vue'
import type { ColumnaLineaModel } from '@/models/columnas/linea/columnaLinea.model'

import { catalogosService } from '@/services/catalogos/catalogosService'

interface Option {
	label: string
	value: number
}

import { useMapeosLinea } from '@/composables/mapeos/linea/useMapeosLinea'

const props = defineProps<{
	mapeoId?: number | string | null
	mapeoNombre?: string
	selectedLineaId?: number | string | null
	selectedLineaNombre?: string | null
}>()

const {
	mapeos,
	rawMapeos,
	fetchAll: fetchMapeos
} = useMapeosLinea()

const columnasCatalogo = ref<Option[]>([])
const lineasCatalogo = ref<Option[]>([])

import type { CatalogoItem } from '@/types/catalogos/catalogos'

async function fetchCatalogosColumnas() {
	const catalogos = await catalogosService.getCatalogosAgrupados()
	const list: CatalogoItem[] = catalogos.find(group => group.codigo === 'CLM')?.registros ?? []
	columnasCatalogo.value = list
		.filter((c: CatalogoItem) => c.bolActivo)
		.map((c: CatalogoItem) => ({
			label: c.nombre,
			value: c.id
		}))
}

async function fetchCatalogosLineas() {
	const catalogos = await catalogosService.getCatalogosAgrupados()
	const list: CatalogoItem[] = catalogos.find(group => group.codigo === 'LNN')?.registros ?? []
	lineasCatalogo.value = list
		.filter((c: CatalogoItem) => c.bolActivo)
		.map((c: CatalogoItem) => ({
			label: c.nombre,
			value: c.id
		}))
}

const { items, loading, error, fetchAll, toggle } = useColumnasLinea()

const openFilter = ref<string | null>(null)
const selectedFilters = reactive({
	mapeos: [] as number[],
	columnas: [] as number[],
	status: [] as boolean[]
})

const pageSize = ref(10)
const currentPage = ref(1)

const filtered = computed(() =>
	items.value.filter(item => {
		const matchMapeo = selectedFilters.mapeos.length
			? selectedFilters.mapeos.includes(item.mapeoId)
			: true
		const matchColumna = selectedFilters.columnas.length
			? selectedFilters.columnas.includes(item.columnaId)
			: true
		const matchStatus = selectedFilters.status.length
			? selectedFilters.status.includes(item.bolActivo)
			: true

		return matchMapeo && matchColumna && matchStatus
	})
)

const totalPages = computed(() =>
	Math.max(1, Math.ceil(filtered.value.length / pageSize.value))
)

const paginated = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value
	return filtered.value.slice(start, start + pageSize.value)
})

const showModal = ref(false)
const showDetails = ref(false)
const mode = ref<'add' | 'edit'>('add')
const selected = ref<any>(null)

function openAdd() {
	mode.value = 'add'
	selected.value = null
	showModal.value = true
}

function openEdit(item: ColumnaLineaModel) {
	mode.value = 'edit'
	selected.value = item
	showModal.value = true
}

function openDetails(item: ColumnaLineaModel) {
	selected.value = item
	showDetails.value = true
}

async function handleSaved() {
	await Promise.all([
		fetchAll(props.mapeoId ?? null),
		fetchMapeos()
	])
}

function toggleFilterMenu(column: string) {
	openFilter.value = openFilter.value === column ? null : column
}

onMounted(() => {
	if (props.mapeoId !== undefined && props.mapeoId !== null) {
		selectedFilters.mapeos = [Number(props.mapeoId)]
	}
	fetchAll(props.mapeoId)
	fetchCatalogosColumnas()
	fetchMapeos()
	fetchCatalogosLineas()
	updatePageSize()
	window.addEventListener('resize', updatePageSize)
})

onUnmounted(() => {
	window.removeEventListener('resize', updatePageSize)
})

watch(filtered, () => {
	if (currentPage.value > totalPages.value) {
		currentPage.value = totalPages.value
	}
})

watch(
	selectedFilters,
	() => {
		currentPage.value = 1
	},
	{ deep: true }
)

watch(() => props.mapeoId, (v) => {
	selectedFilters.mapeos = v !== undefined && v !== null ? [Number(v)] : []
})

function updatePageSize() {
	const available = window.innerHeight * 0.87 - 240
	const rows = Math.floor(available / 44)
	pageSize.value = Math.max(8, rows || 8)
}

defineExpose({ openAdd })

</script>

<template>
	<div class="" @click.self="openFilter = null">
		<ColumnaLineaTable
			:columnas="paginated"
			:mapeos="mapeos"
			:columnas-catalogo="columnasCatalogo"
			:lineas-catalogo="lineasCatalogo"
			:mapeos-raw="rawMapeos"
			:selected-filters="selectedFilters"
			:open-filter="openFilter"
			:total-columnas="filtered.length"
			:is-loading="loading"
			:current-page="currentPage"
			:total-pages="totalPages"
			@toggle="toggle"
			@edit="openEdit"
			@details="openDetails"
			@add="openAdd"
			@toggle-filter="toggleFilterMenu"
			@select-all-mapeos="selectedFilters.mapeos = mapeos.map(x => x.value)"
			@select-all-columnas="selectedFilters.columnas = columnasCatalogo.map(x => x.value)"
			@prev="currentPage--"
			@next="currentPage++"
		/>

		<p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
			{{ error }}
		</p>

		<ColumnaLineaModal
			:key="mode + String(selected?.columnaId ?? 'new')"
			:show="showModal"
			:mode="mode"
			:initial-data="selected"
			:is-loading="loading"
			:columnas="columnasCatalogo"
			:mapeos="mapeos"
			:lineas="lineasCatalogo"
			:selected-mapeo-id="selected?.mapeoId ?? mapeoId ?? null"
			:selected-mapeo-nombre="selected?.mapeoNombre ?? props.mapeoNombre ?? null"
			:selected-linea-id="props.selectedLineaId ?? null"
			:selected-linea-nombre="props.selectedLineaNombre ?? null"
			:existing-items="items"
			@close="showModal = false"
			@saved="handleSaved"
		/>

		<ColumnaDetailsModal
			:show="showDetails"
			:item="selected"
			:mapeos="mapeos"
			:raw-mapeos="rawMapeos"
			:selected-mapeo-id="props.mapeoId ?? selected?.mapeoId ?? null"
			:selected-mapeo-nombre="props.mapeoNombre ?? selected?.mapeoNombre ?? null"
			:columnas="columnasCatalogo"
			:lineas="lineasCatalogo"
			:selected-linea-id="selected?.lineaId ?? props.selectedLineaId ?? null"
			:selected-linea-nombre="selected?.lineaNombre ?? props.selectedLineaNombre ?? null"
			@close="showDetails = false"
		/>
	</div>
</template>