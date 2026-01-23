<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { ColumnaData, ColumnaCampanaData } from '../../types/columna'

interface Option {
	label: string
	value: number
}

interface FormData {
	mapeoId?: number | ''
	idABCCatColumna: number | ''
	regex: string
	bolCarga: boolean
	bolValidacion: boolean
	bolEnvio: boolean
}

interface Props {
	show: boolean
	mode: 'add' | 'edit'
	activeTab: 'linea' | 'campana'
	mapeosDisponibles: Option[]
	columnasDisponibles: Option[]
	initialData?: (ColumnaData | ColumnaCampanaData) | null
	isLoading?: boolean
}

interface Emits {
	(e: 'save', data: FormData): void
	(e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
	isLoading: false
})

const emit = defineEmits<Emits>()

const formData = ref<FormData>(initializeFormData())
const columnaSearch = ref('')

const isEditing = computed(() => props.mode === 'edit')


watch(
	() => [props.initialData, props.activeTab, props.mapeosDisponibles, props.columnasDisponibles],
	() => {
		formData.value = initializeFormData()
	}
)

function getMapeoId(item: ColumnaData | ColumnaCampanaData | null | undefined) {
	if (!item) return ''
	return 'idABCConfigMapeoCampana' in item
		? item.idABCConfigMapeoCampana
		: item.idABCConfigMapeoLinea
}

function initializeFormData(): FormData {
	if (props.initialData) {
		return {
			mapeoId: getMapeoId(props.initialData) as number,
			idABCCatColumna: props.initialData.idABCCatColumna ?? '',
			regex: props.initialData.regex ?? '',
			bolCarga: Boolean(props.initialData.bolCarga),
			bolValidacion: Boolean(props.initialData.bolValidacion),
			bolEnvio: Boolean(props.initialData.bolEnvio)
		}
	}

	const defaultMapeo = props.mapeosDisponibles[0]?.value ?? ''
	const defaultColumna = ''
	return {
		mapeoId: defaultMapeo,
		idABCCatColumna: defaultColumna,
		regex: '',
		bolCarga: false,
		bolValidacion: false,
		bolEnvio: false
	}
}

function handleSave() {
	emit('save', formData.value)
}

const filteredColumnas = computed(() => {
	const query = columnaSearch.value.trim().toLowerCase()
	if (!query) return props.columnasDisponibles
	return props.columnasDisponibles.filter(opt =>
		opt.label.toLowerCase().includes(query)
	)
})
</script>

<template>
	<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
			<div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
				<h3 class="text-lg font-bold text-white flex items-center gap-2">
					{{ mode === 'add' ? 'Nuevo Registro' : 'Editar Registro' }}
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
				<form @submit.prevent="handleSave" class="space-y-5">
					<div>
						<label for="field-mapeo" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
							Mapeo <span class="text-red-500 ml-1">*</span>
						</label>
						<select
							id="field-mapeo"
							v-model="formData.mapeoId"
							class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
							:class="isEditing ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 cursor-pointer'"
							required
							:disabled="isEditing"
						>
							<option value="" disabled class="text-gray-400">Seleccione una opción</option>
							<option v-for="opt in mapeosDisponibles" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
					</div>

					<div>
						<label for="field-columna" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
							Columna <span class="text-red-500 ml-1">*</span>
						</label>
						<input
							v-model="columnaSearch"
							type="text"
							placeholder="Buscar columna..."
							class="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none"
							:disabled="isEditing"
						/>
						<select
							id="field-columna"
							v-model="formData.idABCCatColumna"
							class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
							:class="isEditing ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 cursor-pointer'"
							required
							:disabled="isEditing"
						>
							<option value="" disabled class="text-gray-400">Seleccione una opción</option>
							<option v-for="opt in filteredColumnas" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
					</div>

					<div>
						<label for="field-regex" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
							Regex <span class="text-red-500 ml-1">*</span>
						</label>
						<textarea
							id="field-regex"
							v-model="formData.regex"
							class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400 resize-none"
							required
							rows="3"
							placeholder="Ej. ^[A-Z]+$"
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<label class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
							<input
								type="checkbox"
								v-model="formData.bolCarga"
								class="h-4 w-4 rounded border-slate-300 text-[#00357F]"
							/>
							<span class="font-semibold text-slate-600">Carga</span>
						</label>
						<label class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
							<input
								type="checkbox"
								v-model="formData.bolValidacion"
								class="h-4 w-4 rounded border-slate-300 text-[#00357F]"
							/>
							<span class="font-semibold text-slate-600">Validación</span>
						</label>
						<label class="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
							<input
								type="checkbox"
								v-model="formData.bolEnvio"
								class="h-4 w-4 rounded border-slate-300 text-[#00357F]"
							/>
							<span class="font-semibold text-slate-600">Envío</span>
						</label>
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