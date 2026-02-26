import type { ScheduleSlot } from '@/composables/tareas/tareaScheduleUtils'

export interface TareaLineaFormData {
  idABCCatLineaNegocio?: number | ''
  idMapeo?: number | ''
  ingesta: string
  carga: string
  ejecucionIngesta: number | ''
  diaIngesta: number | ''
  horaIngesta: number | ''
  cargaSlots?: ScheduleSlot[]
  validacion: string
  ejecucionValidacion: number | ''
  diaValidacion: number | ''
  horaValidacion: number | ''
  validacionSlots?: ScheduleSlot[]
  envio: string
  ejecucionEnvio: number | ''
  diaEnvio: number | ''
  horaEnvio: number | ''
  envioSlots?: ScheduleSlot[]
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
  idUsuario?: number | ''
}

export interface TareaCampanaFormData {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  idMapeo?: number | ''
  ingesta: string
  carga: string
  ejecucionIngesta: number | ''
  diaIngesta: number | ''
  horaIngesta: number | ''
  cargaSlots?: ScheduleSlot[]
  validacion: string
  ejecucionValidacion: number | ''
  diaValidacion: number | ''
  horaValidacion: number | ''
  validacionSlots?: ScheduleSlot[]
  envio: string
  ejecucionEnvio: number | ''
  diaEnvio: number | ''
  horaEnvio: number | ''
  envioSlots?: ScheduleSlot[]
  horariosDesactivarIds?: number[]
  horariosActivarIds?: number[]
  idUsuario?: number | ''
}
