<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { catalogosService } from '../services/catalogos/catalogosService'
import type { CatalogoCodigo, CatalogoItem } from '../types/catalogos/catalogos'
import CatalogosTable from '@/components/catalogos/CatalogoTable.vue'

const catalogosDisponibles = [
    { label: 'Roles', value: 'ROL' },
    { label: 'Líneas de negocio', value: 'LNN' },
    { label: 'Campañas', value: 'CMP' },
    { label: 'Columnas', value: 'CLM' },
    { label: 'Valores', value: 'VAL' },
    { label: 'Cadenas', value: 'CDN' },
    { label: 'Números', value: 'NMR' }
] as const

const selectedCodigo = ref<CatalogoCodigo>('ROL')
const isLoading = ref(false)
const error = ref<string | null>(null)
const items = ref<CatalogoItem[]>([])

async function fetchCatalogos() {
    isLoading.value = true
    error.value = null
    try {
        items.value = await catalogosService.getCatalogos(selectedCodigo.value)
    } catch (e: any) {
        error.value = e.message
    } finally {
        isLoading.value = false
    }
}

const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => {
        if (a.bolActivo !== b.bolActivo) return a.bolActivo ? -1 : 1
        return a.nombre.localeCompare(b.nombre)
    })
})

onMounted(fetchCatalogos)
</script>

<template>
    <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
        <div class="max-w-6xl mx-auto space-y-4">
            <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-[#00357F] tracking-tight">Catálogos</h1>
                    <p class="text-sm text-slate-500 mt-1">Consulta de catálogos por código.</p>
                </div>
                <div class="flex items-center gap-2">
                    <select
                        v-model="selectedCodigo"
                        class="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-[#00357F] focus:border-[#00357F]"
                        @change="fetchCatalogos"
                    >
                        <option
                            v-for="opt in catalogosDisponibles"
                            :key="opt.value"
                            :value="opt.value"
                        >
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
            </div>
            <CatalogosTable
                :items="sortedItems"
                :is-loading="isLoading"
            />

            <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        </div>
    </div>
</template>