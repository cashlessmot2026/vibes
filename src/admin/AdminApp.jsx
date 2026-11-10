import { useEffect, useState } from 'react'
import { BarChart3, LogOut, MessageSquareText, ListChecks, QrCode, Trophy, ExternalLink } from 'lucide-react'
import { supabase, getAdminSession, setAdminSession } from '../lib/supabase'
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

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { data, error } = await supabase.rpc('admin_login', { p_username: username.trim(), p_password: password })
    setBusy(false)
    if (error) {
      const m = error.message || ''
      setErr(m.includes('locked') ? 'Demasiados intentos. Espera 15 minutos.'
        : m.includes('invalid_credentials') ? 'Usuario o contraseña incorrectos'
        : 'No se pudo conectar con el servidor')
      return
    }
    const s = data?.[0]
    if (!s?.token) return setErr('Usuario o contraseña incorrectos')
    setAdminSession(s)
    onLogin(s)
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <img src={asset('logo.png')} alt="San Andrés Vibes" />
        <h1>Panel administrativo</h1>
        <p>Encuestas de satisfacción</p>
        <div className="field">
          <label htmlFor="us">Usuario</label>
          <input id="us" className="input" autoComplete="username" autoCapitalize="none" required value={username} onChange={(e) => setUsername(e.target.value)} />
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

function Panel({ session, onLogout }) {
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
        <div className="who">{session.username}</div>
        <button onClick={onLogout}><LogOut size={19} /> Cerrar sesión</button>
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
  const [session, setSession] = useState(() => getAdminSession())
  const [checked, setChecked] = useState(false)

  useEffect(() => { document.title = 'Panel · San Andrés Vibes' }, [])

  // Verifica que el token siga siendo válido en el servidor
  useEffect(() => {
    if (!session) { setChecked(true); return }
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!error && !data) { setAdminSession(null); setSession(null) }
      setChecked(true)
    })
  }, [session])

  const logout = async () => {
    await supabase.rpc('admin_logout')
    setAdminSession(null)
    setSession(null)
  }

  if (!checked) return <div className="center-msg"><div><div className="spinner" />Cargando…</div></div>
  if (!session) return <Login onLogin={(s) => { setChecked(false); setSession(s) }} />
  return <Panel session={session} onLogout={logout} />
}
