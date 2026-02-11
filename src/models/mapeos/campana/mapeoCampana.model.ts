import type {
  CreateMapeoCampanaPayload,
  UpdateMapeoCampanaPayload
} from '@/types/mapeos/campana'

export interface MapeoCampanaFormModel {
  idABCCatLineaNegocio?: number | ''
  idABCCatCampana?: number | ''
  nombre: string
  descripcion: string
  validar?: boolean
  envio?: boolean
  idUsuario?: number | ''
}

export function toCreateMapeoCampanaPayload(
  form: MapeoCampanaFormModel
): CreateMapeoCampanaPayload {
  return {
    mapeo: {
      nombre: form.nombre,
      descripcion: form.descripcion,
      validar: form.validar,
      envio: form.envio
    },
    idABCUsuario: Number(form.idUsuario ?? 1),
    idUsuario: form.idUsuario === '' ? undefined : Number(form.idUsuario ?? 1)
  }
}

export function toUpdateMapeoCampanaPayload(
  form: MapeoCampanaFormModel,
  mapeoId: number
): UpdateMapeoCampanaPayload {
  return {
    mapeo: {
      id: mapeoId,
      nombre: form.nombre,
      descripcion: form.descripcion,
      validar: form.validar,
      envio: form.envio
    },
    idUsuario: Number(form.idUsuario ?? 1)
  }
}
