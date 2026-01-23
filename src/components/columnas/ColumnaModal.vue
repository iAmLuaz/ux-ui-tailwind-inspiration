<!-- // src/components/columnas/ColumnaModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
interface NormalizedColumna {
	tipo: 'linea' | 'campana'
	mapeoId: number
	columnaId: number
	bolActivo: boolean
	bolCarga: boolean
	bolValidacion: boolean
	bolEnvio: boolean
	regex: string
	campanaId?: number
}

interface Option {
	label: string
	value: number
}

interface FormData {
	mapeoId?: number
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
	initialData?: NormalizedColumna | null
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
const showColumnaDropdown = ref(false)

watch(
	() => [props.initialData, props.mode],
	() => {
		formData.value = initializeFormData()
		columnaSearch.value = getColumnaLabel(formData.value.idABCCatColumna)
	}
)

watch(
	() => props.show,
	(show) => {
		if (show) {
			columnaSearch.value = getColumnaLabel(formData.value.idABCCatColumna)
			showColumnaDropdown.value = false
		}
	}
)

function initializeFormData(): FormData {
	if (props.initialData) {
		return {
			mapeoId: props.initialData.mapeoId,
			idABCCatColumna: props.initialData.columnaId ?? '',
			regex: props.initialData.regex ?? '',
			bolCarga: Boolean(props.initialData.bolCarga),
			bolValidacion: Boolean(props.initialData.bolValidacion),
			bolEnvio: Boolean(props.initialData.bolEnvio)
		}
	}

	const defaultMapeo = undefined
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
	if (!formData.value.mapeoId) return
	if (!formData.value.idABCCatColumna) return
	emit('save', formData.value)
}

function getColumnaLabel(id?: number | '') {
	if (!id) return ''
	return props.columnasDisponibles.find(opt => opt.value === id)?.label ?? ''
}

function selectColumna(opt: Option) {
	formData.value.idABCCatColumna = opt.value
	columnaSearch.value = opt.label
	showColumnaDropdown.value = false
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
							v-model.number="formData.mapeoId"
							class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
							required
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
						<div class="relative">
							<button
								id="field-columna"
								type="button"
								class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none text-left bg-white"
								@click="showColumnaDropdown = !showColumnaDropdown"
							>
								<span class="truncate" :class="formData.idABCCatColumna ? 'text-gray-700' : 'text-gray-400'">
									{{ formData.idABCCatColumna ? getColumnaLabel(formData.idABCCatColumna) : 'Seleccione una opción' }}
								</span>
								<span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
							</button>

							<div
								v-if="showColumnaDropdown"
								class="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
							>
								<div class="p-2 border-b border-slate-100">
									<input
										v-model="columnaSearch"
										type="text"
										placeholder="Buscar columna..."
										class="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] outline-none"
										@keydown.esc="showColumnaDropdown = false"
									/>
								</div>
								<ul class="max-h-56 overflow-y-auto">
									<li
										v-for="opt in filteredColumnas"
										:key="opt.value"
										class="px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 cursor-pointer"
										@mousedown.prevent="selectColumna(opt)"
									>
										{{ opt.label }}
									</li>
									<li v-if="filteredColumnas.length === 0" class="px-4 py-3 text-sm text-gray-400">
										Sin resultados
									</li>
								</ul>
							</div>
						</div>
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