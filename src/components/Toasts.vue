<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore'
const { toasts, removeToast } = useToastStore()
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <transition-group name="toast" tag="div" class="fixed top-4 right-4 z-50 flex flex-col gap-3">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="max-w-sm w-full p-4 rounded-xl shadow-xl flex items-start transform transition-all duration-300 hover:scale-[1.02] opacity-95"
        :class="'bg-slate-100 text-[#00357F] border-l-6 border-yellow-400'"
      >
        <div
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-sm"
          :class="{
            'bg-green-600': t.type === 'success',
            'bg-red-600': t.type === 'error',
            'bg-blue-600': t.type === 'info',
            'bg-orange-500': t.type === 'warning'
          }"
        >
          <svg v-if="t.type === 'success'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
          
          <svg v-if="t.type === 'error'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          
          <svg v-if="t.type === 'info'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          
          <svg v-if="t.type === 'warning'" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>

        <div class="flex-1 pt-1">
          <!-- <p class="font-bold text-xs uppercase opacity-80 mb-0.5">{{ t.type }}</p> -->
          <p class="text-sm font-medium leading-snug">{{ t.message }}</p>
        </div>

        <button 
          class="ml-4 text-[#00357F] opacity-60 hover:opacity-100 transition-opacity focus:outline-none" 
          @click="removeToast(t.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
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
