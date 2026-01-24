// src/services/api.ts
import type {
  CreateColumnaLineaPayload,
  PatchColumnaLineaPayload,
  UpdateColumnaLineaPayload,
  PatchColumnaCampanaPayload,
  UpdateColumnaCampanaPayload
} from '../types/columna'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : (undefined as T)
}


export const http = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  put: <T>(endpoint: string, data: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  patch: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE'
    })
}

export const api = {
  // Catálogos
  getCatalogos: (codigo: string) => http.get(`/catalogos?codigo=${encodeURIComponent(codigo)}`),

  // Mapeo línea
  getAllMapeos: () => http.get('/lineas/0/mapeos'),
  getMapeosByLinea: (lineaId: string | number) =>
    http.get(`/lineas/${lineaId}/mapeos`),
  createMapeoLinea: (lineaId: string | number, payload: any) =>
    http.post(`/lineas/${lineaId}/mapeos`, payload),
  updateMapeoLinea: (payload: any) => http.put('/lineas/mapeos', payload),
  deleteMapeoLinea: (lineaId: string | number, mapeoId: string | number) =>
    http.delete(`/lineas/${lineaId}/mapeos/${mapeoId}`),
  patchActivarMapeoLinea: (payload: any) =>
    http.patch('/lineas/mapeos/activar', payload),
  patchDesactivarMapeoLinea: (payload: any) =>
    http.patch('/lineas/mapeos/desactivar', payload),

  // Mapeo campaña
  getMapeosCampana: () => http.get('/lineas/0/campanas/0/mapeos'),
  createMapeoCampana: (
    lineaId: string | number,
    campanaId: string | number,
    payload: any
  ) => http.post(`/lineas/${lineaId}/campanas/${campanaId}/mapeos`, payload),
  updateMapeoCampana: (payload: any) => {
    const mapeoId = payload?.mapeo?.id ?? payload?.mapeo?.idABCConfigMapeoLinea ?? payload?.mapeo?.idABCConfigMapeoCampana
    const endpoint = mapeoId
      ? `/lineas/campanas/mapeos`
      : '/lineas/campanas/mapeos'
    return http.put(endpoint, payload)
  },
  
  patchActivarMapeoCampana: (payload: any) =>
    http.patch('/lineas/campanas/mapeos/activar', payload),
  patchDesactivarMapeoCampana: (payload: any) =>
    http.patch('/lineas/campanas/mapeos/desactivar', payload),

  // Columna mapeo (línea)
  getColumnasByMapeo: (mapeoId: string | number) =>
    http.get(`/lineas/mapeos/${mapeoId}/columnas`),
  getColumnasLinea: () => http.get('/lineas/mapeos/0/columnas'),
  createColumnaLinea: (
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ) => http.post(`/lineas/mapeos/${mapeoId}/columnas`, payload),
  updateColumnaLinea: (payload: UpdateColumnaLineaPayload) =>
    http.put('/lineas/mapeos/columnas', payload),
  patchActivarColumnaLinea: (payload: PatchColumnaLineaPayload) =>
    http.patch('/lineas/mapeos/columnas/activar', payload),
  patchDesactivarColumnaLinea: (payload: PatchColumnaLineaPayload) =>
    http.patch('/lineas/mapeos/columnas/desactivar', payload),

  // Columna mapeo campaña
  getColumnasCampana: () => http.get('/campanas/mapeos/0/columnas'),
  getColumnasCampanaByMapeo: (mapeoId: string | number) =>
    http.get(`/campanas/mapeos/${mapeoId}/columnas`),
  createColumnaCampanaGlobal: (payload: any) => http.post('/campanas/mapeos/0/columnas', payload),
  createColumnaCampana: (
    mapeoId: string | number,
    payload: CreateColumnaLineaPayload
  ) => http.post(`/campanas/mapeos/${mapeoId}/columnas`, payload),
  updateColumnaCampana: (payload: UpdateColumnaCampanaPayload) =>
    http.put('/campanas/mapeos/columnas', payload),
  patchActivarColumnaCampana: (payload: PatchColumnaCampanaPayload) =>
    http.patch('/campanas/mapeos/columnas/activar', payload),
  patchDesactivarColumnaCampana: (payload: PatchColumnaCampanaPayload) =>
    http.patch('/campanas/mapeos/columnas/desactivar', payload)
}