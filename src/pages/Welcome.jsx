import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, ScanLine } from 'lucide-react'
import { HERO_IMAGES, asset } from '../config'
import { getWorker } from '../lib/survey'
import InstallButton from '../components/InstallButton'
import Scanner, { parseSurveyQr } from '../components/Scanner'

export const setSessionTag = (tag) => {
  try { tag ? sessionStorage.setItem('sav-tag', tag) : sessionStorage.removeItem('sav-tag') } catch { /* sin storage */ }
}
export const getSessionTag = () => {
  try { return sessionStorage.getItem('sav-tag') || '' } catch { return '' }
}

export default function Welcome() {
  const { tag: rawTag } = useParams()
  const tag = (rawTag || '').toUpperCase()
  const nav = useNavigate()
  const [worker, setWorker] = useState(null)
  const [hero, setHero] = useState(0)
  const [scan, setScan] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    setSessionTag(tag)
    setWorker(null)
    if (tag) getWorker(tag).then(setWorker)
  }, [tag])

  useEffect(() => {
    const t = setInterval(() => setHero((h) => (h + 1) % HERO_IMAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  const onScan = useCallback((text) => {
    setScan(false)
    const r = parseSurveyQr(text)
    if (!r.ok) {
      setToast('Ese código no es de San Andrés Vibes')
      setTimeout(() => setToast(''), 2500)
      return
    }
    nav(r.tag ? `/t/${r.tag}` : '/', { replace: true })
  }, [nav])

  const first = worker?.name?.trim()?.[0]?.toUpperCase()

  return (
    <div className="screen">
      <section className="hero">
        <div className="hero-bg">
          {HERO_IMAGES.map((src, i) => <img key={src} src={src} alt="" className={i === hero ? 'on' : ''} />)}
        </div>
        <div className="hero-content">
          <img className="hero-logo" src={asset('logo-white.png')} alt="San Andrés Vibes experiences" />
          <div className="hero-spacer" />

          {worker && (
            <div className="worker-chip">
              <span className="dot">{first}</span>
              <span>Te atendió <b>{worker.name}</b></span>
            </div>
          )}
          <h1 className="hero-title">Tu opinión <span>nos impulsa</span></h1>
          <div className="brush" />
          <p className="hero-text">
            Ayúdanos a mejorar completando esta breve encuesta sobre tu experiencia en San Andrés. Solo toma 1 minuto.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-block" onClick={() => nav('/encuesta')}>
              <Play size={18} fill="currentColor" /> Comenzar encuesta
            </button>
            <div className="hero-mini">
              <button className="btn btn-outline" onClick={() => setScan(true)}>
                <ScanLine size={18} /> Escanear QR
              </button>
              <InstallButton />
            </div>
          </div>
          <div className="hero-foot">¡Gracias por ser parte de nuestra aventura! 🌴</div>
        </div>
      </section>
      {scan && <Scanner onResult={onScan} onClose={() => setScan(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
