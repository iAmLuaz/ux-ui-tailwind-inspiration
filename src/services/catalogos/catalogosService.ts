import { api } from '../api'
import type { CatalogoCodigo, CatalogoItem } from '../../types/catalogos/catalogos'

interface ApiClient {
  getCatalogos(codigo: CatalogoCodigo | string): Promise<CatalogoItem[]>
}

const apiClient = api as ApiClient

function normalizeCatalogo(item: any): CatalogoItem {
  return {
    id: Number(item?.id ?? item?.idCatalogo ?? 0),
    bolActivo: typeof item?.bolActivo === 'boolean'
      ? item.bolActivo
      : Number(item?.bolActivo ?? item?.status ?? 0) === 1,
    codigo: String(item?.codigo ?? ''),
    nombre: String(item?.nombre ?? ''),
    fechaCreacion: String(item?.fechaCreacion ?? item?.fec_creacion ?? ''),
    fechaUltimaModificacion: String(item?.fechaUltimaModificacion ?? item?.fec_ult_modificacion ?? '')
  }
}

export const catalogosService = {
  getCatalogos(codigo: CatalogoCodigo | string) {
    return apiClient.getCatalogos(codigo).then(list => {
        let data: any[] = Array.isArray(list) ? list : (list as any)?.data ?? []
        if (data.length === 1 && Array.isArray(data[0])) data = data[0]
        return data.map(normalizeCatalogo)
    })
  }
}
