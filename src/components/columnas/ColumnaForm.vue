<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FieldsConfig } from '../../types/columna'

interface Props {
	title: string
	fieldsConfig: FieldsConfig
	initialData?: Record<string, any>
	isLoading?: boolean
	isEditing?: boolean
}

interface Emits {
	(e: 'save', data: Record<string, any>): void
	(e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
	isLoading: false,
	isEditing: false
})

const emit = defineEmits<Emits>()

const formData = ref<Record<string, any>>(initializeFormData())

watch(() => props.initialData, () => {
	formData.value = initializeFormData()
})

function initializeFormData() {
	if (props.initialData) {
		return { ...props.initialData }
	}

	const data: Record<string, any> = {}
	Object.keys(props.fieldsConfig).forEach((key) => {
		const config = props.fieldsConfig[key]
		if (config && config.type === 'toggle') {
			data[key] = 0
		} else {
			data[key] = ''
		}
	})
	return data
}

function handleSave() {
	emit('save', formData.value)
}

function capitalize(str: string) {
	return str
		.replace(/_/g, ' ')
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

function getFieldType(config: FieldsConfig[keyof FieldsConfig]) {
	return config?.type || 'text'
}

function isFieldLocked(fieldName: string) {
	return props.isEditing && (
		fieldName === 'idABCConfigMapeoLinea' ||
		fieldName === 'idABCConfigMapeoCampana' ||
		fieldName === 'idABCCatColumna' ||
		fieldName === 'mapeoId'
	)
}
</script>

<template>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
      
			<div class="px-6 py-4 bg-[#00357F] flex justify-between items-center shrink-0">
				<h3 class="text-lg font-bold text-white flex items-center gap-2">
					{{ title }}
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
					<div
						v-for="(fieldConfig, fieldName) in fieldsConfig"
						:key="fieldName"
					>
						<label :for="`field-${fieldName}`" class="block text-xs font-bold text-[#00357F] uppercase tracking-wider mb-2">
							{{ fieldConfig.label || capitalize(fieldName) }}
							<span v-if="fieldConfig.required" class="text-red-500 ml-1">*</span>
						</label>

						<div v-if="getFieldType(fieldConfig) === 'select'" class="relative">
							<select
								:id="`field-${fieldName}`"
								v-model="formData[fieldName]"
								class="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
								:class="isFieldLocked(fieldName) ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 cursor-pointer'"
								:required="fieldConfig.required"
								:disabled="isFieldLocked(fieldName)"
							>
								<option value="" disabled class="text-gray-400">
									{{ fieldConfig.placeholder || 'Seleccione una opción' }}
								</option>
								<option
									v-for="opt in fieldConfig.options"
									:key="typeof opt === 'string' ? opt : opt.value"
									:value="typeof opt === 'string' ? opt : opt.value"
								>
									{{ typeof opt === 'string' ? opt : opt.label }}
								</option>
							</select>
							<div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
							</div>
						</div>

						<textarea
							v-else-if="getFieldType(fieldConfig) === 'textarea'"
							:id="`field-${fieldName}`"
							v-model="formData[fieldName]"
							class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400 resize-none"
							:placeholder="fieldConfig.placeholder"
							:required="fieldConfig.required"
							:rows="fieldConfig.rows || 3"
						/>

						<div
							v-else-if="getFieldType(fieldConfig) === 'toggle'"
							class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
						>
							<label class="relative inline-flex items-center cursor-pointer">
								<input
									:id="`field-${fieldName}`"
									v-model="formData[fieldName]"
									type="checkbox"
									class="sr-only peer"
									:true-value="1"
									:false-value="0"
								/>
								<div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00357F]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00357F]"></div>
							</label>
							<span 
								class="text-sm font-bold transition-colors"
								:class="formData[fieldName] === 1 ? 'text-[#00357F]' : 'text-gray-400'"
							>
								{{ formData[fieldName] === 1 ? 'Activado' : 'Desactivado' }}
							</span>
						</div>

						<input
							v-else
							:id="`field-${fieldName}`"
							v-model="formData[fieldName]"
							:type="getFieldType(fieldConfig)"
							class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow outline-none placeholder-gray-400"
							:class="isFieldLocked(fieldName) ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50'"
							:placeholder="fieldConfig.placeholder"
							:required="fieldConfig.required"
							:disabled="isFieldLocked(fieldName)"
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