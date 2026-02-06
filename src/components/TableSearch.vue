<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'search', query: string): void
  (e: 'toggle'): void
}>()

const query = ref('')

watch(query, (v) => {
  if (v === '') {
    emit('search', '')
  }
})

watch(() => props.open, async (v) => {
  if (v) {
    await nextTick()
    const el = document.getElementById('table-search-input') as HTMLInputElement | null
    if (el) el.focus()
  }
})

const submit = () => {
  emit('search', query.value.trim())
  emit('toggle')
}
</script>

<template>
  <div v-if="props.open" class="absolute left-0 top-full mt-2 z-50">
    <div class=" bg-white border border-slate-200 rounded shadow-md p-3">
        <div class="flex gap-2">
        <input
          id="table-search-input"
          v-model="query"
          @keydown.enter.prevent="submit"
          class="flex-1 px-3 py-2 border rounded text-sm font-medium"
          placeholder="Buscar nombre de ingesta..."
        />
        <button @click="submit" class="px-3 py-2 bg-[#00357F] text-white rounded text-sm font-medium">Buscar</button>
        <button @click="() => { query = ''; emit('search', '') }" :disabled="!query" class="px-3 py-2 bg-gray-200 text-slate-700 rounded text-sm font-medium disabled:opacity-50">Limpiar</button>
      </div>
      <!-- <div class="mt-2 text-xs text-slate-400 font-medium">La búsqueda se aplica en todo el conjunto, incluyendo páginas.</div> -->
    </div>
  </div>
</template>
