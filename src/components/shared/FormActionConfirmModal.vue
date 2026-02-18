<script setup lang="ts">
interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  isLoading: false
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
      <div class="px-5 py-3 bg-[#00357F] border-b border-white/10">
        <h4 class="text-base font-semibold text-white/95 tracking-wide">{{ title }}</h4>
      </div>

      <div class="px-5 py-4">
        <p class="text-sm text-gray-600 leading-relaxed">{{ message }}</p>
      </div>

      <div class="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
        <button
          type="button"
          class="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="emit('cancel')"
        >
          {{ cancelText }}
        </button>

        <button
          type="button"
          class="px-4 py-2 text-sm font-bold text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
