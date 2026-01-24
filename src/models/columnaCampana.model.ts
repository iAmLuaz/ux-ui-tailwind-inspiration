// src/models/columnaCampana.model.ts
export interface ColumnaCampanaModel {
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
