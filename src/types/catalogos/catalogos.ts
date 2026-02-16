export type CatalogoCodigo = 'ROL' | 'LNN' | 'CMP' | 'CLM' | 'VAL' | 'CDN' | 'NMR'

export interface CatalogoItem {
  id: number
  bolActivo: boolean
  codigo: string
  nombre: string
  fechaCreacion: string
  fechaUltimaModificacion: string
}

export interface CatalogoGrupo {
  codigo: CatalogoCodigo | string
  nombre: string
  registros: CatalogoItem[]
}

export type CatalogosResponse = CatalogoItem[]
export type CatalogosGroupedResponse = CatalogoGrupo[]
