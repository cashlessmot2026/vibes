export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://pmgmnapwqdrrjvopblzn.supabase.co'
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_We6jp6Y-6HNjpWTM-VfhHw_vLLg09VF'

// Ruta oculta del panel: https://.../#/<ADMIN_PATH>
export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'admin'

export const GOOGLE_PLACE_ID = 'ChIJSTFP4YUpRAkRQNgr1cRHY7Y'
export const GOOGLE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`
export const TRIPADVISOR_REVIEW_URL =
  'https://www.tripadvisor.es/UserReviewEdit-g297482-d24116479-San_Andres_Vibes-San_Andres_Island_San_Andres_and_Providencia_Department.html'
export const INSTAGRAM_URL = 'https://instagram.com/sanandresvibes'

const base = import.meta.env.BASE_URL || '/'

// URL base pública que se codifica en los QR
export function publicBaseUrl() {
  const env = import.meta.env.VITE_PUBLIC_URL
  if (env) return env.endsWith('/') ? env : env + '/'
  return window.location.origin + base
}

export const surveyUrlForTag = (tag) =>
  tag ? `${publicBaseUrl()}#/t/${encodeURIComponent(tag)}` : `${publicBaseUrl()}#/`

export const asset = (p) => base + p.replace(/^\//, '')

export const VEHICLE_IMAGES = Array.from({ length: 19 }, (_, i) =>
  asset(`vehicles/v${String(i + 1).padStart(2, '0')}.webp`)
)
// Fotos de portada (buggies)
export const HERO_IMAGES = [4, 2, 7, 1].map((n) => asset(`vehicles/v0${n}.webp`))
