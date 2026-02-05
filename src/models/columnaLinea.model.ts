export interface ColumnaLineaModel {
  tipo: 'linea'

  mapeoId: number
  columnaId: number

  bolActivo: boolean
  regex: string | null
  obligatorio: boolean | null
  valor: ColumnaValor | null

  idUsuario?: number | null

  columna: {
    tipo: {
      id?: number
      idABCCatColumna?: number
    }

    bolActivo?: boolean
    obligatorio?: boolean | null
    regex?: string | null
    valor?: ColumnaValor | null
  }

  fechaCreacion?: string
  fechaUltimaModificacion?: string
}

export interface ColumnaValorCadena {
  tipo: { id: number } | null
  minimo: number | null
  maximo: number | null
}

export interface ColumnaValorNumero {
  tipo: { id: number } | null
  enteros: number | null
  decimales: number | null
}

export interface ColumnaValor {
  tipo: { id: number } | null
  cadena: ColumnaValorCadena | null
  numero: ColumnaValorNumero | null
}