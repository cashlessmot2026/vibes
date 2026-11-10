import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Home, ThumbsDown, ThumbsUp, Send } from 'lucide-react'
import { asset } from '../config'
import { loadQuestions, submitSurvey } from '../lib/survey'
import VehicleSlider from '../components/VehicleSlider'
import Stars from '../components/Stars'
import { getSessionTag } from './Welcome'

function isAnswered(q, v) {
  if (q.type === 'multiple') return Array.isArray(v) && v.length > 0
  if (q.type === 'text') return typeof v === 'string' && v.trim() !== ''
  return v !== undefined && v !== null && v !== ''
}

function QuestionInput({ q, value, onChange }) {
  const opts = Array.isArray(q.options) ? q.options : []
  switch (q.type) {
    case 'rating':
      return <Stars value={value} onChange={onChange} />
    case 'single':
      return (
        <div className="opts" role="radiogroup">
          {opts.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={value === o}
              className={'opt round' + (value === o ? ' on' : '')} onClick={() => onChange(o)}>
              <span className="box">{value === o && <Check size={16} strokeWidth={3} />}</span>{o}
            </button>
          ))}
        </div>
      )
    case 'multiple': {
      const arr = Array.isArray(value) ? value : []
      const toggle = (o) => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])
      return (
        <div className="opts">
          {opts.map((o) => (
            <button key={o} type="button" role="checkbox" aria-checked={arr.includes(o)}
              className={'opt' + (arr.includes(o) ? ' on' : '')} onClick={() => toggle(o)}>
              <span className="box">{arr.includes(o) && <Check size={16} strokeWidth={3} />}</span>{o}
            </button>
          ))}
        </div>
      )
    }
    case 'yes_no':
      return (
        <div className="yesno">
          <button type="button" className={'yn yes' + (value === true ? ' on' : '')} onClick={() => onChange(true)}>
            <ThumbsUp size={22} /> Sí
          </button>
          <button type="button" className={'yn no' + (value === false ? ' on' : '')} onClick={() => onChange(false)}>
            <ThumbsDown size={22} /> No
          </button>
        </div>
      )
    case 'text':
      return (
        <textarea className="textarea" maxLength={2000} placeholder="Cuéntanos más sobre tu experiencia…"
          value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )
    default:
      return null
  }
}

function Shell({ children }) {
  return <div className="screen"><div className="center-msg"><div>{children}</div></div></div>
}

export default function Survey() {
  const nav = useNavigate()
  const tag = getSessionTag()
  const [questions, setQuestions] = useState(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadQuestions()
      .then(({ questions }) => setQuestions(questions))
      .catch(() => setError('No pudimos cargar la encuesta. Revisa tu conexión e inténtalo de nuevo.'))
  }, [])

  const home = () => nav(tag ? `/t/${tag}` : '/')
  const q = questions?.[step]
  const total = questions?.length || 0
  const last = step === total - 1
  const value = q ? answers[q.id] : undefined
  const canNext = q && (!q.required || isAnswered(q, value))

  const setValue = (v) => {
    setAnswers((a) => ({ ...a, [q.id]: v }))
    // En estrellas y Sí/No avanza solo para hacerlo más rápido
    if ((q.type === 'rating' || q.type === 'yes_no') && !last) {
      const id = q.id
      setTimeout(() => setStep((s) => (questions[s]?.id === id ? s + 1 : s)), 450)
    }
  }

  const payload = useMemo(
    () => (questions || [])
      .filter((x) => isAnswered(x, answers[x.id]))
      .map((x) => ({ question_id: x.id, value: x.type === 'text' ? answers[x.id].trim() : answers[x.id] })),
    [questions, answers]
  )

  const submit = async () => {
    setSending(true)
    setError('')
    try {
      const scores = questions.filter((x) => x.type === 'rating' && answers[x.id]).map((x) => answers[x.id])
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const res = await submitSurvey(tag, payload)
      nav('/gracias', { replace: true, state: { avg, queued: res.queued, tag } })
    } catch {
      setError('No se pudo enviar la encuesta. Inténtalo de nuevo.')
      setSending(false)
    }
  }

  if (error && !questions) {
    return <Shell><p>{error}</p><button className="btn btn-primary" onClick={() => location.reload()}>Reintentar</button></Shell>
  }
  if (!questions) return <Shell><div className="spinner" />Cargando encuesta…</Shell>
  if (!total) return <Shell><p>No hay preguntas activas por ahora.</p><button className="btn btn-ghost" onClick={home}>Volver</button></Shell>

  return (
    <div className="screen">
      <header className="s-header">
        <img src={asset('logo.png')} alt="San Andrés Vibes" />
        <button className="icon-btn" onClick={home} aria-label="Inicio"><Home size={20} /></button>
      </header>
      <div className="progress">
        <div className="progress-track"><div className="progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
        <small>{step + 1} / {total}</small>
      </div>

      <main className="s-body">
        <div key={q.id} className="q-anim" style={{ display: 'grid', gap: 16 }}>
          <h1 className="q-title">{q.title}{q.required && <span className="q-required"> *</span>}</h1>
          {q.subtitle && <p className="q-sub">{q.subtitle}</p>}
          <QuestionInput q={q} value={value} onChange={setValue} />
        </div>
        <VehicleSlider />
        {error && <div className="notice">{error}</div>}
      </main>

      <footer className={'s-footer' + (step === 0 ? ' single' : '')}>
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}><ChevronLeft size={18} /> Atrás</button>
        )}
        {last ? (
          <button className="btn btn-primary" disabled={!canNext || sending} onClick={submit}>
            {sending ? 'Enviando…' : <><Send size={18} /> Enviar encuesta</>}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            {q.required || isAnswered(q, value) ? 'Siguiente' : 'Omitir'} <ChevronRight size={18} />
          </button>
        )}
      </footer>
    </div>
  )
}
