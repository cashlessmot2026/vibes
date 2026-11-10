import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Home } from 'lucide-react'
import { GOOGLE_REVIEW_URL, TRIPADVISOR_REVIEW_URL } from '../config'
import VehicleSlider from '../components/VehicleSlider'

const GoogleG = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)
const Owl = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#34E0A1" />
    <circle cx="7.6" cy="12.6" r="3.4" fill="#fff" /><circle cx="16.4" cy="12.6" r="3.4" fill="#fff" />
    <circle cx="7.6" cy="12.6" r="1.6" fill="#000" /><circle cx="16.4" cy="12.6" r="1.6" fill="#000" />
    <path d="M10.6 15.8L12 17.6l1.4-1.8z" fill="#000" />
  </svg>
)

export default function Thanks() {
  const nav = useNavigate()
  const { state } = useLocation()
  const avg = state?.avg || 0
  const tag = state?.tag || ''
  const happy = avg === 0 || avg >= 4

  return (
    <div className="screen">
      <div className="thanks">
        <div className="check"><Check size={48} strokeWidth={3} /></div>
        <h1>¡Gracias!</h1>
        <p>
          Tu opinión es muy importante para nosotros.<br />
          Seguiremos mejorando para ofrecerte las mejores experiencias en San Andrés.
        </p>
        {state?.queued && (
          <div className="notice">Estás sin conexión: tu encuesta quedó guardada y se enviará automáticamente.</div>
        )}

        <div className="review-card">
          <h3>{happy ? '¿Nos regalas una reseña? ⭐' : 'Cuéntale al mundo tu experiencia'}</h3>
          <p style={{ fontSize: 13.5, marginTop: -4 }}>Solo toma unos segundos y nos ayuda muchísimo.</p>
          <a className="review-btn" href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            <span className="logo"><GoogleG /></span>
            <span>Reseña en Google<small>Califícanos en Google Maps</small></span>
            <ChevronRight className="go" size={20} />
          </a>
          <a className="review-btn" href={TRIPADVISOR_REVIEW_URL} target="_blank" rel="noopener noreferrer">
            <span className="logo"><Owl /></span>
            <span>Reseña en Tripadvisor<small>Comparte tu opinión con otros viajeros</small></span>
            <ChevronRight className="go" size={20} />
          </a>
        </div>

        <div style={{ width: '100%' }}><VehicleSlider caption="¡Hasta la próxima aventura!" /></div>

        <button className="btn btn-ghost btn-block" onClick={() => nav(tag ? `/t/${tag}` : '/', { replace: true })}>
          <Home size={18} /> Volver al inicio
        </button>
      </div>
    </div>
  )
}
