export interface FieldConfig {
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'date' | 'toggle'
  options?: { label: string; value: any }[] | string[]
  required?: boolean
  placeholder?: string
  rows?: number
  label?: string
}

export type FieldsConfig = Record<string, FieldConfig>

export interface MapeoCampanaRef {
  id: number
}

export interface MapeoLineaRef {
  id: number
  campana: MapeoCampanaRef | null
}
