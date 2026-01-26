<!-- // src/components/columnas/ColumnasHeader.vue -->
<script setup lang="ts">
import { Layers, Megaphone, Plus } from 'lucide-vue-next'

type TabKey = 'linea' | 'campana'

const props = defineProps<{
	activeTab: TabKey
}>()

const emit = defineEmits<{
	(e: 'update:activeTab', value: TabKey): void
	(e: 'add'): void
}>()

const tabs: { key: TabKey; label: string; icon: any }[] = [
	{ key: 'linea', label: 'Líneas de negocio', icon: Layers },
	{ key: 'campana', label: 'Campañas', icon: Megaphone }
]

const headerCopy: Record<TabKey, { title: string; description: string; icon: any }> = {
	linea: {
		title: 'Columnas de mapeo de líneas',
		description: 'Gestión de columnas y configuraciones por mapeo.',
		icon: Layers
	},
	campana: {
		title: 'Columnas de mapeo de campañas',
		description: 'Administración de columnas asociadas a mapeos de campañas.',
		icon: Megaphone
	}
}
</script>

<template>
    <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
            <h1 class="text-2xl font-bold text-[#00357F] tracking-tight flex items-center gap-2">
                <component :is="headerCopy[props.activeTab].icon" class="w-6 h-6" />
                {{ headerCopy[props.activeTab].title }}
            </h1>
            <p class="text-sm text-slate-500 mt-1">
                {{ headerCopy[props.activeTab].description }}
            </p>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div class="bg-white p-1 rounded-lg border border-slate-200 shadow-sm inline-flex">
                <button
                    v-for="t in tabs"
                    :key="t.key"
                    @click="emit('update:activeTab', t.key)"
                    class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                    :class="props.activeTab === t.key
                        ? 'bg-[#00357F] text-white shadow-sm cursor-pointer'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer'"
                >
                    <component :is="t.icon" class="w-4 h-4" />
                    {{ t.label }}
                </button>
            </div>
            <button
                @click="emit('add')"
                class="flex items-center gap-2 bg-[#FFD100] hover:bg-yellow-400 text-[#00357F] text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
            >
                <Plus class="w-4 h-4" />
                <span>Nuevo</span>
            </button>
        </div>

    </div>
</template>
