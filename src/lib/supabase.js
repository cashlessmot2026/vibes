import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from '../config'

const TOKEN_KEY = 'sav-admin-session'

export function getAdminSession() {
  try {
    const s = JSON.parse(localStorage.getItem(TOKEN_KEY))
    if (s?.token && new Date(s.expires_at) > new Date()) return s
  } catch { /* sin storage */ }
  return null
}

export function setAdminSession(s) {
  try { s ? localStorage.setItem(TOKEN_KEY, JSON.stringify(s)) : localStorage.removeItem(TOKEN_KEY) } catch { /* noop */ }
}

// Añade el token del admin (si hay sesión) a cada petición; RLS lo valida en Supabase.
const fetchWithAdmin = (url, opts = {}) => {
  const s = getAdminSession()
  if (!s) return fetch(url, opts)
  const headers = new Headers(opts.headers)
  headers.set('x-admin-token', s.token)
  return fetch(url, { ...opts, headers })
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchWithAdmin }
})
