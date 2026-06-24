import { blankEvent } from './schema'

const API = (import.meta.env.VITE_CALENDAR_TEMP_API || '').replace(/\/+$/, '')
const PASSWORD_HEADER = 'x-calendar-password'

export const hasTempCalendarAPI = Boolean(API)

function url(id = '') {
  if (!API) throw new Error('VITE_CALENDAR_TEMP_API is not configured')
  return id ? `${API}/${encodeURIComponent(id)}` : API
}

async function readError(res) {
  try {
    const body = await res.json()
    return body?.error || res.statusText
  } catch {
    return res.statusText
  }
}

async function request(path, options = {}) {
  const res = await fetch(url(path), options)
  if (!res.ok) throw new Error(await readError(res))
  if (res.status === 204) return undefined
  return res.json()
}

function headers(password) {
  return {
    'content-type': 'application/json',
    ...(password ? { [PASSWORD_HEADER]: password } : {}),
  }
}

function clean(input) {
  return {
    ...blankEvent(),
    ...input,
    images: [],
  }
}

export async function list() {
  if (!hasTempCalendarAPI) return []
  const data = await request()
  return (data?.events || []).sort((a, b) =>
    (a.startDate || '').localeCompare(b.startDate || '')
  )
}

export async function get(id) {
  if (!hasTempCalendarAPI) return undefined
  return request(id)
}

export async function create(input, options = {}) {
  return request('', {
    method: 'POST',
    headers: headers(options.password),
    body: JSON.stringify(clean(input)),
  })
}

export async function update(id, patch, options = {}) {
  return request(id, {
    method: 'PUT',
    headers: headers(options.password),
    body: JSON.stringify(clean(patch)),
  })
}

export async function remove(id, options = {}) {
  await request(id, {
    method: 'DELETE',
    headers: headers(options.password),
  })
}

export async function validatePassword(password) {
  await request('_auth', {
    method: 'POST',
    headers: headers(password),
  })
  return true
}

export const backend = { list, get, create, update, remove, validatePassword }
