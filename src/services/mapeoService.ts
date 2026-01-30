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
  const rawDictaminacion = item?.bolDictaminacion ?? item?.dictaminacion

  const rawValidar = item?.validar ?? item?.bolValidacion ?? item?.validar_flag
    const rawEnvio = item?.envio ?? item?.bolEnvio ?? item?.envio_flag

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
    // map new API flags into the compact type fields
    validar: typeof rawValidar === 'boolean' ? rawValidar : (rawValidar === undefined ? undefined : Number(rawValidar) === 1),
      envio: typeof rawEnvio === 'boolean' ? rawEnvio : (rawEnvio === undefined ? undefined : Number(rawEnvio) === 1),
    // dates
    fechaCreacion: item?.fechaCreacion ?? item?.fec_creacion ?? item?.created_at ?? '',
    fechaUltimaModificacion: item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? item?.updated_at ?? ''
  }

  // attach columnas info when present (mock/enrichment)
  if (Array.isArray(item?.columnas)) {
    ;(base as any).columnas = item.columnas
  } else if (typeof item?.columnas === 'number') {
    ;(base as any).columnas = Number(item.columnas)
  } else if (typeof item?.columnas === 'string' && !Number.isNaN(Number(item.columnas))) {
    ;(base as any).columnas = Number(item.columnas)
  }

  // keep backward-compatible campana field if present in source
  if (item?.idABCCatCampana !== undefined) {
    ;(base as any).idABCCatCampana = Number(item?.idABCCatCampana ?? item?.id_campana ?? item?.idCampana ?? 0)
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
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? payload.mapeo?.validar ?? false,
      envio: payload.envio ?? payload.mapeo?.envio ?? false
    }
    return apiClient.createMapeoLinea(lineaId, normalized).then(res => {
      // Log bitácora: POST on mapeos (mapéo -> objeto 2)
      api.postBitacoraByContext('POST', `/lineas/${lineaId}/mapeos`, normalized, `Crear mapeo línea ${lineaId}`, normalized.idUsuario).catch(() => {})
      return res
    })
  },

  createMapeoCampana(lineaId: string | number, campanaId: string | number, payload: any) {
    const normalized = {
      mapeo: payload.mapeo ?? payload.mapeos ?? {},
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? payload.mapeo?.validar ?? false,
      envio: payload.envio ?? payload.mapeo?.envio ?? false
    }
    return apiClient.createMapeoCampana(lineaId, campanaId, normalized).then(res => {
      api.postBitacoraByContext('POST', `/lineas/${lineaId}/campanas/${campanaId}/mapeos`, normalized, `Crear mapeo campaña ${campanaId} de línea ${lineaId}`, normalized.idUsuario).catch(() => {})
      return res
    })
  },

  updateMapeo(payload: any) {
    const mapeoData = payload.mapeo ?? payload.mapeos ?? {}
    const normalized = {
      mapeo: mapeoData,
      idUsuario: payload.idUsuario ?? payload.idABCUsuario ?? 1,
      validar: payload.validar ?? mapeoData.validar ?? false,
      envio: payload.envio ?? mapeoData.envio ?? false
    }
    return apiClient.updateMapeoLinea(normalized).then(res => {
      api.postBitacoraByContext('PUT', '/lineas/mapeos', normalized, `Actualizar mapeo`, normalized.idUsuario).catch(() => {})
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
      api.postBitacoraByContext('PUT', '/lineas/campanas/mapeos', normalized, `Actualizar mapeo campaña`, normalized.idUsuario).catch(() => {})
      return res
    })
  },

  deleteMapeo(lineaId: string | number, mapeoId: string | number) {
    return apiClient.deleteMapeoLinea(lineaId, mapeoId)
  },

  patchActivarMapeoLinea(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchActivarMapeoLinea(payload).then(res => {
      api.postBitacoraByContext('PATCH', '/lineas/mapeos/activar', payload, `Activar mapeo ${mapeoId}`, idUsuario).catch(() => {})
      return res
    })
  },

  patchDesactivarMapeoLinea(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchDesactivarMapeoLinea(payload).then(res => {
      api.postBitacoraByContext('PATCH', '/lineas/mapeos/desactivar', payload, `Desactivar mapeo ${mapeoId}`, idUsuario).catch(() => {})
      return res
    })
  },

  patchActivarMapeoCampana(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchActivarMapeoCampana(payload).then(res => {
      api.postBitacoraByContext('PATCH', '/lineas/campanas/mapeos/activar', payload, `Activar mapeo campaña ${mapeoId}`, idUsuario).catch(() => {})
      return res
    })
  },

  patchDesactivarMapeoCampana(mapeoId: number, idUsuario: number) {
    const payload = { mapeo: { id: mapeoId }, idUsuario }
    return apiClient.patchDesactivarMapeoCampana(payload).then(res => {
      api.postBitacoraByContext('PATCH', '/lineas/campanas/mapeos/desactivar', payload, `Desactivar mapeo campaña ${mapeoId}`, idUsuario).catch(() => {})
      return res
    })
  }
}