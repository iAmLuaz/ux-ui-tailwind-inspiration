<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { columnaService } from '@/services/columnaService'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'
import type { ColumnaLineaModel, ColumnaValor } from '@/models/columnaLinea.model'

interface Option {
	label: string
	value: number
}

const props = defineProps<{
	show: boolean
	mode: 'add' | 'edit'
	initialData: ColumnaLineaModel | null
	isLoading: boolean
	mapeos: Option[]
	columnas: Option[]
	existingItems: ColumnaLineaModel[]
}>()

const emit = defineEmits(['close', 'saved'])

const form = ref<{ idABCConfigMapeoLinea: number; idABCCatColumna: number; regex: string; obligatorio: boolean; valor: ColumnaValor | null }>({
	idABCConfigMapeoLinea: 0,
	idABCCatColumna: 0,
	regex: '',
	obligatorio: false,
	valor: null
})

const isEditing = computed(() => props.mode === 'edit')

const availableColumnas = computed(() => {
	const selectedMapeo = form.value.idABCConfigMapeoLinea
	if (!selectedMapeo) return props.columnas

	const taken = new Set(
		props.existingItems
			.filter(item => item.mapeoId === selectedMapeo)
			.map(item => item.columnaId)
	)

	return props.columnas.filter(option => {
		if (isEditing.value && option.value === form.value.idABCCatColumna) return true
		return !taken.has(option.value)
	})
})

function resetForm() {
	form.value = {
		idABCConfigMapeoLinea: 0,
		idABCCatColumna: 0,
		regex: '',
		obligatorio: false,
		valor: null
	}
}

watch(
	[
		() => props.show,
		() => props.mode,
		() => props.initialData
	],
	(
		[show, mode, initialData]: [
			boolean,
			'add' | 'edit',
			ColumnaLineaModel | null
		]
	) => {
		if (!show) return

		if (mode === 'add') {
			resetForm()
			return
		}

		if (mode === 'edit' && initialData) {
			form.value = {
				idABCConfigMapeoLinea: initialData.mapeoId,
				idABCCatColumna: initialData.columnaId,
				regex: initialData.regex ?? '',
				obligatorio: initialData.obligatorio ?? false,
				valor: initialData.valor ?? null
			}
		}
	},
	{ immediate: true }
)

watch(
	() => form.value.idABCConfigMapeoLinea,
	() => {
		if (!form.value.idABCCatColumna) return
		const stillAvailable = availableColumnas.value.some(
			c => c.value === form.value.idABCCatColumna
		)
		if (!stillAvailable) {
			form.value.idABCCatColumna = 0
		}
	}
)

async function save() {
	if (props.mode === 'add') {
		await columnaService.createColumnaLinea(
				form.value.idABCConfigMapeoLinea,
				{
					idUsuario: 1,
					columna: {
						idABCConfigMapeoLinea: form.value.idABCConfigMapeoLinea,
						idABCCatColumna: form.value.idABCCatColumna,
						regex: form.value.regex || null,
						obligatorio: form.value.obligatorio ?? null,
						valor: form.value.valor ?? null
					}
				}
			)
	} else {
		await columnaService.updateColumnaLinea({
			idUsuario: 1,
			columna: {
				idABCConfigMapeoLinea: form.value.idABCConfigMapeoLinea,
				idABCCatColumna: form.value.idABCCatColumna,
				regex: form.value.regex || null,
				obligatorio: form.value.obligatorio ?? null,
				valor: form.value.valor ?? null
			}
		})
	}

	emit('saved')
	emit('close')
}

</script>

<template>
	<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
			<div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
				<h3 class="text-lg font-bold text-white flex items-center gap-2">
					{{ mode === 'add' ? 'Nueva columna' : 'Editar columna' }}
				</h3>
				<button
					@click="$emit('close')"
					:disabled="isLoading"
					class="text-white/70 hover:text-white transition-colors text-2xl leading-none focus:outline-none cursor-pointer"
				>
					&times;
				</button>
			</div>

			<div class="p-6 overflow-y-auto custom-scrollbar">
				<form @submit.prevent="save" class="space-y-5">
					<div>
						<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
							Mapeo <span class="text-red-500 ml-1">*</span>
						</label>
						<div class="relative">
							<SearchableSelect
								v-model="form.idABCConfigMapeoLinea"
								:options="mapeos"
								:disabled="isEditing"
								placeholder="Seleccione una opción"
							/>
						</div>
					</div>

					<div>
						<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
							Columna <span class="text-red-500 ml-1">*</span>
						</label>
						<div class="relative">
							<SearchableSelect
								v-model="form.idABCCatColumna"
								:options="availableColumnas"
								:disabled="isEditing"
								placeholder="Seleccione una opción"
							/>
						</div>
					</div>

                    

					<div>
						<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Regex</label>
						<textarea
							v-model="form.regex"
							class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400 resize-none font-mono"
							rows="2"
							placeholder="Expresión regular para validación"
						></textarea>
					</div>

					<div class="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
						<button
							type="button"
							class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
							@click="$emit('close')"
							:disabled="isLoading"
						>
							Cancelar
						</button>
						<button
							type="submit"
							class="px-5 py-2.5 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
							:disabled="isLoading"
						>
							<svg v-if="isLoading" class="animate-spin h-4 w-4 text-[#00357F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							{{ isLoading ? 'Guardando...' : 'Guardar' }}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 10px;
}
</style>