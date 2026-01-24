// src/models/columnaLinea.model.ts
export interface ColumnaLineaModel {
	tipo: 'linea'
	mapeoId: number
	columnaId: number
	bolActivo: boolean
	bolCarga: boolean
	bolValidacion: boolean
	bolEnvio: boolean
	regex: string
    
    fecCreacion?: string
    fecUltModificacion?: string
}
