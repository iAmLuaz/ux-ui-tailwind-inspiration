import { api } from '../../api'
import type { TareaLineaData } from '@/types/tareas/linea'
import { normalizeTareasLinea } from '@/adapters/tareas/linea/tareaLinea.adapter'

interface ApiClient {
  getTareasLinea(): Promise<TareaLineaData[]>
  getTareasLineaByLinea(lineaId: string | number): Promise<TareaLineaData[]>
  createTareaLinea(lineaId: string | number, payload: any): Promise<TareaLineaData>
  updateTareaLinea(payload: any): Promise<TareaLineaData>
  deleteTareaLinea(lineaId: string | number, tareaId: string | number): Promise<void>
  patchActivarTareaLinea(payload: any): Promise<TareaLineaData>
  patchDesactivarTareaLinea(payload: any): Promise<TareaLineaData>
}

const apiClient = api as ApiClient

export const tareaLineaService = {
  getAll() {
    return apiClient.getTareasLinea().then(normalizeTareasLinea)
  },

  getByLinea(lineaId: string | number) {
    return apiClient.getTareasLineaByLinea(lineaId).then(normalizeTareasLinea)
  },

  create(lineaId: string | number, payload: any) {
    const normalized = {
      tarea: payload.tarea ?? payload ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.createTareaLinea(lineaId, normalized).then(res => {
      api
        .postBitacoraByContext(
          'POST',
          `/lineas/${lineaId}/tareas`,
          normalized,
          `Crear tarea linea ${lineaId}`,
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  update(payload: any) {
    const tareaData = payload.tarea ?? payload ?? {}
    const normalized = {
      tarea: tareaData,
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.updateTareaLinea(normalized).then(res => {
      api
        .postBitacoraByContext(
          'PUT',
          '/lineas/tareas',
          normalized,
          'Actualizar tarea linea',
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  delete(lineaId: string | number, tareaId: string | number) {
    return apiClient.deleteTareaLinea(lineaId, tareaId)
  },

  patchActivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchActivarTareaLinea(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/tareas/activar',
          payload,
          `Activar tarea ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchDesactivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchDesactivarTareaLinea(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/tareas/desactivar',
          payload,
          `Desactivar tarea ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  }
}
