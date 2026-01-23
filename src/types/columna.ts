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

export interface ColumnaCampanaData extends ColumnaData {
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
