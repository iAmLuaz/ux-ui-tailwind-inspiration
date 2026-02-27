<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  cancelText?: string
  confirmText?: string
  showCancel?: boolean
  loading?: boolean
  disabledCancel?: boolean
  disabledConfirm?: boolean
  confirmType?: 'button' | 'submit'
}

const props = withDefaults(defineProps<Props>(), {
  cancelText: 'Cancelar',
  confirmText: 'Guardar',
  showCancel: true,
  loading: false,
  disabledCancel: false,
  disabledConfirm: false,
  confirmType: 'button'
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

const isSaveAction = computed(() => String(props.confirmText ?? '').trim().toLowerCase().includes('guardar'))

const handleConfirmClick = () => {
  emit('confirm')
}
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <div>
      <slot name="left" />
    </div>

    <div class="flex items-center gap-3">
      <button
        v-if="showCancel"
        type="button"
        class="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabledCancel || loading"
        @click="emit('cancel')"
      >
        {{ cancelText }}
      </button>

      <button
        :type="confirmType"
        :class="[
          'px-5 py-2.5 text-sm font-bold rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
          isSaveAction
            ? 'text-[#00357F] bg-[#FFD100] hover:bg-yellow-400 shadow-md hover:shadow-lg focus:ring-2 focus:ring-yellow-300'
            : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300'
        ]"
        :disabled="disabledConfirm || loading"
        @click="handleConfirmClick"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4 text-[#00357F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ confirmText }}
      </button>
    </div>
  </div>
</template>
