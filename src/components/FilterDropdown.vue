<script setup lang="ts">
import { computed } from 'vue'
import { Filter } from 'lucide-vue-next'

interface Option {
	label: string
	value: any
}

const props = defineProps<{
	label: string
	headerLabel: string
	options: Option[]
	modelValue: any[]
	open: boolean
	isFiltered: boolean
	showSelectAll?: boolean
	selectAllLabel?: string
	menuWidth?: string
	align?: 'left' | 'right'
}>()

const emit = defineEmits<{
	(e: 'toggle'): void
	(e: 'selectAll'): void
	(e: 'update:modelValue', value: any[]): void
}>()

const selection = computed({
	get: () => props.modelValue,
	set: (value: any[]) => emit('update:modelValue', value)
})

const menuWidthClass = computed(() => props.menuWidth ?? 'w-60')
const alignClass = computed(() => (props.align === 'right' ? 'right-0' : 'left-0'))
const showSelectAll = computed(() => props.showSelectAll ?? true)
const selectAllText = computed(() => props.selectAllLabel ?? 'Ver todas')
</script>

<template>
	<div class="relative">
		<button
			type="button"
			class="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md transition-all duration-200 group focus:outline-none cursor-pointer"
			:class="open ? 'bg-white text-[#00357F] shadow-sm ring-1 ring-slate-200' : 'hover:bg-white hover:shadow-sm cursor-pointer'"
			@click.stop="emit('toggle')"
		>
			<span>{{ label }}</span>
			<Filter
				class="w-3.5 h-3.5 transition-colors"
				:class="[
					isFiltered ? 'text-[#00357F] fill-blue-100' : 'text-slate-400',
					open ? 'text-[#00357F]' : ''
				]"
			/>
		</button>

		<div
			v-if="open"
			class="absolute top-full mt-2 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden transform origin-top-left transition-all"
			:class="[menuWidthClass, alignClass]"
		>
			<div class="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
				<span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ headerLabel }}</span>
				<span
					v-if="showSelectAll"
					class="text-[10px] text-blue-600 font-medium cursor-pointer hover:underline"
					@click="emit('selectAll')"
				>
					{{ selectAllText }}
				</span>
			</div>

			<div class="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
				<label
					v-for="opt in options"
					:key="opt.value"
					class="flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group select-none"
				>
					<div class="relative flex items-center">
						<input
							type="checkbox"
							:value="opt.value"
							v-model="selection"
							class="peer h-4 w-4 rounded border-slate-300 text-[#00357F] focus:ring-[#00357F]/20 cursor-pointer transition-all"
						>
					</div>
					<span class="ml-3 text-sm text-slate-600 group-hover:text-[#00357F] font-medium normal-case">
						{{ opt.label }}
					</span>
				</label>
			</div>
		</div>
	</div>
</template>
