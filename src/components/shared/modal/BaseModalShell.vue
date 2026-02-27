<script setup lang="ts">
interface Props {
  show: boolean
  title?: string
  maxWidthClass?: string
  zIndexClass?: string
  panelClass?: string
  overlayClass?: string
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
  bodyClass?: string
  headerClass?: string
  footerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidthClass: 'max-w-2xl',
  zIndexClass: 'z-50',
  panelClass: 'rounded-2xl shadow-2xl',
  overlayClass: 'bg-black/60 backdrop-blur-sm',
  closeOnBackdrop: true,
  showCloseButton: true,
  bodyClass: 'p-4 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0',
  headerClass: 'px-5 py-3 bg-[#00357F] border-b border-white/10 flex justify-between items-center shrink-0',
  footerClass: 'shrink-0 p-4 border-t border-gray-100 bg-white'
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const onBackdropClick = () => {
  if (!props.closeOnBackdrop) return
  emit('close')
}

const onClose = () => emit('close')
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center p-4 transition-opacity"
    :class="[zIndexClass, overlayClass]"
    @click.self="onBackdropClick"
  >
    <div
      class="relative bg-white w-full overflow-hidden flex flex-col max-h-[90vh]"
      :class="[maxWidthClass, panelClass]"
    >
      <slot name="header" :close="onClose">
        <div :class="headerClass">
          <h3 class="text-base font-semibold text-white/95 flex items-center gap-2 tracking-wide">
            {{ title }}
          </h3>
          <button
            v-if="showCloseButton"
            type="button"
            class="h-8 w-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/15 transition-colors"
            @click="onClose"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </slot>

      <div :class="bodyClass">
        <slot name="body">
          <slot />
        </slot>
      </div>

      <div v-if="$slots.footer" :class="footerClass">
        <slot name="footer" :close="onClose" />
      </div>
    </div>

    <slot name="overlay" :close="onClose" />
  </div>
</template>
