<script setup lang="ts">
import FormActionConfirmModal from '@/components/shared/FormActionConfirmModal.vue'

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
  <div v-if="show" class="absolute inset-0 z-30 isolate flex items-center justify-center p-4 pointer-events-none">
    <div class="absolute inset-0 z-0 bg-slate-950/45 backdrop-blur-[2px]"></div>
    <div class="relative z-10 w-full max-w-md pointer-events-auto">
      <FormActionConfirmModal
        :show="show"
        variant="inline"
        :title="title"
        :message="message"
        :confirm-text="confirmText"
        :cancel-text="cancelText"
        :is-loading="isLoading"
        @confirm="emit('confirm')"
        @cancel="emit('cancel')"
      />
    </div>
  </div>
</template>
