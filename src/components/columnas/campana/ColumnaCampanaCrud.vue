<!-- // src/components/columnas/campana/ColumnaCampanaCrud.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useColumnasCampana } from '@/composables/useColumnasCampana'
import { useMapeosCampana } from '@/composables/useMapeosCampana'
import { catalogosService } from '@/services/catalogosService'
import type { CatalogoItem } from '@/types/catalogos'
import type { ColumnaCampanaModel } from '@/models/columnaCampana.model'
import { columnaService } from '@/services/columnaService'

import ColumnaCampanaTable from './ColumnaCampanaTable.vue'
import ColumnaCampanaModal from './ColumnaCampanaModal.vue'
import ColumnaDetailsModal from '../ColumnaDetailsModal.vue'
import { Megaphone, Plus } from 'lucide-vue-next'

interface Option {
	label: string
	value: number
}

const columnasCatalogo = ref<Option[]>([])
const { mapeos, fetchAll: fetchMapeos } = useMapeosCampana()
const { items, loading, error, fetchAll, toggle } = useColumnasCampana()

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
	bolCarga: boolean
	bolValidacion: boolean
	bolEnvio: boolean
	regex: string
}) {
	loading.value = true
	try {
		if (mode.value === 'add') {
			await columnaService.createColumnaCampana(
				payload.idABCConfigMapeoCampana,
				{
					idABCCatColumna: payload.idABCCatColumna,
					idUsuario: 1,
					regex: payload.regex
				}
			)
		} else {
			await columnaService.updateColumnaCampana({
				idABCConfigMapeoCampana: payload.idABCConfigMapeoCampana,
				idABCCatColumna: payload.idABCCatColumna,
				bolCarga: payload.bolCarga,
				bolValidacion: payload.bolValidacion,
				bolEnvio: payload.bolEnvio,
				regex: payload.regex,
				idUsuario: 1
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

onMounted(() => {
	fetchAll()
	fetchCatalogos()
	fetchMapeos()
})
</script>
<template>
	<div>
		<div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
			<div class="max-w-7xl mx-auto space-y-4">
				<div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
					<div>
						<h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
							<Megaphone class="w-6 h-6" />
							Columnas de mapeo de campañas
						</h1>
						<p class="text-sm text-slate-500 mt-1">
							Administración de columnas asociadas a mapeos de campañas.
						</p>
					</div>

					<button
						@click="openAdd"
						class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
					>
						<Plus class="w-4 h-4" />
						Nuevo
					</button>
				</div>

				<ColumnaCampanaTable
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
