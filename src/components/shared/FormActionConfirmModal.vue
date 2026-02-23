<script setup lang="ts">
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
  confirmText: 'Confirmar',
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
    :class="[
      variant === 'overlay'
        ? 'fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
        : 'w-full'
    ]"
  >
    <div
      :class="[
        'w-full rounded-xl bg-white border overflow-hidden',
        variant === 'overlay'
          ? 'max-w-md shadow-2xl border-gray-100'
          : 'max-w-full shadow-sm border-gray-100 bg-white'
      ]"
    >
      <div
        :class="[
          'px-5 py-3 border-b',
          variant === 'overlay'
            ? 'bg-[#00357F] border-white/10'
            : 'bg-[#00357F] border-white/10'
        ]"
      >
        <h4
          :class="[
            'text-base font-semibold tracking-wide',
            variant === 'overlay' ? 'text-white/95' : 'text-white/95'
          ]"
        >
          {{ title }}
        </h4>
      </div>

      <div class="px-5 py-4">
        <p :class="['text-sm leading-relaxed', variant === 'overlay' ? 'text-gray-600' : 'text-gray-600']">{{ message }}</p>
      </div>

      <div
        :class="[
          'px-5 py-4 border-t flex justify-end gap-3',
          variant === 'overlay' ? 'border-gray-100 bg-white' : 'border-gray-100 bg-white'
        ]"
      >
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
