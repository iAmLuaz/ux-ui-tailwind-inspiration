<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { columnaService } from '../services/columnaService'
import type { ColumnaData, ColumnaCampanaData } from '../types/columna'
import ColumnaTable from '@/components/columnas/ColumnaTable.vue'
import { Layers, Megaphone } from 'lucide-vue-next'

const tabs = [
	{ key: 'linea', label: 'Líneas de negocio', icon: Layers },
	{ key: 'campana', label: 'Campañas', icon: Megaphone }
] as const
type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('linea')

const lineasDisponibles = [
	{ label: 'Afore', value: 1 },
	{ label: 'Sofom', value: 2 },
	{ label: 'Pensiones', value: 3 }
]

type ColumnaRow = ColumnaData | ColumnaCampanaData
const columnas = ref<ColumnaRow[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const openFilter = ref<string | null>(null)

const selectedFilters = reactive({
	lineas: [] as number[],
	mapeos: [] as number[],
	campanas: [] as number[],
	nombres: [] as string[],
	status: [] as boolean[]
})

const mapeoId = 1

async function fetchColumnas() {
	isLoading.value = true
	error.value = null
	try {
		const data = activeTab.value === 'linea'
			? await columnaService.getColumnasByMapeo(mapeoId)
			: await columnaService.getColumnasCampana()
		columnas.value = data

		if (selectedFilters.lineas.length === 0) {
			selectedFilters.lineas = lineasDisponibles.map(x => x.value)
			selectedFilters.status = [true, false]
		}
		if (selectedFilters.mapeos.length === 0) {
			selectedFilters.mapeos = mapeosDisponibles.value.map(x => Number(x.value))
		}
		if (activeTab.value === 'campana' && selectedFilters.campanas.length === 0) {
			selectedFilters.campanas = campanasDisponibles.value.map(x => Number(x.value))
		}
		if (selectedFilters.nombres.length === 0) {
			selectedFilters.nombres = nombresDisponibles.value.map(x => String(x.value))
		}
	} catch (e: any) {
		error.value = e.message
	} finally {
		isLoading.value = false
	}
}

const getLineaLabel = (id?: number) => lineasDisponibles.find(x => x.value === id)?.label || 'N/A'

const getColumnaNombre = (item: ColumnaRow) => `Columna ${item.idABCCatColumna}`

const mapeosDisponibles = computed(() => {
	const ids = new Set<number>()
	columnas.value.forEach(c => ids.add(c.idABCConfigMapeoLinea))
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
			? selectedFilters.mapeos.includes(item.idABCConfigMapeoLinea)
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
				: false)
			: true

		return matchLinea && matchMapeo && matchNombre && matchStatus && matchCampana
	})
})
const campanasDisponibles = computed(() => {
	if (activeTab.value !== 'campana') return [] as { label: string; value: number }[]
	const ids = new Set<number>()
	columnas.value.forEach(c => {
		if ('idABCCatCampana' in c) ids.add(c.idABCCatCampana)
	})
	return Array.from(ids).sort((a, b) => a - b).map(id => ({
		label: `Campaña ${id}`,
		value: id
	}))
})

const openDetails = ref(new Set<string>())

function toggleDetails(key: string) {
	const next = new Set(openDetails.value)
	if (next.has(key)) next.delete(key)
	else next.add(key)
	openDetails.value = next
}

function isDetailsOpen(key: string) {
	return openDetails.value.has(key)
}

const toggleFilterMenu = (column: string) => {
	openFilter.value = openFilter.value === column ? null : column
}

function toggleStatus(item: ColumnaData) {
	item.bolActivo = !item.bolActivo
	console.log('[columnas] toggle status:', { id: item.idABCConfigMapeoLinea, bolActivo: item.bolActivo })
}

function handleEdit(item: ColumnaData) {
	console.log('[columnas] edit:', item)
}

function handleTabChange(tab: TabKey) {
	if (activeTab.value === tab) return
	activeTab.value = tab
	selectedFilters.lineas = []
	selectedFilters.mapeos = []
	selectedFilters.campanas = []
	selectedFilters.nombres = []
	selectedFilters.status = []
	openDetails.value = new Set()
	fetchColumnas()
}

onMounted(fetchColumnas)
</script>

<template>
	<div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="openFilter = null">
		<div class="max-w-7xl mx-auto space-y-4">
			<div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
				<div>
				<h1 class="text-2xl font-bold text-[#00357F] tracking-tight">Columnas</h1>
				<p class="text-sm text-slate-500 mt-1">Gestión de columnas por mapeo.</p>
				</div>
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
			</div>

			<ColumnaTable
				:active-tab="activeTab"
				:lineas-disponibles="lineasDisponibles"
				:mapeos-disponibles="mapeosDisponibles"
				:campanas-disponibles="campanasDisponibles"
				:nombres-disponibles="nombresDisponibles"
				:selected-filters="selectedFilters"
				:open-filter="openFilter"
				:filtered-columnas="filteredColumnas"
				:is-loading="isLoading"
				:get-linea-label="getLineaLabel"
				:is-details-open="isDetailsOpen"
				@toggle-filter="toggleFilterMenu"
				@toggle-details="toggleDetails"
				@select-all-lineas="selectedFilters.lineas = lineasDisponibles.map(x => x.value)"
				@select-all-mapeos="selectedFilters.mapeos = mapeosDisponibles.map(x => Number(x.value))"
				@select-all-campanas="selectedFilters.campanas = campanasDisponibles.map(x => Number(x.value))"
				@select-all-nombres="selectedFilters.nombres = nombresDisponibles.map(x => String(x.value))"
				@toggle-status="toggleStatus"
				@edit="handleEdit"
			/>

			<p v-if="error" class="text-sm text-red-600">{{ error }}</p>
		</div>
	</div>
</template>