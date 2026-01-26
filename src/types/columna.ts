// src/types/columna.ts
export interface ColumnaLineaKey {
  idABCConfigMapeoLinea: number
  idABCCatColumna: number
}

export interface ColumnaCampanaKey {
  idABCConfigMapeoCampana: number
  idABCCatColumna: number
}

export interface ColumnaData {
  llaveMapeoLineaColumna?: ColumnaLineaKey
  idABCConfigMapeoLinea?: number
  idABCCatColumna?: number
  bolActivo: boolean
  bolCarga: boolean
  bolValidacion: boolean
  bolEnvio: boolean
  regex: string
  fecCreacion: string
  idABCUsuarioUltModificacion: number
  fecUltModificacion: string
}

export type ColumnaCampanaData = Omit<ColumnaData, 'llaveMapeoLineaColumna' | 'idABCConfigMapeoLinea'> & {
  llaveMapeoCampanaColumna?: ColumnaCampanaKey
  idABCConfigMapeoCampana?: number
  idABCCatCampana: number
}

export type ColumnaLineaGetResponse = ColumnaData

export interface CreateColumnaLineaPayload {
  idABCCatColumna: number
  idUsuario: number
  regex: string
}

export interface UpdateColumnaLineaPayload {
  llaveMapeoLineaColumna?: ColumnaLineaKey
  idABCConfigMapeoLinea?: number
  idABCCatColumna?: number
  bolCarga: boolean
  bolValidacion: boolean
  bolEnvio: boolean
  regex: string
  idUsuario: number
}

export interface PatchColumnaLineaPayload {
  idABCConfigMapeoLinea: number
  idABCCatColumna: number
  idUsuario: number
}

export interface UpdateColumnaCampanaPayload {
  llaveMapeoCampanaColumna?: ColumnaCampanaKey
  idABCConfigMapeoCampana?: number
  idABCCatColumna?: number
  bolCarga: boolean
  bolValidacion: boolean
  bolEnvio: boolean
  regex: string
  idUsuario: number
}

export interface PatchColumnaCampanaPayload {
  idABCConfigMapeoCampana: number
  idABCCatColumna: number
  idUsuario: number
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
