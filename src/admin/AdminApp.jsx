import { useEffect, useState } from 'react'
import { BarChart3, LogOut, MessageSquareText, ListChecks, QrCode, Trophy, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { asset } from '../config'
import { Overview, Ranking, Comments } from './Dashboard'
import Questions from './Questions'
import Workers from './Workers'
import { useAdminData } from './useData'

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: BarChart3 },
  { id: 'ranking', label: 'Ranking QR', icon: Trophy },
  { id: 'comentarios', label: 'Comentarios', icon: MessageSquareText },
  { id: 'preguntas', label: 'Preguntas', icon: ListChecks },
  { id: 'qr', label: 'Equipo y QR', icon: QrCode }
]

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setErr('Correo o contraseña incorrectos')
    setBusy(false)
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <img src={asset('logo.png')} alt="San Andrés Vibes" />
        <h1>Panel administrativo</h1>
        <p>Encuestas de satisfacción</p>
        <div className="field">
          <label htmlFor="em">Correo</label>
          <input id="em" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw">Contraseña</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="err" style={{ textAlign: 'left', margin: '0 0 12px' }}>{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </div>
  )
}

function Panel({ session }) {
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem('sav-admin-tab') || 'resumen' } catch { return 'resumen' }
  })
  const data = useAdminData()
  const go = (id) => {
    setTab(id)
    try { localStorage.setItem('sav-admin-tab', id) } catch { /* noop */ }
    window.scrollTo(0, 0)
  }

  const view = {
    resumen: <Overview data={data} />,
    ranking: <Ranking data={data} />,
    comentarios: <Comments data={data} />,
    preguntas: <Questions onChange={data.reload} />,
    qr: <Workers onChange={data.reload} />
  }[tab]

  return (
    <div className="admin">
      <aside className="side">
        <img src={asset('logo-white.png')} alt="San Andrés Vibes" />
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
            <t.icon size={19} /> {t.label}
          </button>
        ))}
        <div className="grow" />
        <button onClick={() => window.open(asset('#/'), '_blank')}><ExternalLink size={19} /> Ver encuesta</button>
        <div className="who">{session.user.email}</div>
        <button onClick={() => supabase.auth.signOut()}><LogOut size={19} /> Cerrar sesión</button>
      </aside>
      <main className="main">{view}</main>
      <nav className="mobile-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
            <t.icon size={21} /> {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    document.title = 'Panel · San Andrés Vibes'
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setIsAdmin(null); return }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data))
  }, [session])

  if (session === undefined || (session && isAdmin === null)) {
    return <div className="center-msg"><div><div className="spinner" />Cargando…</div></div>
  }
  if (!session) return <Login />
  if (!isAdmin) {
    return (
      <div className="login">
        <div className="login-card">
          <img src={asset('logo.png')} alt="" />
          <h1>Sin permisos</h1>
          <p>La cuenta <b>{session.user.email}</b> no es administradora. Agrégala a la tabla <code>admins</code> en Supabase.</p>
          <button className="btn btn-ghost btn-block" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </div>
    )
  }
  return <Panel session={session} />
}
