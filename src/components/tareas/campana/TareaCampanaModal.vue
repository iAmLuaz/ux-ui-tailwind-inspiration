<script setup lang="ts">
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import { SelectField } from '@/components/tareas/shared/tareaFormFields'
import TareaScheduleConfigurator from '@/components/tareas/shared/TareaScheduleConfigurator.vue'
import ModalActionConfirmOverlay from '@/components/shared/ModalActionConfirmOverlay.vue'
import BaseModalActions from '@/components/shared/modal/BaseModalActions.vue'
import BaseModalShell from '@/components/shared/modal/BaseModalShell.vue'
import { type Option } from '@/composables/tareas/tareaScheduleUtils'
import type { TareaCampanaFormData } from '@/types/tareas/modalForms'
import { useTareaCampanaModal } from '@/composables/tareas/campana/useTareaCampanaModal'

interface Props {
  show: boolean
  mode: 'add' | 'edit'
  lineasDisponibles: Option[]
  campanasDisponibles: Option[]
  mapeosCampana: MapeoCampanaData[]
  diasDisponibles: Option[]
  horasDisponibles: Option[]
  ejecucionesDisponibles: Option[]
  initialData?: Record<string, any> | null
  isLoading?: boolean
}

interface Emits {
  (e: 'save', data: TareaCampanaFormData): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const {
  closeActionConfirm,
  confirmAction,
  confirmCancelText,
  confirmMessage,
  confirmText,
  confirmTitle,
  displayedMapeoOptionsWithCurrent,
  formData,
  handleSave,
  handleToggleSlot,
  ingestaHelper,
  ingestaPlaceholder,
  isAutoMapped,
  isEditing,
  isHeaderLocked,
  isIngestaDisabled,
  isScheduleReady,
  mode,
  requestCancel,
  resetAllForm,
  resetHeaderSelection,
  restoreInitialInformation,
  scheduleModel,
  showActionConfirm
} = useTareaCampanaModal(props, emit)
</script>
<template>
  <BaseModalShell
    :show="show"
    :title="mode === 'add' ? 'Nuevo Registro' : 'Editar Registro'"
    max-width-class="max-w-2xl"
    panel-class="rounded-xl shadow-2xl"
    @close="requestCancel"
  >
    <template #body>
      <form @submit.prevent="handleSave" class="flex flex-col min-h-0 flex-1 h-full">
        <div class="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex-1 min-h-0">
          <div class="space-y-6">
          
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SelectField
                label="Linea de Negocio"
                v-model="formData.idABCCatLineaNegocio"
                :options="lineasDisponibles"
                required
                :disabled="isHeaderLocked"
                placeholder="Seleccione linea..."
              />

              <SelectField
                label="Campaña"
                v-model="formData.idABCCatCampana"
                :options="campanasDisponibles"
                required
                :disabled="isHeaderLocked"
                placeholder="Seleccione campaña..."
              />

              <div class="md:col-span-2">
                <span class="text-[10px] font-bold text-gray-500 uppercase">Nombre de ingesta <span class="text-red-500">*</span></span>
                <div class="mt-1 flex items-center gap-2">
                  <div class="flex-1">
                    <SelectField
                      label="Nombre de ingesta"
                      v-model="formData.ingesta"
                      :options="displayedMapeoOptionsWithCurrent"
                      required
                      :disabled="isIngestaDisabled"
                      :placeholder="ingestaPlaceholder"
                      hide-label
                    />
                  </div>
                  <button
                    type="button"
                    title="Elegir de nuevo"
                    aria-label="Elegir de nuevo"
                    class="group relative h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-[#00357F] bg-gray-100 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="!isAutoMapped || isEditing"
                    @click="resetHeaderSelection"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
                    </svg>
                  </button>
                </div>
                <p class="text-[11px] text-gray-500 mt-1">{{ ingestaHelper }}</p>
              </div>
            </div>
          </div>

          <TareaScheduleConfigurator
            v-model="scheduleModel"
            :mode="mode"
            :day-options="diasDisponibles"
            :hour-options="horasDisponibles"
            :execution-options="ejecucionesDisponibles"
            @update:schedule-ready="isScheduleReady = $event"
            @toggle-slot="handleToggleSlot"
          />

          <div class="flex justify-end">
            <button
              type="button"
              :title="mode === 'edit' ? 'Restaurar información' : 'Restaurar todo'"
              :aria-label="mode === 'edit' ? 'Restaurar información' : 'Restaurar todo'"
              class="group relative h-[42px] w-[42px] inline-flex items-center justify-center rounded-lg text-[#00357F] bg-gray-100 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="isLoading || showActionConfirm"
              @click="mode === 'edit' ? restoreInitialInformation() : resetAllForm()"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M19 9a7 7 0 00-12-3M5 15a7 7 0 0012 3" />
              </svg>
              <span class="pointer-events-none absolute z-[9999] right-0 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                {{ mode === 'edit' ? 'Restaurar información' : 'Restaurar todo' }}
              </span>
            </button>
          </div>

          </div>
        </div>
      </form>
    </template>
    <template #footer>
      <BaseModalActions
        confirm-type="submit"
        :loading="isLoading"
        :disabled-cancel="Boolean(isLoading || showActionConfirm)"
        :disabled-confirm="Boolean(isLoading || showActionConfirm)"
        @cancel="requestCancel"
        @confirm="handleSave"
      />
    </template>
    <template #overlay>
      <ModalActionConfirmOverlay
        :show="showActionConfirm"
        :title="confirmTitle"
        :message="confirmMessage"
        :confirm-text="confirmText"
        :cancel-text="confirmCancelText"
        :is-loading="isLoading"
        @confirm="confirmAction"
        @cancel="closeActionConfirm"
      />
    </template>
  </BaseModalShell>
</template>
<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
