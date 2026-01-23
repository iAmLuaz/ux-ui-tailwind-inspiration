export interface ColumnaData {
  idABCConfigMapeoLinea: number
  bolActivo: boolean
  idABCCatColumna: number
  bolCarga: boolean
  bolValidacion: boolean
  bolEnvio: boolean
  regex: string
  fecCreacion: string
  idABCUsuarioUltModificacion: number
  fecUltModificacion: string
}

export type ColumnaCampanaData = Omit<ColumnaData, 'idABCConfigMapeoLinea'> & {
  idABCConfigMapeoCampana: number
  idABCCatCampana: number
}

export type ColumnaLineaGetResponse = ColumnaData

export interface CreateColumnaLineaPayload {
  idABCCatColumna: number
  idUsuario: number
  regex: string
}

export interface UpdateColumnaLineaPayload {
  idABCConfigMapeoLinea: number
  idABCCatColumna: number
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
  idABCConfigMapeoCampana: number
  idABCCatColumna: number
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
