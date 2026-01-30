<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useColumnasCampana } from '@/composables/useColumnasCampana'
import { useMapeosCampana } from '@/composables/useMapeosCampana'
import { catalogosService } from '@/services/catalogosService'
import type { CatalogoItem } from '@/types/catalogos'
import type { ColumnaCampanaModel } from '@/models/columnaCampana.model'
import { columnaService } from '@/services/columnaService'

import ColumnaCampanaTable from './ColumnaCampanaTable.vue'
import ColumnaCampanaModal from './ColumnaCampanaModal.vue'
import ColumnaDetailsModal from '../ColumnaDetailsModal.vue'

interface Option {
	label: string
	value: number
}

const columnasCatalogo = ref<Option[]>([])
const lineasCatalogo = ref<Option[]>([])
const campanasCatalogo = ref<Option[]>([])
const { mapeos, rawMapeos, fetchAll: fetchMapeos } = useMapeosCampana()
const { items, loading, error, fetchAll, toggle } = useColumnasCampana()

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
const selected = ref<ColumnaCampanaModel | null>(null)

async function fetchCatalogos() {
	const list: CatalogoItem[] = await catalogosService.getCatalogos('CLM')
	columnasCatalogo.value = list
		.filter(c => c.bolActivo)
		.map(c => ({ label: c.nombre, value: c.id }))
}

async function handleSave(payload: {
	idABCConfigMapeoCampana: number
	idABCCatColumna: number
	regex: string
}) {
	loading.value = true
	try {
		if (mode.value === 'add') {
			await columnaService.createColumnaCampana(
				payload.idABCConfigMapeoCampana,
				{
					idUsuario: 1,
					columna: {
						idABCConfigMapeoCampana: payload.idABCConfigMapeoCampana,
						idABCCatColumna: payload.idABCCatColumna,
						regex: payload.regex
					}
				}
			)
		} else {
			await columnaService.updateColumnaCampana({
				idUsuario: 1,
				columna: {
					idABCConfigMapeoCampana: payload.idABCConfigMapeoCampana,
					idABCCatColumna: payload.idABCCatColumna,
					regex: payload.regex
				}
			})
		}

		showModal.value = false
		await fetchAll()
	} catch (e: any) {
		console.error(e)
	} finally {
		loading.value = false
	}
}

function openAdd() {
	mode.value = 'add'
	selected.value = null
	showModal.value = true
}

function openEdit(item: ColumnaCampanaModel) {
	mode.value = 'edit'
	selected.value = item
	showModal.value = true
}

function openDetails(item: ColumnaCampanaModel) {
	selected.value = item
	showDetails.value = true
}

function toggleFilterMenu(column: string) {
	openFilter.value = openFilter.value === column ? null : column
}

onMounted(() => {
	fetchAll()
	fetchCatalogos()
	fetchMapeos()
	fetchCatalogosLineasYCampanas()
	updatePageSize()
	window.addEventListener('resize', updatePageSize)
})

async function fetchCatalogosLineasYCampanas() {
  const listL: CatalogoItem[] = await catalogosService.getCatalogos('LNN')
  lineasCatalogo.value = listL.filter(c => c.bolActivo).map(c => ({ label: c.nombre, value: c.id }))

  const listC: CatalogoItem[] = await catalogosService.getCatalogos('CMP')
  campanasCatalogo.value = listC.filter(c => c.bolActivo).map(c => ({ label: c.nombre, value: c.id }))
}

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
	<div @click.self="openFilter = null">
		<div class="">
			<div class="">
				<ColumnaCampanaTable
					:columnas="paginated"
					:mapeos="mapeos"
					:mapeos-raw="rawMapeos"
					:lineas-catalogo="lineasCatalogo"
					:campanas-catalogo="campanasCatalogo"
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

				<p
					v-if="error"
					class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
				>
					{{ error }}
				</p>
			</div>
		</div>

		<ColumnaCampanaModal
			:show="showModal"
			:mode="mode"
			:mapeos="mapeos"
			:columnas="columnasCatalogo"
			:initial-data="selected"
			:existing-items="items"
			:is-loading="loading"
			@close="showModal = false"
			@saved="handleSave"
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