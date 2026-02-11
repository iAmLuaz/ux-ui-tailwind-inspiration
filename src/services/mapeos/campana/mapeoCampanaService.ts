import { api } from '../../api'
import type { MapeoCampanaData } from '@/types/mapeos/campana'
import { normalizeMapeosCampana } from '@/adapters/mapeos/campana/mapeoCampana.adapter'

interface ApiClient {
  getMapeosCampana(): Promise<MapeoCampanaData[]>
  createMapeoCampana(
    lineaId: string | number,
    campanaId: string | number,
    payload: any
  ): Promise<MapeoCampanaData>
  updateMapeoCampana(payload: any): Promise<MapeoCampanaData>
  patchActivarMapeoCampana(payload: any): Promise<MapeoCampanaData>
  patchDesactivarMapeoCampana(payload: any): Promise<MapeoCampanaData>
}

const apiClient = api as ApiClient

export const mapeoCampanaService = {
  getMapeosCampana() {
    return apiClient.getMapeosCampana().then(res => normalizeMapeosCampana(res))
  },

  createMapeoCampana(lineaId: string | number, campanaId: string | number, payload: any) {
    const normalized = {
      mapeo: payload.mapeo ?? payload.mapeos ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? payload.mapeo?.validar ?? false,
      envio: payload.envio ?? payload.mapeo?.envio ?? false
    }
    return apiClient.createMapeoCampana(lineaId, campanaId, normalized).then(res => {
      api
        .postBitacoraByContext(
          'POST',
          `/lineas/${lineaId}/campanas/${campanaId}/mapeos`,
          normalized,
          `Crear mapeo campana ${campanaId} de linea ${lineaId}`,
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  updateMapeoCampana(payload: any) {
    const mapeoData = payload.mapeo ?? payload.mapeos ?? {}
    const normalized = {
      mapeo: mapeoData,
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? mapeoData.validar ?? false,
      envio: payload.envio ?? mapeoData.envio ?? false
    }
    return apiClient.updateMapeoCampana(normalized).then(res => {
      api
        .postBitacoraByContext(
          'PUT',
          '/lineas/campanas/mapeos',
          normalized,
          'Actualizar mapeo campana',
          normalized.idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchActivarMapeoCampana(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchActivarMapeoCampana(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/campanas/mapeos/activar',
          payload,
          `Activar mapeo campana ${mapeoId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  },

  patchDesactivarMapeoCampana(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchDesactivarMapeoCampana(payload).then(res => {
      api
        .postBitacoraByContext(
          'PATCH',
          '/lineas/campanas/mapeos/desactivar',
          payload,
          `Desactivar mapeo campana ${mapeoId}`,
          idUsuario
        )
        .catch(() => {})
      return res
    })
  }
}
