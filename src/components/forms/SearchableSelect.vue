<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Option {
	label: string
	value: number
}

const props = defineProps<{
	modelValue: number
	options: Option[]
	placeholder?: string
	disabled?: boolean
	required?: boolean
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: number): void
}>()

const isOpen = ref(false)
const search = ref('')

const selectedLabel = computed(() =>
	props.options.find(opt => opt.value === props.modelValue)?.label ?? ''
)

const filteredOptions = computed(() => {
	const term = search.value.trim().toLowerCase()
	if (!term) return props.options
	return props.options.filter(opt => opt.label.toLowerCase().includes(term))
})

function toggleOpen() {
	if (props.disabled) return
	isOpen.value = !isOpen.value
}

function selectOption(option: Option) {
	emit('update:modelValue', option.value)
	isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
	const target = event.target as HTMLElement
	if (!target.closest('.searchable-select')) {
		isOpen.value = false
	}
}

watch(isOpen, open => {
	if (open) search.value = ''
})

onMounted(() => {
	document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
	<div class="relative searchable-select">
		<button
			type="button"
			class="w-full flex items-center justify-between pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] transition-shadow appearance-none outline-none"
			:class="disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-gray-50 cursor-pointer'"
			:disabled="disabled"
			@click.stop="toggleOpen"
		>
			<span class="truncate">
				{{ selectedLabel || placeholder || 'Seleccione una opción' }}
			</span>
			<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
			</svg>
		</button>

		<div
			v-if="isOpen"
			class="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
		>
			<div class="p-2 border-b border-slate-100">
				<input
					v-model="search"
					type="text"
					placeholder="Buscar..."
					class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F] outline-none"
				/>
			</div>
			<div class="max-h-60 overflow-y-auto">
				<button
					v-for="opt in filteredOptions"
					:key="opt.value"
					type="button"
					class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors"
					@click.stop="selectOption(opt)"
				>
					{{ opt.label }}
				</button>
				<div v-if="filteredOptions.length === 0" class="px-4 py-3 text-xs text-slate-400">
					Sin resultados
				</div>
			</div>
		</div>
	</div>
</template>