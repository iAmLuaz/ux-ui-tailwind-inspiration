<!-- // src/components/columnas/ColumnaLineaCrud.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useColumnasLinea } from '@/composables/useColumnasLinea'
import ColumnaLineaTable from './ColumnaLineaTable.vue'
import ColumnaLineaModal from './ColumnaLineaModal.vue'
import ColumnaDetailsModal from '../ColumnaDetailsModal.vue'
import type { ColumnaLineaModel } from '@/models/columnaLinea.model'

import { catalogosService } from '@/services/catalogosService'

interface Option {
	label: string
	value: number
}

import { useMapeosLinea } from '@/composables/useMapeosLinea'

const {
	mapeos,
	fetchAll: fetchMapeos
} = useMapeosLinea()

const columnasCatalogo = ref<Option[]>([])

import type { CatalogoItem } from '@/types/catalogos'

async function fetchCatalogosColumnas() {
	const list: CatalogoItem[] = await catalogosService.getCatalogos('CLM')
	columnasCatalogo.value = list
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
const selected = ref<ColumnaLineaModel | null>(null)

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

function toggleFilterMenu(column: string) {
	openFilter.value = openFilter.value === column ? null : column
}

onMounted(() => {
	fetchAll()
	fetchCatalogosColumnas()
	fetchMapeos()
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
			:selected-filters="selectedFilters"
			:open-filter="openFilter"
			:total-columnas="filtered.length"
			:is-loading="loading"
			:current-page="currentPage"
			:total-pages="totalPages"
			@toggle="toggle"
			@edit="openEdit"
			@details="openDetails"
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
			:existing-items="items"
			@close="showModal = false"
			@saved="fetchAll"
		/>

		<ColumnaDetailsModal
			:show="showDetails"
			:item="selected"
			:mapeos="mapeos"
			:columnas="columnasCatalogo"
			@close="showDetails = false"
		/>
	</div>
</template>
