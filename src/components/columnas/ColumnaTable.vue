<script setup lang="ts">
import { Filter, Edit3, Search, Eye } from 'lucide-vue-next'
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
</script>

<template>
	<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col min-h-[400px] h-[87vh] max-h-[calc(100vh-2rem)]">
		<div class="overflow-x-auto flex-1"  style="height: 100%; display: flex; justify-content: space-between; flex-flow: column nowrap;">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 font-semibold tracking-wider">
						<th class="px-4 py-3 relative w-48">
							<button
								type="button"
								class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
								:class="props.openFilter === 'linea' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
								@click.stop="emit('toggleFilter', 'linea')"
							>
								<span>Línea</span>
								<Filter
									class="w-3.5 h-3.5 transition-colors"
									:class="[
										props.selectedFilters.lineas.length < props.lineasDisponibles.length ? 'text-[#00357F] fill-blue-100' : 'text-slate-400',
										props.openFilter === 'linea' ? 'text-[#00357F]' : ''
									]"
								/>
							</button>

							<div
								v-if="props.openFilter === 'linea'"
								class="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
							>
								<div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
									<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por línea</span>
									<span class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline" @click="emit('selectAllLineas')">Ver todas</span>
								</div>
								<div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
									<label
										v-for="l in props.lineasDisponibles"
										:key="l.value"
										class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
									>
										<input
											type="checkbox"
											:value="l.value"
											v-model="props.selectedFilters.lineas"
											class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
										>
										<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
											{{ l.label }}
										</span>
									</label>
								</div>
							</div>
						</th>

						<th class="px-4 py-3 relative w-40">
							<button
								type="button"
								class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
								:class="props.openFilter === 'mapeo' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
								@click.stop="emit('toggleFilter', 'mapeo')"
							>
								<span>Mapeo</span>
								<Filter
									class="w-3.5 h-3.5 transition-colors"
									:class="[
										props.selectedFilters.mapeos.length && props.selectedFilters.mapeos.length < props.mapeosDisponibles.length
											? 'text-[#00357F] fill-blue-100'
											: 'text-slate-400',
										props.openFilter === 'mapeo' ? 'text-[#00357F]' : ''
									]"
								/>
							</button>

							<div
								v-if="props.openFilter === 'mapeo'"
								class="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
							>
								<div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
									<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por mapeo</span>
									<span class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline" @click="emit('selectAllMapeos')">Ver todos</span>
								</div>
								<div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
									<label
										v-for="m in props.mapeosDisponibles"
										:key="m.value"
										class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
									>
										<input
											type="checkbox"
											:value="m.value"
											v-model="props.selectedFilters.mapeos"
											class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
										>
										<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
											{{ m.label }}
										</span>
									</label>
								</div>
							</div>
						</th>

						<th v-if="props.activeTab === 'campana'" class="px-4 py-3 relative w-40">
							<button
								type="button"
								class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
								:class="props.openFilter === 'campana' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
								@click.stop="emit('toggleFilter', 'campana')"
							>
								<span>Campaña</span>
								<Filter
									class="w-3.5 h-3.5 transition-colors"
									:class="[
										props.selectedFilters.campanas.length && props.selectedFilters.campanas.length < props.campanasDisponibles.length
											? 'text-[#00357F] fill-blue-100'
											: 'text-slate-400',
										props.openFilter === 'campana' ? 'text-[#00357F]' : ''
									]"
								/>
							</button>

							<div
								v-if="props.openFilter === 'campana'"
								class="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
							>
								<div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
									<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por campaña</span>
									<span class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline" @click="emit('selectAllCampanas')">Ver todas</span>
								</div>
								<div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
									<label
										v-for="c in props.campanasDisponibles"
										:key="c.value"
										class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
									>
										<input
											type="checkbox"
											:value="c.value"
											v-model="props.selectedFilters.campanas"
											class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
										>
										<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
											{{ c.label }}
										</span>
									</label>
								</div>
							</div>
						</th>

						<th class="px-4 py-3 relative">
							<button
								type="button"
								class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
								:class="props.openFilter === 'nombre' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
								@click.stop="emit('toggleFilter', 'nombre')"
							>
								<span>Nombre</span>
								<Filter
									class="w-3.5 h-3.5 transition-colors"
									:class="[
										props.selectedFilters.nombres.length && props.selectedFilters.nombres.length < props.nombresDisponibles.length
											? 'text-[#00357F] fill-blue-100'
											: 'text-slate-400',
										props.openFilter === 'nombre' ? 'text-[#00357F]' : ''
									]"
								/>
							</button>

							<div
								v-if="props.openFilter === 'nombre'"
								class="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
							>
								<div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
									<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por nombre</span>
									<span class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline" @click="emit('selectAllNombres')">Ver todos</span>
								</div>
								<div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
									<label
										v-for="n in props.nombresDisponibles"
										:key="n.value"
										class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
									>
										<input
											type="checkbox"
											:value="n.value"
											v-model="props.selectedFilters.nombres"
											class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
										>
										<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
											{{ n.label }}
										</span>
									</label>
								</div>
							</div>
						</th>

						<th class="px-4 py-3 text-center w-24">Carga</th>
						<th class="px-4 py-3 text-center w-24">Validación</th>
						<th class="px-4 py-3 text-center w-24">Envío</th>

						<th class="px-4 py-3 relative w-36">
							<button
								type="button"
								class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
								:class="props.openFilter === 'status' ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
								@click.stop="emit('toggleFilter', 'status')"
							>
								<span>Estatus</span>
								<Filter
									class="w-3.5 h-3.5 transition-colors"
									:class="[
										props.selectedFilters.status.length < 2 ? 'text-[#00357F] fill-blue-100' : 'text-slate-400',
										props.openFilter === 'status' ? 'text-[#00357F]' : ''
									]"
								/>
							</button>

							<div
								v-if="props.openFilter === 'status'"
								class="absolute top-full right-0 md:left-0 mt-2 w-48 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
							>
								<div class="px-3 py-2 bg-slate-50 border-b border-slate-100">
									<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estatus</span>
								</div>
								<div class="p-1.5 space-y-0.5">
									<label class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none">
										<input
											type="checkbox"
											:value="true"
											v-model="props.selectedFilters.status"
											class="h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer"
										>
										<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">Activos</span>
									</label>
									<label class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none">
										<input
											type="checkbox"
											:value="false"
											v-model="props.selectedFilters.status"
											class="h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer"
										>
										<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">Inactivos</span>
									</label>
								</div>
							</div>
						</th>

						<!-- <th class="px-4 py-3 text-left">Detalle</th> -->
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
							<td class="px-4 py-2.5" @dblclick="emit('viewDetails', c)">
								<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
									{{ props.getLineaLabel(undefined) }}
								</span>
							</td>
							<td class="px-4 py-2.5 text-slate-600" @dblclick="emit('viewDetails', c)">Mapeo #{{ getMapeoId(c) }}</td>
							<td v-if="props.activeTab === 'campana'" class="px-4 py-2.5 text-slate-600" @dblclick="emit('viewDetails', c)">
								{{ 'idABCCatCampana' in c ? c.idABCCatCampana : '-' }}
							</td>
							<td class="px-4 py-2.5 font-semibold text-slate-700" @dblclick="emit('viewDetails', c)">Columna {{ c.idABCCatColumna }}</td>

							<td class="px-4 py-2.5 text-center" @dblclick="emit('viewDetails', c)">
								<input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#00357F]" :checked="c.bolCarga" disabled>
							</td>
							<td class="px-4 py-2.5 text-center" @dblclick="emit('viewDetails', c)">
								<input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#00357F]" :checked="c.bolValidacion" disabled>
							</td>
							<td class="px-4 py-2.5 text-center" @dblclick="emit('viewDetails', c)">
								<input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-[#00357F]" :checked="c.bolEnvio" disabled>
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

							<!-- <td class="px-4 py-2.5">
								<span class="text-sm text-slate-500">{{ props.isDetailsOpen(`${c.idABCConfigMapeoLinea}-${c.nombre}`) ? 'Abierto' : 'Cerrado' }}</span>
							</td> -->
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