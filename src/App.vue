<script setup>
import Sidebar from './components/Sidebar.vue'
import { RouterView } from 'vue-router'
import Toasts from './components/Toasts.vue'
</script>

<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden font-sans">
    
    <Sidebar />

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <section class="flex-1 overflow-y-auto relative custom-scrollbar">
        <div class="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-slate-50 to-transparent z-0"></div>
        
        <div class="relative z-30 overflow-hidden">
          <RouterView v-slot="{ Component, route }">
            <Transition name="page-fade" mode="out-in" appear>
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </RouterView>
        </div>
      </section>

    </main>
    <Toasts />
  </div>
</template>

<style scoped>

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #00357F; 
}

:deep(.page-fade-enter-active),
:deep(.page-fade-leave-active) {
  transition: opacity 180ms ease;
}

:deep(.page-fade-enter-from),
:deep(.page-fade-leave-to) {
  opacity: 0;
}

:deep(.page-fade-enter-to),
:deep(.page-fade-leave-from) {
  opacity: 1;
}

:deep(.tab-fade-enter-active),
:deep(.tab-fade-leave-active) {
  transition: opacity 170ms ease;
}

:deep(.tab-fade-enter-from),
:deep(.tab-fade-leave-to) {
  opacity: 0;
}

:deep(.tab-fade-enter-to),
:deep(.tab-fade-leave-from) {
  opacity: 1;
}
</style>