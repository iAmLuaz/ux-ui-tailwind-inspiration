export interface ColumnaCampanaModel {
  tipo: 'campana'

  mapeoId: number
  columnaId: number

  bolActivo: boolean
  regex: string | null
  obligatorio?: boolean | null
  valor?: {
    tipo?: { id?: number | null } | null
    cadena?: { tipo?: { id?: number | null } | null; minimo?: number | null; maximo?: number | null } | null
    numero?: { tipo?: { id?: number | null } | null; enteros?: number | null; decimales?: number | null } | null
  } | null
  idUsuario?: number | null

  columna: {
    tipo: {
      id?: number
      idABCCatColumna?: number
    }
    bolActivo?: boolean
    obligatorio?: boolean | null
    regex?: string | null
    valor?: any | null
  }

  fechaCreacion?: string
  fechaUltimaModificacion?: string
}
