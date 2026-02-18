<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { catalogosService } from '@/services/catalogos/catalogosService'
import { columnaService } from '@/services/columnas/columnaService'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'
import FormActionConfirmModal from '@/components/shared/FormActionConfirmModal.vue'
import type { ColumnaCampanaModel } from '@/models/columnas/campana/columnaCampana.model'

interface Option {
	label: string
	value: number
}

const props = defineProps<{
	show: boolean
	mode: 'add' | 'edit'
	initialData: ColumnaCampanaModel | null
	isLoading: boolean
	mapeos: Option[]
	columnas: Option[]
	lineas?: Option[]
	campanas?: Option[]
	existingItems: ColumnaCampanaModel[]
	selectedMapeoId?: number | string | null
	selectedLineaId?: number | string | null
	selectedCampanaId?: number | string | null
	selectedMapeoNombre?: string | null
	selectedLineaNombre?: string | null
	selectedCampanaNombre?: string | null
}>()

const emit = defineEmits(['close', 'saved'])

const form = ref<any>({
	idABCConfigMapeoCampana: 0,
	lineaId: null,
	campanaId: null,
	idABCCatColumna: 0,
	regex: '',
	obligatorio: true,
	valor: {
		tipoSel: null,
		tipoId: null,
		cadena: { tipoId: null, minimo: null, maximo: null },
		numero: { tipoId: null, enteros: null, decimales: null }
	}
})
const initialFormSnapshot = ref('')
const showActionConfirm = ref(false)
const pendingAction = ref<'save' | 'cancel' | null>(null)

const valOptions = ref<Option[]>([])
const cdnOptions = ref<Option[]>([])
const nmrOptions = ref<Option[]>([])
const valItems = ref<any[]>([])

async function fetchTipoOptions() {
	try {
		const catalogos = await catalogosService.getCatalogosAgrupados()
		const nmr = catalogos.find(group => group.codigo === 'NMR')?.registros ?? []
		const cdn = catalogos.find(group => group.codigo === 'CDN')?.registros ?? []
		const val = catalogos.find(group => group.codigo === 'VAL')?.registros ?? []
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
const isDirty = computed(() => serializeFormState(form.value) !== initialFormSnapshot.value)
const confirmTitle = computed(() => (pendingAction.value === 'save' ? 'Confirmar guardado' : 'Descartar cambios'))
const confirmMessage = computed(() =>
	pendingAction.value === 'save'
		? '¿Estás seguro de guardar los cambios de este registro?'
		: 'Se detectaron cambios sin guardar. ¿Deseas cancelar y descartar la información modificada?'
)
const confirmText = computed(() => (pendingAction.value === 'save' ? 'Guardar' : 'Descartar'))

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
// 	const id = props.selectedMapeoId ?? form.value.idABCConfigMapeoCampana ?? null
// 	const found = props.mapeos.find(m => m.value == id)
// 	return found ? found.label : `Mapeo ${id ?? ''}`
// })

const lineaOptions = computed<Option[]>(() => {
	const base = (props.lineas || []) as Option[]
	const selectedId = props.selectedLineaId ?? form.value.lineaId ?? null
	if (selectedId === null || selectedId === undefined) return base
	if (base.some(l => l.value == selectedId)) return base
	return [
		{
			label: props.selectedLineaNombre ?? base.find(l => l.value == selectedId)?.label ?? `Línea ${selectedId}`,
			value: Number(selectedId)
		},
		...base
	]
})

const campanaOptions = computed<Option[]>(() => {
	const base = (props.campanas || []) as Option[]
	const selectedId = props.selectedCampanaId ?? form.value.campanaId ?? null
	if (selectedId === null || selectedId === undefined) return base
	if (base.some(c => c.value == selectedId)) return base
	return [
		{
			label: props.selectedCampanaNombre ?? base.find(c => c.value == selectedId)?.label ?? `Campaña ${selectedId}`,
			value: Number(selectedId)
		},
		...base
	]
})

const mapeoOptions = computed<Option[]>(() => {
	const base = props.mapeos as Option[]
	const selectedId = props.selectedMapeoId ?? form.value.idABCConfigMapeoCampana ?? null
	if (selectedId === null || selectedId === undefined) return base
	if (base.some(m => m.value == selectedId)) return base
	return [
		{
			label: props.selectedMapeoNombre ?? base.find(m => m.value == selectedId)?.label ?? `Mapeo ${selectedId}`,
			value: Number(selectedId)
		},
		...base
	]
})

const availableColumnas = computed(() => {
	const selectedMapeo = form.value.idABCConfigMapeoCampana
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
		idABCConfigMapeoCampana: props.selectedMapeoId ?? 0,
		lineaId: props.selectedLineaId ?? null,
		campanaId: props.selectedCampanaId ?? null,
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

const serializeFormState = (value: any) => JSON.stringify(value)

const restoreInitialInformation = () => {
	if (!props.initialData) return

	form.value.idABCConfigMapeoCampana = props.initialData.mapeoId
	form.value.lineaId = props.selectedLineaId ?? form.value.lineaId
	form.value.campanaId = props.selectedCampanaId ?? form.value.campanaId
	form.value.idABCCatColumna = props.initialData.columnaId
	form.value.regex = props.initialData.regex ?? ''
	form.value.obligatorio = props.initialData.obligatorio ?? props.initialData.columna?.obligatorio ?? null
	const v = props.initialData.valor ?? props.initialData.columna?.valor ?? null
	if (v) {
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

const closeActionConfirm = () => {
	showActionConfirm.value = false
	pendingAction.value = null
}

const requestSave = async () => {
	if (isEditing.value) {
		pendingAction.value = 'save'
		showActionConfirm.value = true
		return
	}

	await save()
}

const requestCancel = () => {
	if (isEditing.value && isDirty.value) {
		pendingAction.value = 'cancel'
		showActionConfirm.value = true
		return
	}

	emit('close')
}

const confirmAction = async () => {
	if (pendingAction.value === 'save') {
		await save()
	} else if (pendingAction.value === 'cancel') {
		emit('close')
	}

	closeActionConfirm()
}

watch(
	() => props.selectedMapeoId,
	(v) => {
		if (v !== undefined && v !== null && !isEditing.value) {
			form.value.idABCConfigMapeoCampana = v
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
	() => props.selectedCampanaId,
	(v) => {
		if (v !== undefined && v !== null) {
			form.value.campanaId = v
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
			ColumnaCampanaModel | null
		]
	) => {
		if (!show) return

		if (mode === 'add') {
			resetForm()
			initialFormSnapshot.value = serializeFormState(form.value)
			return
		}

		if (mode === 'edit' && initialData) {
			form.value.idABCConfigMapeoCampana = initialData.mapeoId
			form.value.lineaId = props.selectedLineaId ?? form.value.lineaId
			form.value.campanaId = props.selectedCampanaId ?? form.value.campanaId
			form.value.idABCCatColumna = initialData.columnaId
			form.value.regex = initialData.regex ?? ''
			form.value.obligatorio = initialData.obligatorio ?? initialData.columna?.obligatorio ?? null
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

		initialFormSnapshot.value = serializeFormState(form.value)
	},
	{ immediate: true }
)

watch(
	() => form.value.idABCConfigMapeoCampana,
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
		await columnaService.createColumnaCampana(form.value.idABCConfigMapeoCampana, payload)
	} else {
		await columnaService.updateColumnaCampana(form.value.idABCConfigMapeoCampana, payload)
	}

	emit('saved')
	emit('close')
}
</script>

<template>
	<div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
			<div class="px-5 py-3 bg-[#00357F] border-b border-white/10 flex justify-between items-center shrink-0">
				<h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">
					<!-- Agregar columna en el mapeo {{ mapeoNombre }} -->
					Agregar columna
				</h3>
			</div>

			<form @submit.prevent="requestSave" class="flex flex-col min-h-0 flex-1">
				<div class="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
					<div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-5">

					<div class="grid grid-cols-2 gap-4">
						
						<div v-if="lineas && lineas.length">
							<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Línea</label>
							<SearchableSelect
								v-model="form.lineaId"
								:options="lineaOptions"
								:disabled="true"
								placeholder="Seleccione una opción"
							/>
						</div>

						<div v-if="campanas && campanas.length">
							<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Campaña</label>
							<SearchableSelect
								v-model="form.campanaId"
								:options="campanaOptions"
								:disabled="true"
								placeholder="Seleccione una opción"
							/>
						</div>
					</div>
					<div>
						<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mapeo</label>
						<SearchableSelect
							v-model="form.idABCConfigMapeoCampana"
							:options="mapeoOptions"
							:disabled="true"
							placeholder="Seleccione una opción"
						/>
					</div>

					<div>
						<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">
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
						<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Obligatorio</label>
						<div class="flex items-center gap-3">
							<label class="inline-flex items-center gap-2">
								<input type="checkbox" v-model="form.obligatorio" class="h-4 w-4 accent-[#00357F]" />
								<span class="text-sm text-slate-600">Marcado si es obligatorio</span>
							</label>
						</div>
					</div>

					<div>
						<div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo valor</label>
									<SearchableSelect
										v-model="form.valor.tipoSel"
										:options="valOptions"
										placeholder="Seleccione una opción"
									/>
								</div>
								<div>
									<div v-if="isCadena">
										<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtipo cadena</label>
										<SearchableSelect
											v-model="form.valor.cadena.tipoId"
											:options="cdnOptions"
											placeholder="Seleccione una opción"
										/>
									</div>
									<div v-else-if="isNumero">
										<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtipo número</label>
										<SearchableSelect
											v-model="form.valor.numero.tipoId"
											:options="nmrOptions"
											placeholder="Seleccione una opción"
										/>
									</div>
									<div v-else>
										<label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subtipo </label>
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
							<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mínimo (cadena)</label>
							<input type="number" maxlength="1" placeholder="Ej. 1" v-model.number="form.valor.cadena.minimo" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>

						<div>
							<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Máximo (cadena)</label>
							<input type="number" maxlength="4" placeholder="Ej. 10" v-model.number="form.valor.cadena.maximo" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4" v-if="form.valor.tipoSel === 1">
						<div>
							<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Enteros (número)</label>
							<input type="number" placeholder="Ej. 3" v-model.number="form.valor.numero.enteros" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00357F]" />
						</div>

						<div v-if="form.valor.numero.tipoId === 2">
							<label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Decimales (número)</label>
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

					</div>
				</div>

				<div class="shrink-0 flex items-center justify-between gap-3 p-4 border-t border-gray-100 bg-white">
					<div>
						<button
							v-if="mode === 'add'"
							type="button"
							title="Restaurar todo"
							aria-label="Restaurar todo"
							class="h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-slate-500 bg-white border border-slate-200 hover:text-[#00357F] hover:border-[#00357F]/30 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
							:disabled="isLoading"
							@click="resetForm"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
							</svg>
						</button>

						<button
							v-else
							type="button"
							class="px-4 py-2.5 text-sm font-bold text-[#00357F] bg-white border border-[#00357F]/20 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00357F]/20 disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="isLoading"
							@click="restoreInitialInformation"
						>
							Restaurar información
						</button>
					</div>
					<div class="flex items-center gap-3">
						<button
							type="button"
							class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
							@click="requestCancel"
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
				</div>
			</form>

			<FormActionConfirmModal
				:show="showActionConfirm"
				:title="confirmTitle"
				:message="confirmMessage"
				:confirm-text="confirmText"
				:is-loading="isLoading"
				@confirm="confirmAction"
				@cancel="closeActionConfirm"
			/>
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