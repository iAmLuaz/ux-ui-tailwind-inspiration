<script setup lang="ts">
import BaseModalShell from '@/components/shared/modal/BaseModalShell.vue'
import BaseModalActions from '@/components/shared/modal/BaseModalActions.vue'

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'overlay' | 'inline'
}

withDefaults(defineProps<Props>(), {
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  isLoading: false,
  variant: 'overlay'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div
    v-if="show"
    :class="[variant === 'overlay' ? '' : 'w-full']"
  >
    <BaseModalShell
      :show="show"
      :title="title"
      :z-index-class="variant === 'overlay' ? 'z-[70]' : ''"
      :overlay-class="variant === 'overlay' ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent p-0'"
      :max-width-class="variant === 'overlay' ? 'max-w-md' : 'max-w-lg'"
      :panel-class="variant === 'overlay' ? 'rounded-xl shadow-2xl border border-gray-100' : 'rounded-xl shadow-sm border border-gray-100'"
      body-class="px-5 py-4"
      footer-class="px-5 py-4 border-t border-gray-100 bg-white"
      :show-close-button="false"
      :close-on-backdrop="false"
    >
      <template #body>
        <p :class="['text-sm leading-relaxed', variant === 'overlay' ? 'text-gray-600' : 'text-gray-600']">{{ message }}</p>
      </template>
      <template #footer>
        <BaseModalActions
          :cancel-text="cancelText"
          :confirm-text="confirmText"
          :loading="isLoading"
          @cancel="emit('cancel')"
          @confirm="emit('confirm')"
        />
      </template>
    </BaseModalShell>
  </div>
</template>
