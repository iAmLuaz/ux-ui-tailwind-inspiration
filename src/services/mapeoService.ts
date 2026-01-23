// src/services/mapeoService.ts
import { api } from './api'
import { mockApi } from './mockData'
import type { MapeoData } from '../types/mapeo'
import type { MapeoCampanaData } from '../types/mapeo'

interface ApiClient {
  getMapeosByLinea(lineaId: string | number): Promise<MapeoData[]>
  getAllMapeos(): Promise<MapeoData[]>
  getMapeosCampana(): Promise<MapeoCampanaData[]>

  createMapeoLinea(lineaId: string | number, payload: any): Promise<MapeoData>
  createMapeoCampana(
    lineaId: string | number,
    campanaId: string | number,
    payload: any
  ): Promise<MapeoCampanaData>
  updateMapeoLinea(payload: any): Promise<MapeoData>
  updateMapeoCampana(payload: any): Promise<MapeoCampanaData>
  deleteMapeoLinea(lineaId: string | number, mapeoId: string | number): Promise<void>
  patchActivarMapeoLinea(payload: any): Promise<MapeoData>
  patchDesactivarMapeoLinea(payload: any): Promise<MapeoData>
  patchActivarMapeoCampana(payload: any): Promise<MapeoCampanaData>
  patchDesactivarMapeoCampana(payload: any): Promise<MapeoCampanaData>
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const apiClient = (USE_MOCK ? mockApi : api) as ApiClient

function normalizeMapeo(item: any): MapeoData {
  const rawActivo = item?.bolActivo ?? item?.status ?? false
  const rawDictaminacion = item?.bolDictaminacion

  const base: MapeoData = {
    idABCConfigMapeoLinea: Number(
      item?.idABCConfigMapeoLinea ?? item?.id ?? item?.id_mapeo ?? 0
    ),
    idABCCatLineaNegocio: Number(
      item?.idABCCatLineaNegocio ?? item?.id_linea ?? item?.idLinea ?? 0
    ),
    idABCUsuario: Number(item?.idABCUsuario ?? item?.id_usuario ?? 1),
    nombre: item?.nombre ?? '',
    descripcion: item?.descripcion ?? '',
    bolActivo: typeof rawActivo === 'boolean' ? rawActivo : Number(rawActivo) === 1,
    bolDictaminacion:
      rawDictaminacion === null || rawDictaminacion === undefined
        ? null
        : Boolean(rawDictaminacion),
    fecCreacion: item?.fecCreacion ?? item?.fec_creacion ?? '',
    idABCUsuarioUltModificacion: Number(
      item?.idABCUsuarioUltModificacion ?? item?.id_usuario_ult_modificacion ?? 0
    ),
    fecUltModificacion: item?.fecUltModificacion ?? item?.fec_ult_modificacion ?? ''
  }

  return base
}

function normalizeMapeoCampana(item: any): MapeoCampanaData {
  const base = normalizeMapeo(item) as MapeoCampanaData
  const campanaMapeoId = Number(
    item?.idABCConfigMapeoCampana ?? item?.id_mapeo_campana ?? item?.idCampanaMapeo ?? 0
  )
  if (campanaMapeoId) {
    base.idABCConfigMapeoLinea = campanaMapeoId
  }
  base.idABCCatCampana = Number(item?.idABCCatCampana ?? item?.id_campana ?? 0)
  return base
}

function normalizeMapeos(data: any): MapeoData[] {
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.map(normalizeMapeo)
}

export const mapeoService = {
  getMapeos(lineaId: string | number) {
    return apiClient.getMapeosByLinea(lineaId).then(normalizeMapeos)
  },

  getAllMapeos() {
    return apiClient.getAllMapeos().then(res => normalizeMapeos(res))
  },

  getMapeosCampana() {
    return apiClient.getMapeosCampana().then(res => res.map(normalizeMapeoCampana))
  },

  createMapeo(lineaId: string | number, payload: any) {
    const normalized = {
      mapeo: payload.mapeo ?? payload.mapeos ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.createMapeoLinea(lineaId, normalized)
  },

  createMapeoCampana(lineaId: string | number, campanaId: string | number, payload: any) {
    const normalized = {
      mapeo: payload.mapeo ?? payload.mapeos ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.createMapeoCampana(lineaId, campanaId, normalized)
  },

  updateMapeo(payload: any) {
    const mapeoData = payload.mapeo ?? payload.mapeos ?? {}
    const normalized = {
      mapeo: mapeoData,
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.updateMapeoLinea(normalized)
  },

  updateMapeoCampana(payload: any) {
    const mapeoData = payload.mapeo ?? payload.mapeos ?? {}
    const normalized = {
      mapeo: mapeoData,
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1
    }
    return apiClient.updateMapeoCampana(normalized)
  },

  deleteMapeo(lineaId: string | number, mapeoId: string | number) {
    return apiClient.deleteMapeoLinea(lineaId, mapeoId)
  },

  patchActivarMapeoLinea(mapeoId: number, idUsuario: number) {
    return apiClient.patchActivarMapeoLinea({
      mapeo: { id: mapeoId },
      idUsuario
    })
  },

  patchDesactivarMapeoLinea(mapeoId: number, idUsuario: number) {
    return apiClient.patchDesactivarMapeoLinea({
      mapeo: { id: mapeoId },
      idUsuario
    })
  },

  patchActivarMapeoCampana(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchActivarMapeoCampana(payload)
  },

  patchDesactivarMapeoCampana(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchDesactivarMapeoCampana(payload)
  }
}