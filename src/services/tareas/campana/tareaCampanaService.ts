import { api } from '../../api'
import type { TareaCampanaData } from '@/types/tareas/campana'
import { normalizeTareasCampana } from '@/adapters/tareas/campana/tareaCampana.adapter'

interface ApiClient {
  getTareasCampana(): Promise<TareaCampanaData[]>
  getTareasCampanaByLineaCampana(lineaId: string | number, campanaId: string | number): Promise<TareaCampanaData[]>
  createTareaCampana(lineaId: string | number, campanaId: string | number, payload: any): Promise<TareaCampanaData>
  updateTareaCampana(payload: any): Promise<TareaCampanaData>
  deleteTareaCampana(lineaId: string | number, campanaId: string | number, tareaId: string | number): Promise<void>
  patchActivarTareaCampana(payload: any): Promise<TareaCampanaData>
  patchDesactivarTareaCampana(payload: any): Promise<TareaCampanaData>
}

const apiClient = api as ApiClient

export const tareaCampanaService = {
  getAll() {
    return apiClient.getTareasCampana().then(normalizeTareasCampana)
  },

  getByLineaCampana(lineaId: string | number, campanaId: string | number) {
    return apiClient.getTareasCampanaByLineaCampana(lineaId, campanaId).then(normalizeTareasCampana)
  },

  create(lineaId: string | number, campanaId: string | number, payload: any) {
    const normalized = {
      tarea: payload.tarea ?? payload ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.createTareaCampana(lineaId, campanaId, normalized).then(res => {
      api
        .postBitacoraByContext(
          'POST',
          `/lineas/${lineaId}/campanas/${campanaId}/tareas`,
          normalized,
          `Crear tarea campana ${campanaId} de linea ${lineaId}`,
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
    return apiClient.updateTareaCampana(normalized).then(res => {
      api
        .postBitacoraByContext(
          'PUT',
          '/lineas/campanas/tareas',
          normalized,
          'Actualizar tarea campana',
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  delete(lineaId: string | number, campanaId: string | number, tareaId: string | number) {
    return apiClient.deleteTareaCampana(lineaId, campanaId, tareaId)
  },

  patchActivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchActivarTareaCampana(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/campanas/tareas/activar',
          payload,
          `Activar tarea campana ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchDesactivar(tareaId: number, idUsuario: number) {
    const payload = { tarea: { id: tareaId }, idUsuario }
    return apiClient.patchDesactivarTareaCampana(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/campanas/tareas/desactivar',
          payload,
          `Desactivar tarea campana ${tareaId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  }
}
