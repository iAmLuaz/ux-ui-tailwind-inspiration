import { api } from './api'
import { mockCatalogosApi } from './mockData'
import type { CatalogoCodigo, CatalogoItem } from '../types/catalogos'

interface ApiClient {
  getCatalogos(codigo: CatalogoCodigo | string): Promise<CatalogoItem[]>
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const apiClient = (USE_MOCK ? mockCatalogosApi : api) as ApiClient

function normalizeCatalogo(item: any): CatalogoItem {
  return {
    id: Number(item?.id ?? item?.idCatalogo ?? 0),
    bolActivo: typeof item?.bolActivo === 'boolean'
      ? item.bolActivo
      : Number(item?.bolActivo ?? item?.status ?? 0) === 1,
    codigo: String(item?.codigo ?? ''),
    nombre: String(item?.nombre ?? ''),
    fecCreacion: String(item?.fecCreacion ?? item?.fec_creacion ?? ''),
    fecUltModificacion: String(item?.fecUltModificacion ?? item?.fec_ult_modificacion ?? '')
  }
}

export const catalogosService = {
  getCatalogos(codigo: CatalogoCodigo | string) {
    return apiClient.getCatalogos(codigo).then(list => {
      const data = Array.isArray(list) ? list : (list as any)?.data ?? []
      return data.map(normalizeCatalogo)
    })
  }
}
