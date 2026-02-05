<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore'
const { toasts, removeToast } = useToastStore()
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <transition-group name="toast" tag="div">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="max-w-sm w-full px-4 py-2 rounded shadow-lg text-white flex items-center justify-between"
        :class="{
          'bg-green-600': t.type === 'success',
          'bg-red-600': t.type === 'error',
          'bg-blue-600': t.type === 'info',
          'bg-yellow-500 text-slate-900': t.type === 'warning'
        }"
      >
        <div class="text-sm">{{ t.message }}</div>
        <button class="ml-3 opacity-80 hover:opacity-100" @click="removeToast(t.id)">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .18s ease }
.toast-enter-from { transform: translateY(-6px); opacity: 0 }
.toast-enter-to { transform: translateY(0); opacity: 1 }
.toast-leave-from { transform: translateY(0); opacity: 1 }
.toast-leave-to { transform: translateY(-6px); opacity: 0 }
</style>
