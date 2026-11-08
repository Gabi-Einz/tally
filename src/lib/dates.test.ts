import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  formatDayHeading,
  formatMonth,
  monthOf,
  monthRange,
  parseISODate,
  todayISO,
} from './dates'

describe('dates', () => {
  it('usa la fecha local, no UTC', () => {
    expect(todayISO(new Date(2026, 10, 8, 23, 59))).toBe('2026-11-08')
    expect(parseISODate('2026-11-08').getDate()).toBe(8)
  })

  it('suma días cruzando meses', () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('calcula el rango del mes', () => {
    expect(monthOf('2026-11-08')).toBe('2026-11')
    expect(monthRange('2026-11')).toEqual(['2026-11-01', '2026-11-30'])
    expect(monthRange('2028-02')).toEqual(['2028-02-01', '2028-02-29'])
  })

  it('suma meses cruzando años', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
  })

  it('formatea el mes con mayúscula inicial', () => {
    expect(formatMonth('2026-11', 'es-AR')).toBe('Noviembre de 2026')
    expect(formatMonth('2026-11', 'en-US')).toBe('November 2026')
  })

  it('marca hoy y ayer en los encabezados', () => {
    const labels = { today: 'Hoy', yesterday: 'Ayer' }
    expect(
      formatDayHeading('2026-11-08', '2026-11-08', 'es-AR', labels),
    ).toMatch(/^Hoy · domingo/)
    expect(
      formatDayHeading('2026-11-07', '2026-11-08', 'es-AR', labels),
    ).toMatch(/^Ayer · sábado/)
    expect(
      formatDayHeading('2026-11-01', '2026-11-08', 'es-AR', labels),
    ).toMatch(/^Domingo/)
  })
})
