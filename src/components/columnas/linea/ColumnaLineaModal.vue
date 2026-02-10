<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { catalogosService } from '@/services/catalogosService'
import { columnaService } from '@/services/columnaService'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'
import type { ColumnaLineaModel } from '@/models/columnaLinea.model'

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
	lineas?: Option[]
	existingItems: ColumnaLineaModel[]
	selectedMapeoId?: number | string | null
	selectedLineaId?: number | string | null
	selectedMapeoNombre?: string | null
	selectedLineaNombre?: string | null
}>()

const emit = defineEmits(['close', 'saved'])

const form = ref<any>({
	idABCConfigMapeoLinea: 0,
	lineaId: null,
	idABCCatColumna: 0,
	regex: '',
	obligatorio: true,
	valor: {
		tipoSel: null,
		tipoId: null,
		cadena: {
			tipoId: null,
			minimo: null,
			maximo: null
		},
		numero: {
			tipoId: null,
			enteros: null,
			decimales: null
		}
	}
})

const valOptions = ref<Option[]>([])
const cdnOptions = ref<Option[]>([])
const nmrOptions = ref<Option[]>([])
const valItems = ref<any[]>([])

async function fetchTipoOptions() {
	try {
		const [nmr, cdn, val] = await Promise.all([
			catalogosService.getCatalogos('NMR'),
			catalogosService.getCatalogos('CDN'),
			catalogosService.getCatalogos('VAL')
		])
		valItems.value = val || []
		valOptions.value = (valItems.value || []).map(i => ({ label: i.nombre, value: i.id }))
		cdnOptions.value = (cdn || []).map(i => ({ label: i.nombre, value: i.id }))
		nmrOptions.value = (nmr || []).map(i => ({ label: i.nombre, value: i.id }))
	} catch (e) {
		valOptions.value = []
		cdnOptions.value = []
		nmrOptions.value = []
	}
}

onMounted(() => {
	fetchTipoOptions()
})

const isEditing = computed(() => props.mode === 'edit')

const selectedVal = computed(() => {
	const id = form.value.valor.tipoSel
	return valItems.value.find((i: any) => i.id === id) ?? null
})

const isCadena = computed(() => {
	const s = selectedVal.value
	if (!s) return false
	const code = String(s.codigo || s.nombre || '').toUpperCase()
	return code.includes('CDN') || code.includes('CADENA')
})

const isNumero = computed(() => {
	const s = selectedVal.value
	if (!s) return false
	const code = String(s.codigo || s.nombre || '').toUpperCase()
	return code.includes('NMR') || code.includes('NUMER')
})

// const mapeoNombre = computed(() => {
// 	if (props.selectedMapeoNombre) return props.selectedMapeoNombre
// 	const id = props.selectedMapeoId ?? form.value.idABCConfigMapeoLinea ?? null
// 	const found = props.mapeos.find(m => m.value == id)
// 	return found ? found.label : `Mapeo ${id ?? ''}`
// })

const hasMapeoInList = computed(() => {
    const id = props.selectedMapeoId ?? form.value.idABCConfigMapeoLinea ?? null
    return props.mapeos.some(m => m.value == id)
})

const hasLineaInList = computed(() => {
    const id = props.selectedLineaId ?? form.value.lineaId ?? null
    return (props.lineas || []).some(l => l.value == id)
})

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
		idABCConfigMapeoLinea: props.selectedMapeoId ?? 0,
		lineaId: props.selectedLineaId ?? null,
		idABCCatColumna: 0,
		regex: '',
		obligatorio: true,
		valor: {
			tipoSel: null,
			tipoId: null,
			cadena: { tipoId: null, minimo: null, maximo: null },
			numero: { tipoId: null, enteros: null, decimales: null }
		}
	}
}

watch(
	() => props.selectedMapeoId,
	(v) => {
		if (v !== undefined && v !== null && !isEditing.value) {
			form.value.idABCConfigMapeoLinea = v
		}
	}
)

watch(
    () => props.selectedLineaId,
    (v) => {
        if (v !== undefined && v !== null) {
            form.value.lineaId = v
        }
    }
)

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
			form.value.idABCConfigMapeoLinea = initialData.mapeoId
			form.value.lineaId = props.selectedLineaId ?? form.value.lineaId
			form.value.idABCCatColumna = initialData.columnaId
			form.value.regex = initialData.regex ?? ''
			form.value.obligatorio = initialData.obligatorio ?? null
			const v = initialData.valor ?? initialData.columna?.valor ?? null
			if (v) {
				
				// const hasCadena = Boolean(v.cadena && (v.cadena.minimo !== null || v.cadena.maximo !== null || (v.cadena.tipo && v.cadena.tipo.id)))
				// const hasNumero = Boolean(v.numero && (v.numero.enteros !== null || v.numero.decimales !== null || (v.numero.tipo && v.numero.tipo.id)))
				form.value.valor.tipoSel = v.tipo?.id ?? null
					form.value.valor.tipoId = v.tipo?.id ?? null
				form.value.valor.cadena.tipoId = v.cadena?.tipo?.id ?? null
				form.value.valor.cadena.minimo = v.cadena?.minimo ?? null
				form.value.valor.cadena.maximo = v.cadena?.maximo ?? null
				form.value.valor.numero.tipoId = v.numero?.tipo?.id ?? null
				form.value.valor.numero.enteros = v.numero?.enteros ?? null
				form.value.valor.numero.decimales = v.numero?.decimales ?? null
			} else {
				form.value.valor = {
					tipoSel: null,
					tipoId: null,
					cadena: { tipoId: null, minimo: null, maximo: null },
					numero: { tipoId: null, enteros: null, decimales: null }
				}
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
	
	const valorPayload: any = {
		tipo: { id: form.value.valor.tipoSel ?? form.value.valor.cadena.tipoId ?? form.value.valor.numero.tipoId ?? null },
		cadena: {
			tipo: { id: form.value.valor.cadena.tipoId ?? null },
			minimo: form.value.valor.cadena.minimo ?? null,
			maximo: form.value.valor.cadena.maximo ?? null
		},
		numero: {
			tipo: { id: form.value.valor.numero.tipoId ?? null },
			enteros: form.value.valor.numero.enteros ?? null,
			decimales: form.value.valor.numero.decimales ?? null
		}
	}

	const payload = {
		columna: {
			tipo: { id: form.value.idABCCatColumna ?? null },
			obligatorio: form.value.obligatorio ?? null,
			regex: form.value.regex || null,
			valor: valorPayload
		},
		idUsuario: (props.initialData as any)?.idUsuario ?? 1
	}

	if (props.mode === 'add') {
		await columnaService.createColumnaLinea(form.value.idABCConfigMapeoLinea, payload)
	} else {
		await columnaService.updateColumnaLinea(form.value.idABCConfigMapeoLinea, payload)
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
					<!-- Configurar columna en {{ mapeoNombre }} -->
					Agregar columna
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

					<div v-if="lineas && lineas.length">
						<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Línea</label>
						<select v-model="form.lineaId" disabled aria-disabled="true" class="w-full px-4 py-2.5 border rounded-lg text-sm opacity-60 cursor-not-allowed bg-gray-100 border-gray-300">
							<option v-if="props.selectedLineaId && !hasLineaInList" :value="props.selectedLineaId">{{ props.selectedLineaNombre ?? (props.lineas || []).find(l => l.value == props.selectedLineaId)?.label ?? 'Línea ' + props.selectedLineaId }}</option>
							<option v-for="o in lineas" :key="o.value" :value="o.value">{{ o.label }}</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Mapeo</label>
						<select v-model="form.idABCConfigMapeoLinea" disabled aria-disabled="true" class="w-full px-4 py-2.5 border rounded-lg text-sm opacity-60 cursor-not-allowed bg-gray-100 border-gray-300">
							<option v-if="props.selectedMapeoId && props.selectedMapeoNombre && !hasMapeoInList" :value="props.selectedMapeoId">{{ props.selectedMapeoNombre }}</option>
							<option v-for="o in mapeos" :key="o.value" :value="o.value">{{ o.label }}</option>
						</select>
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
						
						<div class="flex items-center gap-3">
							<label class="inline-flex items-center gap-2">
								<span class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Obligatorio</span>
								<input type="checkbox" v-model="form.obligatorio" class="h-4 w-4 accent-[#00357F]" />
							</label>
						</div>
					</div>

					<div>
						<div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Tipo valor</label>
									<select v-model="form.valor.tipoSel" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm">
										<option :value="null">Seleccione una opción</option>
										<option v-for="o in valOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
									</select>
								</div>
								<div>
									<div v-if="isCadena">
										<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Subtipo cadena</label>
										<select v-model="form.valor.cadena.tipoId" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm">
											<option :value="null">Seleccione una opción</option>
											<option v-for="o in cdnOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
										</select>
									</div>
									<div v-else-if="isNumero">
										<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Subtipo número</label>
										<select v-model="form.valor.numero.tipoId" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm">
											<option :value="null">Seleccione una opción</option>
											<option v-for="o in nmrOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
										</select>
									</div>
									<div v-else>
										<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2 text-slate-400">Subtipo </label>
										<div  class="flex items-start justify-start text-sm text-slate-400 bg-gray-50 border border-gray-200 rounded-lg p-2">
											Elige un tipo
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4" v-if="form.valor.tipoSel === 2">
						<div>
							<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Mínimo (cadena)</label>
							<input type="number" maxlength="1" size="1" placeholder="Ej. 1" v-model.number="form.valor.cadena.minimo" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>

						<div>
							<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Máximo (cadena)</label>
							<input type="number" maxlength="4" size="4" placeholder="Ej. 10" v-model.number="form.valor.cadena.maximo" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4" v-if="form.valor.tipoSel === 1">
						<div>
							<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Enteros (número)</label>
							<input type="number" placeholder="Ej. 3" v-model.number="form.valor.numero.enteros" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>

						<div v-if="form.valor.numero.tipoId === 2">
							<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Decimales (número)</label>
							<input type="number" placeholder="Ej. 2" v-model.number="form.valor.numero.decimales" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>
					</div>

                    

					<!-- <div>
						<label class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">Regex</label>
						<textarea
							v-model="form.regex"
							class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400 resize-none font-mono"
							rows="2"
							placeholder="Expresión regular para validación"
						></textarea>
					</div> -->

					<div class="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
						<!-- <button
							type="button"
							class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
							@click="$emit('close')"
							:disabled="isLoading"
						>
							Cancelar
						</button> -->
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