<script setup lang="ts">
import { ref } from 'vue'
import ColumnasHeader from '@/components/columnas/ColumnasHeader.vue'
import ColumnaLineaCrud from '@/components/columnas/linea/ColumnaLineaCrud.vue'
import ColumnaCampanaCrud from '@/components/columnas/campana/ColumnaCampanaCrud.vue'

type TabKey = 'linea' | 'campana'

const activeTab = ref<TabKey>('linea')

const lineaRef = ref<InstanceType<typeof ColumnaLineaCrud> | null>(null)
const campanaRef = ref<InstanceType<typeof ColumnaCampanaCrud> | null>(null)

function handleAdd() {
	if (activeTab.value === 'linea') {
		lineaRef.value?.openAdd()
	} else {
		campanaRef.value?.openAdd()
	}
}
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
    <div class="max-w-7xl mx-auto space-y-4">
		<ColumnasHeader
			v-model:activeTab="activeTab"
			@add="handleAdd"
		/>

		<Transition name="tab-fade" mode="out-in" appear>
			<ColumnaLineaCrud ref="lineaRef" v-if="activeTab === 'linea'" key="columnas-linea" />
			<ColumnaCampanaCrud ref="campanaRef" v-else key="columnas-campana" />
		</Transition>
    </div>
  </div>
</template>