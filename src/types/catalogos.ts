// src/types/catalogos.ts
export type CatalogoCodigo = 'ROL' | 'LNN' | 'CMP' | 'CLM'

export interface CatalogoItem {
	id: number
	bolActivo: boolean
	codigo: string
	nombre: string
	fecCreacion: string
	fecUltModificacion: string
}

export type CatalogosResponse = CatalogoItem[]
