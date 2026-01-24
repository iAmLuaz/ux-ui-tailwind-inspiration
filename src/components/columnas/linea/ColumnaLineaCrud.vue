<!-- // src/components/columnas/ColumnaLineaCrud.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useColumnasLinea } from '@/composables/useColumnasLinea'
import ColumnaLineaTable from './ColumnaLineaTable.vue'
import ColumnaLineaModal from './ColumnaLineaModal.vue'
import ColumnaDetailsModal from '../ColumnaDetailsModal.vue'
import { Layers, Plus } from 'lucide-vue-next'
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

const pageSize = 10
const currentPage = ref(1)

const totalPages = computed(() =>
	Math.max(1, Math.ceil(items.value.length / pageSize))
)

const paginated = computed(() => {
	const start = (currentPage.value - 1) * pageSize
	return items.value.slice(start, start + pageSize)
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

onMounted(() => {
	fetchAll()
	fetchCatalogosColumnas()
	fetchMapeos()
})

</script>

<template>
	<div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
		<div class="max-w-7xl mx-auto space-y-4">
			<div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
				<div>
					<h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
						<Layers class="w-6 h-6" />
						Columnas de líneas
					</h1>
					<p class="text-sm text-slate-500 mt-1">
						Gestión de columnas y configuraciones por mapeo.
					</p>
				</div>

				<div class="flex items-center gap-3">
					<button
						@click="openAdd"
						class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
					>
						<Plus class="w-4 h-4" />
						<span>Nuevo</span>
					</button>
				</div>
			</div>

			<ColumnaLineaTable
				:columnas="paginated"
				:mapeos="mapeos"
				:columnas-catalogo="columnasCatalogo"
				:is-loading="loading"
				:current-page="currentPage"
				:total-pages="totalPages"
				@toggle="toggle"
				@edit="openEdit"
				@details="openDetails"
				@prev="currentPage--"
				@next="currentPage++"
			/>

			<p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
				{{ error }}
			</p>
		</div>

		<ColumnaLineaModal
			:key="mode + String(selected?.columnaId ?? 'new')"
			:show="showModal"
			:mode="mode"
			:initial-data="selected"
			:is-loading="loading"
			:columnas="columnasCatalogo"
			:mapeos="mapeos"
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
