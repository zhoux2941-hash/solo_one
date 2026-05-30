import type { City, TimekeepingRule, LogEntry } from '../../shared/types'

const BASE = '/api/drumtower'

export async function fetchCities(): Promise<City[]> {
  const res = await fetch(`${BASE}/cities`)
  const data = await res.json()
  return data.cities
}

export async function createCity(params: {
  name: string
  dynasty: string
  latitude?: number
  longitude?: number
  description: string
  rules: Array<{
    shichen: string
    modern_time: string
    bell_count: number
    drum_count: number
    description: string
  }>
}): Promise<{ city: City; rules: TimekeepingRule[] }> {
  const res = await fetch(`${BASE}/cities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  return data
}

export async function deleteCity(cityId: number): Promise<void> {
  await fetch(`${BASE}/cities/${cityId}`, {
    method: 'DELETE',
  })
}

export async function fetchRules(cityId: number): Promise<TimekeepingRule[]> {
  const res = await fetch(`${BASE}/rules/${cityId}`)
  const data = await res.json()
  return data.rules
}

export async function postLog(params: {
  city_id: number
  shichen: string
  bell_count: number
  drum_count: number
  action: string
}): Promise<LogEntry> {
  const res = await fetch(`${BASE}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  return data.log
}

export async function fetchLogs(cityId?: number, limit?: number): Promise<LogEntry[]> {
  const params = new URLSearchParams()
  if (cityId) params.set('city_id', String(cityId))
  if (limit) params.set('limit', String(limit))
  const res = await fetch(`${BASE}/logs?${params}`)
  const data = await res.json()
  return data.logs
}

export function getExportUrl(cityId: number): string {
  return `${BASE}/export/${cityId}`
}
