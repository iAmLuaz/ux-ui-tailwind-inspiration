export interface ColumnaCampanaModel {
  tipo: 'campana'

  mapeoId: number
  columnaId: number

  bolActivo: boolean
  regex: string | null

  columna: {
    tipo: {
      idABCCatColumna: number
    }
  }

  fechaCreacion?: string
  fechaUltimaModificacion?: string
}