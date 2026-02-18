export interface Option {
  label: string
  value: number | string
}

export type Weekday = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'
export type WeekdayValue = Weekday | ''

export interface ScheduleSlot {
  dia: WeekdayValue
  hora: string
  horarioId?: number
  persisted?: boolean
  activo?: boolean
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const weekdayLookup: Record<string, Weekday> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  miércoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes'
}

const jsDayToWeekday: Record<number, Weekday | null> = {
  0: null,
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: null
}

const weekdayOrder: Record<Weekday, number> = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5
}

const isWeekday = (value: string): value is Weekday => Object.prototype.hasOwnProperty.call(weekdayOrder, value)

export const weekdayOptions: Weekday[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export const weekdayById: Record<number, Weekday> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes'
}

export const getWeekdayOrder = (weekday: WeekdayValue): number => {
  if (!weekday || !isWeekday(weekday)) return -1
  return weekdayOrder[weekday]
}

export const normalizeWeekdayInputValue = (value: unknown): WeekdayValue => {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw) return ''

  if (isWeekday(raw)) {
    return raw
  }

  const normalized = weekdayLookup[normalizeText(raw)]
  if (normalized) {
    return normalized
  }

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDateMatch) {
    const parsed = new Date(`${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}T00:00:00`)
    const weekday = jsDayToWeekday[parsed.getDay()]
    return weekday ?? ''
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return jsDayToWeekday[parsed.getDay()] ?? ''
  }

  return ''
}

export const toWeekdayTimeMs = (weekday: WeekdayValue, time: string): number | null => {
  if (!weekday || !isWeekday(weekday) || !time) return null
  const [hoursRaw, minutesRaw] = time.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if ([hours, minutes].some(Number.isNaN)) return null
  const dayOrder = weekdayOrder[weekday]
  return (((dayOrder * 24) + hours) * 60 + minutes) * 60_000
}

export const addMinutes = (weekday: WeekdayValue, time: string, minutesToAdd: number) => {
  const baseMs = toWeekdayTimeMs(weekday, time)
  if (baseMs === null) return null
  const resultMs = baseMs + minutesToAdd * 60_000
  const totalMinutes = Math.floor(resultMs / 60_000)
  const resultDayIndex = Math.floor(totalMinutes / (24 * 60))
  const minuteOfDay = totalMinutes % (24 * 60)
  const resultHour = Math.floor(minuteOfDay / 60)
  const resultMinute = minuteOfDay % 60
  const dayName = weekdayOptions.find(day => weekdayOrder[day] === resultDayIndex) ?? 'Siguiente semana'
  return {
    date: dayName,
    time: `${pad2(resultHour)}:${pad2(resultMinute)}`
  }
}

const buildHoraOptions = () => {
  const result: string[] = []
  for (let hour = 20; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      result.push(`${pad2(hour)}:${pad2(minute)}`)
    }
  }
  for (let hour = 0; hour <= 2; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 2 && minute > 0) continue
      result.push(`${pad2(hour)}:${pad2(minute)}`)
    }
  }
  return result
}

export const horaOptions = buildHoraOptions()

export const toHoraLabel = (value: unknown): string => {
  if (typeof value === 'string' && value.includes(':')) return value
  const raw = Number(value)
  if (Number.isNaN(raw) || raw < 0) return ''
  const hours = String(Math.floor(raw / 100)).padStart(2, '0')
  const minutes = String(raw % 100).padStart(2, '0')
  return `${hours}:${minutes}`
}

export interface HorarioLike {
  tipoHorario?: {
    id?: number
    nombre?: string
  }
  dia?: {
    id?: number
    nombre?: string
    hora?: {
      id?: number
      nombre?: string
    }
  }
  hora?: {
    id?: number
    nombre?: string
  }
  activo?: boolean
  bolActivo?: boolean
}

const horarioTypeById: Record<number, string> = {
  1: 'Carga',
  2: 'Validación',
  3: 'Envío'
}

export const getHorarioTypeName = (horario?: HorarioLike): string => {
  const explicit = String(horario?.tipoHorario?.nombre ?? '').trim()
  if (explicit) return explicit
  const typeId = Number(horario?.tipoHorario?.id ?? 0)
  return horarioTypeById[typeId] ?? 'Horario'
}

export const getHorarioDayName = (horario?: HorarioLike): WeekdayValue => {
  const dayName = normalizeWeekdayInputValue(horario?.dia?.nombre)
  if (dayName) return dayName
  const dayId = Number(horario?.dia?.id ?? 0)
  return weekdayById[dayId] ?? ''
}

export const getHorarioHourLabel = (horario?: HorarioLike): string => {
  return String(
    horario?.dia?.hora?.nombre
      ?? horario?.hora?.nombre
      ?? toHoraLabel(horario?.dia?.hora?.id ?? horario?.hora?.id)
      ?? ''
  )
}

export const formatHourToAmPm = (value: string): string => {
  const [hoursRaw, minutesRaw] = String(value ?? '').split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if ([hours, minutes].some(Number.isNaN)) return value
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export const formatHorarioLabel = (horario?: HorarioLike): string => {
  const day = getHorarioDayName(horario)
  const hour = formatHourToAmPm(getHorarioHourLabel(horario))
  if (!day && !hour) return '-'
  return [day, hour].filter(Boolean).join(' · ')
}

export const isScheduleComplete = (ejecucion: string, dia: string, hora: string) =>
  Boolean(ejecucion && dia && hora)

export const compareWeekdayTime = (
  fromDay: WeekdayValue,
  fromHour: string,
  toDay: WeekdayValue,
  toHour: string
) => {
  const from = toWeekdayTimeMs(fromDay, fromHour)
  const to = toWeekdayTimeMs(toDay, toHour)
  if (from === null || to === null) return null
  return to - from
}

export const addScheduleSlot = (
  list: ScheduleSlot[] | undefined,
  slot: ScheduleSlot
): ScheduleSlot[] => {
  const currentList = list ?? []
  if (!slot.dia || !slot.hora) return currentList
  if (currentList.some(item => item.dia === slot.dia && item.hora === slot.hora)) {
    return currentList
  }
  return [...currentList, slot]
}

export const removeScheduleSlot = (
  list: ScheduleSlot[] | undefined,
  index: number
): ScheduleSlot[] => {
  const currentList = [...(list ?? [])]
  currentList.splice(index, 1)
  return currentList
}
