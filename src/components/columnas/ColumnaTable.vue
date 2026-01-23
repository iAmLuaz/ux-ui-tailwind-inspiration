<script setup lang="ts">
import { Edit3, Search, Eye } from 'lucide-vue-next'
import type { ColumnaData, ColumnaCampanaData } from '../../types/columna.ts'

type ColumnaRow = ColumnaData | ColumnaCampanaData

interface Option {
	label: string
	value: number | string
}

interface SelectedFilters {
	lineas: number[]
	mapeos: number[]
	campanas: number[]
	nombres: string[]
	status: boolean[]
}

interface Props {
	activeTab: 'linea' | 'campana'
	lineasDisponibles: Option[]
	mapeosDisponibles: Option[]
	campanasDisponibles: Option[]
	nombresDisponibles: Option[]
	selectedFilters: SelectedFilters
	openFilter: string | null
	filteredColumnas: ColumnaRow[]
	totalColumnas: number
	currentPage: number
	totalPages: number
	canPrevPage: boolean
	canNextPage: boolean
	isLoading: boolean
	getLineaLabel: (id?: number) => string
	getColumnaLabel: (id?: number) => string
	getCampanaLabelByMapeoId: (mapeoId?: number) => string
}

interface Emits {
	(e: 'toggleFilter', column: string): void
	(e: 'selectAllLineas'): void
	(e: 'selectAllMapeos'): void
	(e: 'selectAllNombres'): void
	(e: 'selectAllCampanas'): void
	(e: 'viewDetails', item: ColumnaRow): void
	(e: 'toggleStatus', item: ColumnaRow): void
	(e: 'edit', item: ColumnaRow): void
	(e: 'prevPage'): void
	(e: 'nextPage'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getMapeoId = (item: ColumnaRow) =>
	'idABCConfigMapeoCampana' in item ? item.idABCConfigMapeoCampana : item.idABCConfigMapeoLinea

const getLineaCatalogLabel = (id?: number) =>
	props.lineasDisponibles.find(x => Number(x.value) === id)?.label || (id ? `Línea ${id}` : 'N/A')

</script>

<template>
	<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col min-h-[400px] h-[87vh] max-h-[calc(100vh-2rem)]">
		<div class="overflow-x-auto flex-1"  style="height: 100%; display: flex; justify-content: space-between; flex-flow: column nowrap;">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 font-semibold tracking-wider">
						<th v-if="props.activeTab === 'linea'" class="px-4 py-3">idABCConfigMapeoLinea</th>
						<th v-if="props.activeTab === 'campana'" class="px-4 py-3">idABCConfigMapeoCampana</th>
						<th class="px-4 py-3">idABCCatColumna</th>
						<th class="px-4 py-3">bolActivo</th>
						<th class="px-4 py-3">bolCarga</th>
						<th class="px-4 py-3">bolValidacion</th>
						<th class="px-4 py-3">bolEnvio</th>
						<th class="px-4 py-3">regex</th>
						<th class="px-4 py-3 text-right w-20">Acciones</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-slate-100">
					<tr v-if="props.isLoading">
						<td colspan="100%" class="px-4 py-12">
							<div class="flex flex-col items-center justify-center text-slate-500">
								<div class="w-6 h-6 border-2 border-[#00357F] border-t-transparent rounded-full animate-spin mb-2"></div>
								<span class="text-sm font-medium">Cargando datos...</span>
							</div>
						</td>
					</tr>

					<tr v-else-if="props.filteredColumnas.length === 0">
						<td colspan="100%" class="px-4 py-12">
							<div class="flex flex-col items-center justify-center text-slate-400">
								<Search class="w-8 h-8 mb-2 opacity-50" />
								<span class="text-sm">No hay registros que coincidan con los filtros.</span>
							</div>
						</td>
					</tr>

					<template v-else v-for="c in props.filteredColumnas" :key="`${getMapeoId(c)}-${c.idABCCatColumna}`">
						<tr class="hover:bg-blue-50/30 transition-colors text-sm">
							<td v-if="props.activeTab === 'linea'" class="px-4 py-2.5" @dblclick="emit('viewDetails', c)">
								{{ getLineaCatalogLabel('idABCConfigMapeoLinea' in c ? c.idABCConfigMapeoLinea : undefined) }}
							</td>
							<td v-if="props.activeTab === 'campana'" class="px-4 py-2.5" @dblclick="emit('viewDetails', c)">
								{{ props.getCampanaLabelByMapeoId('idABCConfigMapeoCampana' in c ? c.idABCConfigMapeoCampana : undefined) }}
							</td>
							<td class="px-4 py-2.5" @dblclick="emit('viewDetails', c)">
								{{ props.getColumnaLabel(c.idABCCatColumna) }}
							</td>
							<td class="px-4 py-2.5" @dblclick="emit('viewDetails', c)">
								<label
									class="inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer group select-none"
									:class="c.bolActivo ? 'bg-blue-50 border-blue-200 hover:border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'"
								>
									<input
										type="checkbox"
										:checked="c.bolActivo"
										@change="emit('toggleStatus', c)"
										class="sr-only peer"
									>
									<span
										class="h-2 w-2 rounded-full transition-colors duration-200 shadow-sm"
										:class="c.bolActivo ? 'bg-[#00357F]' : 'bg-[#AD0A0A]'"
									></span>
									<span
										class="text-xs font-semibold transition-colors duration-200"
										:class="c.bolActivo ? 'text-[#00357F]' : 'text-slate-500'"
									>
										{{ c.bolActivo ? 'Activo' : 'Inactivo' }}
									</span>
								</label>
							</td>
							<td class="px-4 py-2.5 text-center" @dblclick="emit('viewDetails', c)">
								<input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#00357F]" :checked="c.bolCarga" disabled>
							</td>
							<td class="px-4 py-2.5 text-center" @dblclick="emit('viewDetails', c)">
								<input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#00357F]" :checked="c.bolValidacion" disabled>
							</td>
							<td class="px-4 py-2.5 text-center" @dblclick="emit('viewDetails', c)">
								<input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#00357F]" :checked="c.bolEnvio" disabled>
							</td>
							<td class="px-4 py-2.5" @dblclick="emit('viewDetails', c)">{{ c.regex }}</td>

							<td class="px-4 py-2.5 text-right">
								<div class="inline-flex items-center justify-end gap-2">
									<button
										@click.stop="emit('viewDetails', c)"
										@dblclick.stop
										class="relative p-1.5 text-slate-400 hover:text-[#00357F] hover:bg-blue-50 rounded-md transition-colors cursor-pointer group"
										aria-label="Ver detalles"
									>
										<Eye class="w-4 h-4" />
										<span class="absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Ver detalles</span>
									</button>

									<button
										@click.stop="emit('edit', c)"
										@dblclick.stop
										class="relative p-1.5 text-slate-400 hover:text-[#00357F] hover:bg-blue-50 rounded-md transition-colors cursor-pointer group"
										aria-label="Modificar"
									>
										<Edit3 class="w-4 h-4" />
										<span class="absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Modificar</span>
									</button>
								</div>
							</td>
						</tr>
					</template>
				</tbody>
			</table>

			<div class="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center rounded-b-xl">
				<span>Mostrando {{ props.filteredColumnas.length }} de {{ props.totalColumnas }} registros</span>
				<div class="flex gap-2 items-center">
					<button
						class="hover:text-[#00357F] disabled:opacity-50"
						:disabled="!props.canPrevPage"
						@click="emit('prevPage')"
					>
						Anterior
					</button>
					<span class="text-[11px] text-slate-400">{{ props.currentPage }} / {{ props.totalPages }}</span>
					<button
						class="hover:text-[#00357F] disabled:opacity-50"
						:disabled="!props.canNextPage"
						@click="emit('nextPage')"
					>
						Siguiente
					</button>
				</div>
			</div>
		</div>
	</div>
</template>