import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Download, ExternalLink, Nfc, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { asset, surveyUrlForTag } from '../config'

const cleanTag = (s) => s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9_-]/g, '').slice(0, 32)
const suggestTag = (name) => {
  const base = cleanTag((name || 'SAV').split(/\s+/)[0]).slice(0, 10) || 'SAV'
  return `${base}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

const loadImg = (src) => new Promise((res, rej) => {
  const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src
})

// Genera una tarjeta PNG lista para imprimir: logo + QR + nombre + TAG
async function downloadCard(qrCanvas, { name, tag }) {
  const W = 900, H = 1200
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#00a79d'); grad.addColorStop(1, '#0a62ae')
  g.fillStyle = grad; g.fillRect(0, 0, W, H)
  g.fillStyle = '#fff'
  g.beginPath(); g.roundRect(50, 50, W - 100, H - 100, 48); g.fill()
  try {
    const logo = await loadImg(asset('logo.png'))
    const lw = 460, lh = (logo.height / logo.width) * lw
    g.drawImage(logo, (W - lw) / 2, 95, lw, lh)
  } catch { /* sin logo */ }
  const qs = 560
  g.imageSmoothingEnabled = false
  g.drawImage(qrCanvas, (W - qs) / 2, 360, qs, qs)
  g.textAlign = 'center'
  g.fillStyle = '#0f2233'
  g.font = '700 46px Poppins, sans-serif'
  g.fillText(name, W / 2, 990)
  g.fillStyle = '#00857d'
  g.font = '700 32px Consolas, monospace'
  g.fillText(tag, W / 2, 1040)
  g.fillStyle = '#5f7385'
  g.font = '500 28px Poppins, sans-serif'
  g.fillText('Escanea y califica nuestro servicio', W / 2, 1095)
  const a = document.createElement('a')
  a.href = c.toDataURL('image/png')
  a.download = `QR-${tag}.png`
  a.click()
}

// Graba el link de la encuesta en un TAG NFC (Chrome en Android).
// En iPhone el TAG grabado se lee de forma nativa y abre la encuesta.
async function writeNfc(url, setNfc) {
  if (!('NDEFReader' in window)) {
    setNfc({ kind: 'info', text: 'Para grabar TAG NFC abre este panel en Chrome en un Android con NFC. También puedes usar la app gratuita “NFC Tools” (iPhone o Android): graba un registro URL con el link de este QR.' })
    return
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 30000)
  setNfc({ kind: 'wait', text: 'Acerca el TAG NFC a la parte trasera del teléfono…' })
  try {
    await new window.NDEFReader().write({ records: [{ recordType: 'url', data: url }] }, { signal: ctrl.signal, overwrite: true })
    setNfc({ kind: 'ok', text: '¡TAG NFC grabado! Ya abre la encuesta en iPhone y Android.' })
  } catch (e) {
    setNfc({ kind: 'err', text: e?.name === 'AbortError' ? 'Tiempo agotado. Inténtalo de nuevo.' : e?.name === 'NotAllowedError' ? 'Permite el uso de NFC en el navegador.' : 'No se pudo grabar el TAG: ' + (e?.message || e) })
  } finally {
    clearTimeout(timer)
  }
}

function QrCard({ worker, generic, onEdit, onDelete, onToggle }) {
  const ref = useRef(null)
  const url = surveyUrlForTag(generic ? '' : worker.tag)
  const [copied, setCopied] = useState(false)
  const [nfc, setNfc] = useState(null)
  const info = generic ? { name: 'Encuesta San Andrés Vibes', tag: 'QR GENERAL' } : worker

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ }
  }

  return (
    <div className={'qr-card' + (generic ? ' generic' : '') + (worker && !worker.active ? ' dim' : '')} style={worker && !worker.active ? { opacity: 0.6 } : undefined}>
      <QRCodeCanvas ref={ref} value={url} size={180} level="M" marginSize={1} fgColor="#063e72"
        imageSettings={{ src: asset('icons/favicon-64.png'), height: 34, width: 34, excavate: true }} />
      <div className="name">{info.name}</div>
      <span className="tag">{info.tag}</span>
      {worker?.role && <div className="hint">{worker.role}</div>}
      {generic && <div className="hint">Las respuestas no se asignan a ningún trabajador</div>}
      {worker && <span className={'pill ' + (worker.active ? 'ok' : 'off')}>{worker.active ? 'Activo' : 'Inactivo'}</span>}
      <div className="actions">
        <button className="btn btn-primary btn-sm" onClick={() => downloadCard(ref.current, info)}><Download size={15} /> PNG</button>
        <button className="btn btn-ghost btn-sm" onClick={copy}><Copy size={15} /> {copied ? '¡Copiado!' : 'Link'}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => writeNfc(url, setNfc)} title="Grabar en TAG NFC"><Nfc size={15} /> NFC</button>
        <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer" title="Abrir"><ExternalLink size={15} /></a>
      </div>
      {nfc && <div className={'nfc-status ' + nfc.kind} onClick={() => nfc.kind !== 'wait' && setNfc(null)}>{nfc.text}</div>}
      {worker && (
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}><Pencil size={14} /> Editar</button>
          <button className="btn btn-ghost btn-sm" onClick={onToggle}>{worker.active ? 'Desactivar' : 'Activar'}</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete} aria-label="Eliminar"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  )
}

function Editor({ initial, onClose, onSaved }) {
  const [f, setF] = useState({ name: '', role: '', tag: '', active: true, ...initial })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    const tag = cleanTag(f.tag || suggestTag(f.name))
    if (!f.name.trim()) return setErr('Escribe el nombre')
    if (tag.length < 2) return setErr('El TAG debe tener al menos 2 caracteres (A-Z, 0-9, - o _)')
    setBusy(true)
    const row = { name: f.name.trim(), role: f.role?.trim() || null, tag, active: f.active }
    const { error } = initial?.id
      ? await supabase.from('workers').update(row).eq('id', initial.id)
      : await supabase.from('workers').insert(row)
    setBusy(false)
    if (error) return setErr(error.code === '23505' ? `El TAG “${tag}” ya está en uso. Elige otro.` : error.message)
    onSaved()
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h2>{initial?.id ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
        <div className="field">
          <label>Nombre</label>
          <input className="input" value={f.name} maxLength={80} autoFocus
            onChange={(e) => setF({ ...f, name: e.target.value, tag: initial?.id || f.tagTouched ? f.tag : suggestTag(e.target.value) })} />
        </div>
        <div className="field">
          <label>Cargo (opcional)</label>
          <input className="input" value={f.role || ''} placeholder="Guía, capitán, recepción…" onChange={(e) => setF({ ...f, role: e.target.value })} />
        </div>
        <div className="field">
          <label>TAG único del QR</label>
          <input className="input" value={f.tag} style={{ fontFamily: 'Consolas, monospace', fontWeight: 700 }}
            onChange={(e) => setF({ ...f, tag: cleanTag(e.target.value), tagTouched: true })} />
          <span className="hint">
            Solo letras, números, guion o guion bajo. El QR apunta a: {surveyUrlForTag(f.tag || 'TAG')}
            {initial?.id && ' · Si cambias el TAG, el QR impreso anterior dejará de asignarse a esta persona.'}
          </span>
        </div>
        <label className="check-row"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Activo</label>
        {err && <p className="err">{err}</p>}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}

export default function Workers({ onChange }) {
  const [list, setList] = useState(null)
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('workers').select('*').order('created_at')
    if (error) setErr(error.message)
    setList(data || [])
  }
  useEffect(() => { load() }, [])
  const changed = () => { load(); onChange?.() }

  const toggle = async (w) => { await supabase.from('workers').update({ active: !w.active }).eq('id', w.id); changed() }
  const remove = async (w) => {
    if (!window.confirm(`¿Eliminar a ${w.name}?\nSus encuestas se conservan pero quedarán como “Trabajador eliminado”. Para pausarlo usa “Desactivar”.`)) return
    const { error } = await supabase.from('workers').delete().eq('id', w.id)
    if (error) setErr(error.message)
    changed()
  }

  return (
    <>
      <div className="main-head">
        <div>
          <h1>Equipo y códigos QR</h1>
          <p>Cada trabajador tiene un TAG único: las encuestas de su QR o de su TAG NFC se le asignan automáticamente.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({})}><Plus size={18} /> Nuevo trabajador</button>
      </div>
      {err && <div className="card err" style={{ marginBottom: 12 }}>{err}</div>}
      <div className="qr-grid">
        <QrCard generic />
        {list?.map((w) => (
          <QrCard key={w.id} worker={w} onEdit={() => setEdit(w)} onDelete={() => remove(w)} onToggle={() => toggle(w)} />
        ))}
      </div>
      {list && !list.length && <div className="empty">Agrega a tu equipo para generar sus QR personales.</div>}
      {edit && <Editor initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); changed() }} />}
    </>
  )
}
