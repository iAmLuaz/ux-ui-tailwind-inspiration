
export interface ColumnaLineaKey {
  idABCConfigMapeoLinea: number
  idABCCatColumna: number
}

export interface ColumnaCampanaKey {
  idABCConfigMapeoCampana: number
  idABCCatColumna: number
}

export interface ColumnaValorCadena {
  tipo?: { id?: number | null } | null
  minimo?: number | null
  maximo?: number | null
}

export interface ColumnaValorNumero {
  tipo?: { id?: number | null } | null
  enteros?: number | null
  decimales?: number | null
}

export interface ColumnaValor {
  tipo?: any | null
  cadena?: ColumnaValorCadena | null
  numero?: ColumnaValorNumero | null
}

export interface ColumnaBase {
  idABCCatColumna?: number
  regex?: string | null
  obligatorio?: boolean | null
  bolActivo?: boolean
  valor?: ColumnaValor | null

  fechaCreacion?: string
  fechaUltimaModificacion?: string
  idABCUsuarioUltModificacion?: number
}

export interface ColumnaLineaData extends ColumnaBase {
  scope: 'linea'
  llaveMapeoLineaColumna: ColumnaLineaKey
  idABCConfigMapeoLinea: number
}

export interface ColumnaCampanaData extends ColumnaBase {
  scope: 'campana'
  llaveMapeoCampanaColumna: ColumnaCampanaKey
  idABCConfigMapeoCampana: number
}

export type ColumnaGetResponse =
  | ColumnaLineaData
  | ColumnaCampanaData

export interface CreateColumnaLineaPayload {
  idUsuario: number
  columna: {
    tipo: { id: number | null }
    regex?: string | null
    obligatorio?: boolean | null
    valor?: ColumnaValor | null
  }
}

export interface UpdateColumnaLineaPayload extends CreateColumnaLineaPayload {}

export interface PatchColumnaLineaPayload {
  idUsuario: number
  columna: {
    tipo: { id: number }
  }
}

export interface CreateColumnaCampanaPayload {
  idUsuario: number
  columna: {
    tipo: { id: number | null }
    regex?: string | null
    obligatorio?: boolean | null
    valor?: ColumnaValor | null
  }
}

export interface UpdateColumnaCampanaPayload extends CreateColumnaCampanaPayload {}

export interface PatchColumnaCampanaPayload {
  idUsuario: number
  columna: {
    tipo: { id: number }
  }
}

export interface FieldConfig {
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'date' | 'toggle'
  options?: { label: string; value: any }[] | string[]
  required?: boolean
  placeholder?: string
  rows?: number
  label?: string
}

export type FieldsConfig = Record<string, FieldConfig>