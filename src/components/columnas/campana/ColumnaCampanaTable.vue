<!-- // src/components/columnas/campana/ColumnaCampanaTable.vue -->
<script setup lang="ts">
import { Eye, Edit3, Search } from 'lucide-vue-next'
import type { ColumnaCampanaModel } from '@/models/columnaCampana.model'

interface Option {
	label: string
	value: number
}

const props = defineProps<{
	columnas: ColumnaCampanaModel[]
	mapeos: Option[]
	columnasCatalogo: Option[]
	isLoading: boolean
	currentPage: number
	totalPages: number
}>()

const emit = defineEmits<{
	(e: 'toggle', item: ColumnaCampanaModel): void
	(e: 'edit', item: ColumnaCampanaModel): void
	(e: 'details', item: ColumnaCampanaModel): void
	(e: 'prev'): void
	(e: 'next'): void
}>()

function getMapeoLabel(id: number) {
	return props.mapeos.find(m => m.value === id)?.label ?? `Mapeo ${id}`
}

function getColumnaLabel(id: number) {
	return props.columnasCatalogo.find(c => c.value === id)?.label ?? `Columna ${id}`
}
</script>

<template>
	<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible flex flex-col min-h-[400px] h-[87vh] max-h-[calc(100vh-2rem)]">
		<div class="overflow-x-auto flex-1" style="height: 100%; display: flex; justify-content: space-between; flex-flow: column nowrap;">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="border-b border-slate-200 bg-slate-50/50 text-xs text-slate-500 font-semibold tracking-wider">
						<th class="px-4 py-3 text-left">Mapeo</th>
						<th class="px-4 py-3 text-left">Columna</th>
						<th class="px-4 py-3 text-center w-24">Activo</th>
						<th class="px-4 py-3 text-center w-20">Cargar</th>
						<th class="px-4 py-3 text-center w-20">Validar</th>
						<th class="px-4 py-3 text-center w-20">Enviar</th>
						<th class="px-4 py-3 text-left">Regex</th>
						<th class="px-4 py-3 text-right w-24">Acciones</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-slate-100">
					<tr v-if="isLoading">
						<td colspan="100%" class="px-4 py-12">
							<div class="flex flex-col items-center justify-center text-slate-500">
								<div class="w-6 h-6 border-2 border-[#00357F] border-t-transparent rounded-full animate-spin mb-2"></div>
								<span class="text-sm font-medium">Cargando datos...</span>
							</div>
						</td>
					</tr>

					<tr v-else-if="props.columnas.length === 0">
						<td colspan="100%" class="px-4 py-12">
							<div class="flex flex-col items-center justify-center text-slate-400">
								<Search class="w-8 h-8 mb-2 opacity-50" />
								<span class="text-sm">No hay registros.</span>
							</div>
						</td>
					</tr>

					<template v-else>
						<tr
							v-for="c in props.columnas"
							:key="`${c.mapeoId}-${c.columnaId}`"
								class="hover:bg-blue-50/30 transition-colors text-sm"
								@dblclick="emit('details', c)"
						>
							<td class="px-4 py-2.5 font-medium text-slate-700">
								{{ getMapeoLabel(c.mapeoId) }}
							</td>

							<td class="px-4 py-2.5 text-slate-600">
								{{ getColumnaLabel(c.columnaId) }}
							</td>

							<td class="px-4 py-2.5 text-center">
								<label
									class="inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer group select-none"
									:class="c.bolActivo
										? 'bg-blue-50 border-blue-200 hover:border-blue-300'
										: 'bg-slate-50 border-slate-200 hover:border-slate-300'"
								>
									<input
										type="checkbox"
										:checked="c.bolActivo"
										@change="emit('toggle', c)"
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

							<td class="px-4 py-2.5 text-center">
								<div class="flex justify-center">
									<input
										type="checkbox"
										:checked="c.bolCarga"
										disabled
										class="h-4 w-4 rounded border-slate-300 text-[#00357F] bg-slate-100"
									/>
								</div>
							</td>

							<td class="px-4 py-2.5 text-center">
								<div class="flex justify-center">
									<input
										type="checkbox"
										:checked="c.bolValidacion"
										disabled
										class="h-4 w-4 rounded border-slate-300 text-[#00357F] bg-slate-100"
									/>
								</div>
							</td>

							<td class="px-4 py-2.5 text-center">
								<div class="flex justify-center">
									<input
										type="checkbox"
										:checked="c.bolEnvio"
										disabled
										class="h-4 w-4 rounded border-slate-300 text-[#00357F] bg-slate-100"
									/>
								</div>
							</td>

							<td class="px-4 py-2.5 text-slate-500 font-mono text-xs truncate max-w-[200px]" :title="c.regex">
								{{ c.regex || '—' }}
							</td>

							<td class="px-4 py-2.5 text-right">
								<div class="inline-flex items-center justify-end gap-2">
									<button
										@click="emit('details', c)"
										class="relative p-1.5 text-slate-400 hover:text-[#00357F] hover:bg-blue-50 rounded-md transition-colors cursor-pointer group"
										aria-label="Ver detalles"
									>
										<Eye class="w-4 h-4" />
										<span class="absolute whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Ver detalles</span>
									</button>

									<button
										@click.stop.prevent="emit('edit', c)"
										class="relative p-1.5 text-slate-400 hover:text-[#00357F] hover:bg-blue-50 rounded-md transition-colors cursor-pointer group"
										aria-label="Editar registro"
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
				<span>Mostrando {{ props.columnas.length }} registros</span>
				<div class="flex gap-2 items-center">
					<button
						class="hover:text-[#00357F] disabled:opacity-50"
						:disabled="props.currentPage <= 1"
						@click="emit('prev')"
					>
						Anterior
					</button>
					<span class="text-[11px] text-slate-400">{{ props.currentPage }} / {{ props.totalPages }}</span>
					<button
						class="hover:text-[#00357F] disabled:opacity-50"
						:disabled="props.currentPage >= props.totalPages"
						@click="emit('next')"
					>
						Siguiente
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
