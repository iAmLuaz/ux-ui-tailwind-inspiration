<script setup lang="ts">
import { ConfigField } from '@/components/tareas/shared/tareaFormFields'
import ScheduleSlotChips from '@/components/tareas/shared/ScheduleSlotChips.vue'
import {
  useTareaScheduleConfigurator,
  type TareaScheduleModel,
  type TareaToggleSlotPayload
} from '@/composables/tareas/useTareaScheduleConfigurator'
import type { Option } from '@/composables/tareas/tareaScheduleUtils'

interface Props {
  modelValue: TareaScheduleModel
  mode: 'add' | 'edit'
  dayOptions: Option[]
  hourOptions: Option[]
  executionOptions: Option[]
}

interface Emits {
  (e: 'update:modelValue', value: TareaScheduleModel): void
  (e: 'update:scheduleReady', value: boolean): void
  (e: 'toggle-slot', value: TareaToggleSlotPayload): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  localData,
  executionOptions,
  cargaSlotsSorted,
  validacionSlotsSorted,
  envioSlotsSorted,
  hasCargaConfig,
  hasValidacionConfig,
  hasEnvioConfig,
  isValidacionSectionEnabled,
  isEnvioSectionEnabled,
  cargaDayOptions,
  validacionDayOptions,
  envioDayOptions,
  horaOptionsAmPm,
  validacionHoraOptionsAmPm,
  envioHoraOptionsAmPm,
  formatSlotDay,
  formatSlotHour,
  addScheduleSlot,
  removeScheduleSlot,
  validacionRecommendationMessage,
  envioRecommendationMessage,
  scheduleValidationError,
  duplicateScheduleError
} = useTareaScheduleConfigurator(props, {
  updateModelValue: (value) => emit('update:modelValue', value),
  updateScheduleReady: (value) => emit('update:scheduleReady', value),
  toggleSlot: (value) => emit('toggle-slot', value)
})
</script>
<template>
  <div>
    <div class="relative pl-3 md:pl-0">
      <div class="absolute left-3 md:left-[19px] top-3 bottom-8 w-0.5 bg-gray-200 z-0"></div>

      <div class="relative z-10 mb-8">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300 z-10"
            :class="hasCargaConfig ? 'bg-blue-500 text-white' : 'bg-[#00357F] text-white'">
            <svg v-if="hasCargaConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span v-else class="font-bold text-sm">1</span>
          </div>

          <div class="relative flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-[#00357F]/30 transition-all">
            <span v-if="hasCargaConfig" class="absolute -top-2.5 right-4 text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm">Configurado</span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h4 class="text-base font-bold text-[#00357F] uppercase tracking-wide">Carga</h4>
              
                <div class="w-full md:w-[320px]">
                  <div class="flex items-center gap-3">
                  <span class="shrink-0 text-[10px] font-bold text-gray-500 uppercase">Ejecución</span>
                  <div class="flex-1">
                    <ConfigField label="Ejecución" v-model="localData.ejecucionIngesta" :options="executionOptions" :hide-label="true" required />
                  </div>
                  </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-300 bg-white p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios</p>
                <span class="text-xs text-slate-500 font-medium">{{ (localData.cargaSlots?.length ?? 0) }} horarios agregados</span>
              </div>

              <div class="flex flex-col md:flex-row items-end gap-3 mb-3">
                <div class="flex-grow w-full">
                  <ConfigField label="Día" v-model="localData.diaIngesta" :options="cargaDayOptions" required />
                </div>
                <div class="w-full md:w-1/3">
                  <ConfigField
                    label="Hora"
                    v-model="localData.horaIngesta"
                    :options="horaOptionsAmPm"
                    :disabled="!localData.diaIngesta"
                    required
                  />
                </div>
                <div class="w-full md:w-auto flex-shrink-0">
                  <button type="button" 
                    class="group relative h-[42px] w-full md:w-auto px-3 py-2 text-sm font-bold rounded-md border border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-200 mb-[1px] inline-flex items-center justify-center" 
                    :disabled="!localData.diaIngesta || !localData.horaIngesta" 
                    @click="addScheduleSlot('carga')">
                    <span class="text-base leading-none">+</span>
                    <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Agregar horario</span>
                  </button>
                </div>
              </div>

              <div class="min-h-[24px]">
                 <p v-if="!localData.cargaSlots?.length" class="text-[11px] text-slate-400 italic">Agrega al menos un horario para habilitar Validación.</p>
                <ScheduleSlotChips
                  v-else
                  stage="carga"
                  :slots="cargaSlotsSorted"
                  :format-day="formatSlotDay"
                  :format-hour="formatSlotHour"
                  @toggle="(slot) => removeScheduleSlot('carga', slot)"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <div class="relative z-10 mb-8 transition-all duration-300" :class="!isValidacionSectionEnabled ? 'opacity-50 grayscale' : 'opacity-100'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300 z-10"
            :class="hasValidacionConfig ? 'bg-blue-500 text-white' : (isValidacionSectionEnabled ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
            <svg v-if="hasValidacionConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else-if="!isValidacionSectionEnabled" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span v-else class="font-bold text-sm">2</span>
          </div>

          <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
             <div v-if="!isValidacionSectionEnabled" class="absolute inset-0 z-20 cursor-not-allowed bg-white/30"></div>
             <span v-if="hasValidacionConfig" class="absolute -top-2.5 right-4 text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm">Configurado</span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 class="text-base font-bold text-[#00357F] uppercase tracking-wide">Validación</h4>
                <span v-if="!isValidacionSectionEnabled" class="text-[10px] text-slate-500 block mt-1">Se habilita al agregar Carga</span>
              </div>
              <div class="w-full md:w-[320px]">
                <div class="flex items-center gap-3">
                  <span class="shrink-0 text-[10px] font-bold text-gray-500 uppercase">Ejecución</span>
                  <div class="flex-1">
                    <ConfigField label="Ejecución" v-model="localData.ejecucionValidacion" :options="executionOptions" :disabled="!isValidacionSectionEnabled" :hide-label="true" required />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="validacionRecommendationMessage"
              class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              {{ validacionRecommendationMessage }}
            </div>

            <div class="rounded-lg border border-slate-300 bg-white p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios</p>
                <span class="text-xs text-slate-500 font-medium">{{ (localData.validacionSlots?.length ?? 0) }} horarios agregados</span>
              </div>

              <div class="flex flex-col md:flex-row items-end gap-3 mb-3">
                <div class="flex-grow w-full">
                   <ConfigField label="Día" v-model="localData.diaValidacion" :options="validacionDayOptions" :disabled="!isValidacionSectionEnabled" required />
                </div>
                <div class="w-full md:w-1/3">
                  <ConfigField
                    label="Hora"
                    v-model="localData.horaValidacion"
                    :options="validacionHoraOptionsAmPm"
                    :disabled="!isValidacionSectionEnabled || !localData.diaValidacion"
                    required
                  />
                </div>
                <div class="w-full md:w-auto flex-shrink-0">
                  <button type="button" 
                    class="group relative h-[42px] w-full md:w-auto px-3 py-2 text-sm font-bold rounded-md border border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-200 mb-[1px] inline-flex items-center justify-center" 
                    :disabled="!isValidacionSectionEnabled || !localData.diaValidacion || !localData.horaValidacion" 
                    @click="addScheduleSlot('validacion')">
                    <span class="text-base leading-none">+</span>
                    <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Agregar horario</span>
                  </button>
                </div>
              </div>

              <div class="min-h-[24px]">
                 <p v-if="!localData.validacionSlots?.length" class="text-[11px] text-slate-400 italic">Agrega al menos un horario para habilitar Envío.</p>
                <ScheduleSlotChips
                  v-else
                  stage="validacion"
                  :slots="validacionSlotsSorted"
                  :format-day="formatSlotDay"
                  :format-hour="formatSlotHour"
                  @toggle="(slot) => removeScheduleSlot('validacion', slot)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative z-10 transition-all duration-300" :class="!isEnvioSectionEnabled ? 'opacity-50 grayscale' : 'opacity-100'">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-sm transition-colors duration-300 z-10"
            :class="hasEnvioConfig ? 'bg-blue-500 text-white' : (isEnvioSectionEnabled ? 'bg-white border-[#00357F] text-[#00357F]' : 'bg-gray-200 text-gray-400')">
            <svg v-if="hasEnvioConfig" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <svg v-else-if="!isEnvioSectionEnabled" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span v-else class="font-bold text-sm">3</span>
          </div>

          <div class="flex-grow bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
             <div v-if="!isEnvioSectionEnabled" class="absolute inset-0 z-20 cursor-not-allowed bg-white/30"></div>
             <span v-if="hasEnvioConfig" class="absolute -top-2.5 right-4 text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200 shadow-sm">Configurado</span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 class="text-base font-bold text-[#00357F] uppercase tracking-wide">Envío</h4>
                <span v-if="!isEnvioSectionEnabled" class="text-[10px] text-slate-500 block mt-1">Se habilita al agregar Validación</span>
              </div>
              <div class="w-full md:w-[320px]">
                <div class="flex items-center gap-3">
                  <span class="shrink-0 text-[10px] font-bold text-gray-500 uppercase">Ejecución</span>
                  <div class="flex-1">
                    <ConfigField label="Ejecución" v-model="localData.ejecucionEnvio" :options="executionOptions" :disabled="!isEnvioSectionEnabled" :hide-label="true" required />
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="envioRecommendationMessage"
              class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              {{ envioRecommendationMessage }}
            </div>

             <div class="rounded-lg border border-slate-300 bg-white p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios</p>
                <span class="text-xs text-slate-500 font-medium">{{ (localData.envioSlots?.length ?? 0) }} horarios agregados</span>
              </div>

              <div class="flex flex-col md:flex-row items-end gap-3 mb-3">
                <div class="flex-grow w-full">
                  <ConfigField label="Día" v-model="localData.diaEnvio" :options="envioDayOptions" :disabled="!isEnvioSectionEnabled" required />
                </div>
                <div class="w-full md:w-1/3">
                  <ConfigField
                    label="Hora"
                    v-model="localData.horaEnvio"
                    :options="envioHoraOptionsAmPm"
                    :disabled="!isEnvioSectionEnabled || !localData.diaEnvio"
                    required
                  />
                </div>
                <div class="w-full md:w-auto flex-shrink-0">
                  <button type="button" 
                    class="group relative h-[42px] w-full md:w-auto px-3 py-2 text-sm font-bold rounded-md border border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:bg-slate-200 mb-[1px] inline-flex items-center justify-center" 
                    :disabled="!isEnvioSectionEnabled || !localData.diaEnvio || !localData.horaEnvio" 
                    @click="addScheduleSlot('envio')">
                    <span class="text-base leading-none">+</span>
                    <span class="pointer-events-none absolute z-[120] left-1/2 -translate-x-1/2 -top-9 whitespace-nowrap rounded-md bg-[#00357F] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">Agregar horario</span>
                  </button>
                </div>
              </div>

              <div class="min-h-[24px]">
                <ScheduleSlotChips
                  v-if="localData.envioSlots?.length"
                  stage="envio"
                  :slots="envioSlotsSorted"
                  :format-day="formatSlotDay"
                  :format-hour="formatSlotHour"
                  @toggle="(slot) => removeScheduleSlot('envio', slot)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="scheduleValidationError || duplicateScheduleError" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1 mt-6">
      <p v-if="scheduleValidationError" class="font-semibold text-red-700">{{ scheduleValidationError }}</p>
      <p v-if="duplicateScheduleError" class="font-semibold text-amber-700">{{ duplicateScheduleError }}</p>
    </div>
  </div>
</template>