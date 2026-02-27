<script setup lang="ts">
import TareasMonitorHeader from '@/components/tareas/monitor/TareasMonitorHeader.vue'
import TareasMonitorSummaryCards from '@/components/tareas/monitor/TareasMonitorSummaryCards.vue'
import TareasMonitorTable from '@/components/tareas/monitor/TareasMonitorTable.vue'
import FormActionConfirmModal from '@/components/shared/FormActionConfirmModal.vue'
import { useTareasMonitorViewModel } from '@/composables/tareas/monitor/useTareasMonitorViewModel'
import { formatDateLabel, formatNumber, formatTimeLabel } from '@/utils/tareas/monitor/tareasMonitorFormat.utils'

const {
  activeTab,
  actividadOptions,
  campanasOptions,
  canNextPage,
  canPrevPage,
  closeFilter,
  currentPage,
  dictaminarOptions,
  error,
  estatusOptions,
  filteredRows,
  getActividadLabel,
  getCampanaLabel,
  getLineaLabel,
  getStatusClass,
  getStatusLabel,
  handleSearch,
  handleTabChange,
  isLoading,
  isRowGlowing,
  isStatusToggleLocked,
  lineasOptions,
  nextPage,
  openFilter,
  paginatedRows,
  prevPage,
  requestStatusToggle,
  selectedActividades,
  selectedCampanas,
  selectedDictaminar,
  selectedEstatus,
  selectedLineas,
  showStatusConfirmModal,
  statusConfirmLoading,
  statusConfirmMessage,
  statusConfirmTitle,
  confirmStatusToggle,
  closeStatusConfirmModal,
  tabs,
  toggleFilter,
  totalPages,
  totals
} = useTareasMonitorViewModel()
</script>

<template>
  <div class="p-6 bg-slate-50 min-h-screen font-sans text-slate-800" @click.self="closeFilter()">
    <div class="max-w-7xl mx-auto space-y-4">
      <TareasMonitorHeader
        :tabs="tabs"
        :active-tab="activeTab"
        @tab-change="handleTabChange"
      />

      <TareasMonitorSummaryCards
        :totals="totals"
        :format-number="formatNumber"
      />

      <TareasMonitorTable
        :active-tab="activeTab"
        :is-loading="isLoading"
        :error="error"
        :open-filter="openFilter"
        :lineas-options="lineasOptions"
        :campanas-options="campanasOptions"
        :actividad-options="actividadOptions"
        :estatus-options="estatusOptions"
        :dictaminar-options="dictaminarOptions"
        :selected-lineas="selectedLineas"
        :selected-campanas="selectedCampanas"
        :selected-actividades="selectedActividades"
        :selected-estatus="selectedEstatus"
        :selected-dictaminar="selectedDictaminar"
        :paginated-rows="paginatedRows"
        :filtered-rows="filteredRows"
        :current-page="currentPage"
        :total-pages="totalPages"
        :can-prev-page="canPrevPage"
        :can-next-page="canNextPage"
        :is-row-glowing="isRowGlowing"
        :is-status-toggle-locked="isStatusToggleLocked"
        :get-linea-label="getLineaLabel"
        :get-campana-label="getCampanaLabel"
        :get-actividad-label="getActividadLabel"
        :get-status-label="getStatusLabel"
        :get-status-class="getStatusClass"
        :format-date-label="formatDateLabel"
        :format-time-label="formatTimeLabel"
        :format-number="formatNumber"
        @toggle-filter="toggleFilter"
        @update:selected-lineas="selectedLineas = $event"
        @update:selected-campanas="selectedCampanas = $event"
        @update:selected-actividades="selectedActividades = $event"
        @update:selected-estatus="selectedEstatus = $event"
        @update:selected-dictaminar="selectedDictaminar = $event"
        @search="handleSearch"
        @prev-page="prevPage"
        @next-page="nextPage"
        @toggle-status="requestStatusToggle"
      />

      <FormActionConfirmModal
        :show="showStatusConfirmModal"
        :title="statusConfirmTitle"
        :message="statusConfirmMessage"
        confirm-text="Guardar"
        cancel-text="Cancelar"
        :is-loading="statusConfirmLoading"
        @confirm="confirmStatusToggle"
        @cancel="closeStatusConfirmModal"
      />
    </div>
  </div>
</template>
