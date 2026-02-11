export interface MapeoFiltersModel {
  lineas: number[]
  status: boolean[]
}

export interface MapeoCampanaFiltersModel extends MapeoFiltersModel {
  campanas: number[]
}
