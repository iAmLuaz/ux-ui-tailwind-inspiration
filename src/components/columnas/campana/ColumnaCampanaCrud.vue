<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useColumnasCampana } from '@/composables/columnas/campana/useColumnasCampana'
import { useMapeosCampana } from '@/composables/mapeos/campana/useMapeosCampana'
import { catalogosService } from '@/services/catalogos/catalogosService'
import type { CatalogoItem } from '@/types/catalogos/catalogos'
import type { ColumnaCampanaModel } from '@/models/columnas/campana/columnaCampana.model'

import ColumnaCampanaTable from './ColumnaCampanaTable.vue'
import ColumnaCampanaModal from './ColumnaCampanaModal.vue'
import ColumnaDetailsModal from '../ColumnaDetailsModal.vue'
import FormActionConfirmModal from '@/components/shared/FormActionConfirmModal.vue'

const props = defineProps<{
	mapeoId?: number | string | null
	mapeoNombre?: string
	selectedLineaId?: number | string | null
	selectedCampanaId?: number | string | null
	selectedLineaNombre?: string | null
	selectedCampanaNombre?: string | null
}>()

const emit = defineEmits<{
	(e: 'saved'): void
}>()

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

function toTimestamp(value?: string) {
	const parsed = value ? Date.parse(value) : Number.NaN
	return Number.isFinite(parsed) ? parsed : -1
}

function newestFirstCompare(
	left: { fechaCreacion?: string; mapeoId?: number; columnaId?: number },
	right: { fechaCreacion?: string; mapeoId?: number; columnaId?: number }
) {
	const leftTs = toTimestamp(left.fechaCreacion)
	const rightTs = toTimestamp(right.fechaCreacion)
	if (rightTs !== leftTs) return rightTs - leftTs

	const leftId = Number(left.mapeoId ?? 0) * 100000 + Number(left.columnaId ?? 0)
	const rightId = Number(right.mapeoId ?? 0) * 100000 + Number(right.columnaId ?? 0)
	return rightId - leftId
}

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
	}).sort(newestFirstCompare)
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
const showStatusConfirmModal = ref(false)
const pendingStatusItem = ref<ColumnaCampanaModel | null>(null)

const statusConfirmTitle = computed(() => {
	if (!pendingStatusItem.value) return 'Confirmar cambio de estatus'
	return pendingStatusItem.value.bolActivo
		? 'Confirmar desactivación'
		: 'Confirmar activación'
})

const statusConfirmMessage = computed(() => {
	if (!pendingStatusItem.value) return '¿Deseas continuar con este cambio de estatus?'
	const actionText = pendingStatusItem.value.bolActivo ? 'desactivar' : 'activar'
	return `¿Deseas ${actionText} esta columna?`
})

async function fetchCatalogos() {
	const catalogos = await catalogosService.getCatalogosAgrupados()
	const list: CatalogoItem[] = catalogos.find(group => group.codigo === 'CLM')?.registros ?? []
	columnasCatalogo.value = list
		.filter(c => c.bolActivo)
		.map(c => ({ label: c.nombre, value: c.id }))
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

async function handleSaved() {
	await Promise.all([
		fetchAll(props.mapeoId ?? null),
		fetchMapeos()
	])
	emit('saved')
}

function toggleFilterMenu(column: string) {
	openFilter.value = openFilter.value === column ? null : column
}

function requestStatusToggle(item: ColumnaCampanaModel) {
	pendingStatusItem.value = item
	showStatusConfirmModal.value = true
}

function closeStatusConfirmModal() {
	if (loading.value) return
	showStatusConfirmModal.value = false
	pendingStatusItem.value = null
}

async function confirmStatusToggle() {
	if (!pendingStatusItem.value) return
	await toggle(pendingStatusItem.value)
	showStatusConfirmModal.value = false
	pendingStatusItem.value = null
}

onMounted(() => {
	if (props.mapeoId !== undefined && props.mapeoId !== null) {
		selectedFilters.mapeos = [Number(props.mapeoId)]
	}
	fetchAll(props.mapeoId)
	fetchCatalogos()
	fetchMapeos()
	fetchCatalogosLineasYCampanas()
	updatePageSize()
	window.addEventListener('resize', updatePageSize)
})

async function fetchCatalogosLineasYCampanas() {
	const catalogos = await catalogosService.getCatalogosAgrupados()
	const listL: CatalogoItem[] = catalogos.find(group => group.codigo === 'LNN')?.registros ?? []
  lineasCatalogo.value = listL.filter(c => c.bolActivo).map(c => ({ label: c.nombre, value: c.id }))

	const listC: CatalogoItem[] = catalogos.find(group => group.codigo === 'CMP')?.registros ?? []
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

watch(() => props.mapeoId, (v) => {
    selectedFilters.mapeos = v !== undefined && v !== null ? [Number(v)] : []
    fetchAll(v)
})

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
					@toggle="requestStatusToggle"
					@add="openAdd"
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
			:key="mode + String(selected?.columnaId ?? 'new')"
			:show="showModal"
			:mode="mode"
			:mapeos="mapeos"
			:lineas="lineasCatalogo"
			:campanas="campanasCatalogo"
			:columnas="columnasCatalogo"
			:initial-data="selected"
			:existing-items="items"
			:is-loading="loading"
			:selected-mapeo-id="props.mapeoId"
			:selected-mapeo-nombre="props.mapeoNombre ?? null"
			:selected-linea-id="props.selectedLineaId ?? null"
			:selected-campana-id="props.selectedCampanaId ?? null"
			:selected-linea-nombre="props.selectedLineaNombre ?? null"
			:selected-campana-nombre="props.selectedCampanaNombre ?? null"
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
			:campanas="campanasCatalogo"
			:selected-linea-id="selected?.lineaId ?? props.selectedLineaId ?? null"
			:selected-linea-nombre="selected?.lineaNombre ?? props.selectedLineaNombre ?? null"
			:selected-campana-id="selected?.campanaId ?? props.selectedCampanaId ?? null"
			:selected-campana-nombre="selected?.campanaNombre ?? props.selectedCampanaNombre ?? null"
			@close="showDetails = false"
		/>

		<FormActionConfirmModal
			:show="showStatusConfirmModal"
			:title="statusConfirmTitle"
			:message="statusConfirmMessage"
			confirm-text="Guardar"
			cancel-text="Cancelar"
			:is-loading="loading"
			@confirm="confirmStatusToggle"
			@cancel="closeStatusConfirmModal"
		/>
	</div>
</template>