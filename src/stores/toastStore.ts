import { ref } from 'vue'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function addToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = nextId++
  toasts.value.push({ id, type, message })

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }

  return id
}

export function removeToast(id: number) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export function useToastStore() {
  return { toasts, addToast, removeToast }
}

export default useToastStore
