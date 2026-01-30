export type CatalogoCodigo = 'ROL' | 'LNN' | 'CMP' | 'CLM'

export interface CatalogoItem {
	id: number
	bolActivo: boolean
	codigo: string
	nombre: string
	fechaCreacion: string
	fechaUltimaModificacion: string
}

export type CatalogosResponse = CatalogoItem[]