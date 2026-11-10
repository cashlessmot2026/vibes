import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { TRANSLATION_LANGS } from '../i18n'

const TYPES = {
  rating: 'Estrellas 1-5',
  single: 'Una opción',
  multiple: 'Varias opciones',
  yes_no: 'Sí / No',
  text: 'Texto libre'
}

function Editor({ initial, onClose, onSaved, nextPosition }) {
  const [f, setF] = useState(() => ({
    type: 'rating', title: '', subtitle: '', required: true, active: true,
    ...initial,
    optionsText: (initial?.options || []).join('\n'),
    tr: Object.fromEntries(TRANSLATION_LANGS.map(({ code }) => {
      const x = initial?.translations?.[code] || {}
      return [code, { title: x.title || '', subtitle: x.subtitle || '', optionsText: (x.options || []).join('\n') }]
    }))
  }))
  const [trLang, setTrLang] = useState(TRANSLATION_LANGS[0].code)
  const setTr = (k) => (e) => setF({ ...f, tr: { ...f.tr, [trLang]: { ...f.tr[trLang], [k]: e.target.value } } })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const needsOptions = f.type === 'single' || f.type === 'multiple'

  const save = async (e) => {
    e.preventDefault()
    const options = needsOptions ? [...new Set(f.optionsText.split('\n').map((s) => s.trim()).filter(Boolean))] : []
    if (!f.title.trim()) return setErr('Escribe la pregunta')
    if (needsOptions && options.length < 2) return setErr('Agrega al menos 2 opciones (una por línea)')
    const translations = {}
    for (const { code } of TRANSLATION_LANGS) {
      const x = f.tr[code]
      const o = {}
      if (x.title.trim()) o.title = x.title.trim()
      if (x.subtitle.trim()) o.subtitle = x.subtitle.trim()
      if (needsOptions) {
        const lines = x.optionsText.split('\n').map((v) => v.trim())
        if (lines.some(Boolean)) o.options = options.map((_, i) => lines[i] || '')
      }
      if (Object.keys(o).length) translations[code] = o
    }
    setBusy(true)
    const row = {
      type: f.type, title: f.title.trim(), subtitle: f.subtitle?.trim() || null,
      options, required: f.type === 'text' ? false : f.required, active: f.active, translations
    }
    const { error } = initial?.id
      ? await supabase.from('questions').update(row).eq('id', initial.id)
      : await supabase.from('questions').insert({ ...row, position: nextPosition })
    setBusy(false)
    if (error) return setErr(error.message)
    onSaved()
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h2>{initial?.id ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
        <div className="field">
          <label>Tipo de respuesta</label>
          <select className="select" value={f.type} onChange={set('type')}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Pregunta</label>
          <input className="input" value={f.title} onChange={set('title')} maxLength={200} placeholder="¿Cómo calificarías…?" />
        </div>
        <div className="field">
          <label>Texto de ayuda (opcional)</label>
          <input className="input" value={f.subtitle || ''} onChange={set('subtitle')} maxLength={200} />
        </div>
        {needsOptions && (
          <div className="field">
            <label>Opciones (una por línea)</label>
            <textarea value={f.optionsText} onChange={set('optionsText')} placeholder={'Opción 1\nOpción 2\nOpción 3'} />
          </div>
        )}
        <details className="tr-box" open={!!initial?.id}>
          <summary>🌐 Traducciones (inglés, francés, italiano, alemán, portugués)</summary>
          <div className="seg" style={{ margin: '10px 0 12px', flexWrap: 'wrap' }}>
            {TRANSLATION_LANGS.map((l) => (
              <button type="button" key={l.code} className={trLang === l.code ? 'on' : ''} onClick={() => setTrLang(l.code)}>
                {l.code.toUpperCase()}{f.tr[l.code].title.trim() ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <div className="field">
            <label>Pregunta en {TRANSLATION_LANGS.find((l) => l.code === trLang).label}</label>
            <input className="input" value={f.tr[trLang].title} onChange={setTr('title')} maxLength={200} placeholder={f.title} />
          </div>
          <div className="field">
            <label>Texto de ayuda</label>
            <input className="input" value={f.tr[trLang].subtitle} onChange={setTr('subtitle')} maxLength={200} placeholder={f.subtitle || ''} />
          </div>
          {needsOptions && (
            <div className="field">
              <label>Opciones (mismo orden que en español, una por línea)</label>
              <textarea value={f.tr[trLang].optionsText} onChange={setTr('optionsText')} placeholder={f.optionsText} />
            </div>
          )}
          <p className="hint">Si un idioma queda vacío, el cliente verá la pregunta en español.</p>
        </details>
        {f.type !== 'text' && (
          <label className="check-row"><input type="checkbox" checked={f.required} onChange={set('required')} /> Respuesta obligatoria</label>
        )}
        <label className="check-row"><input type="checkbox" checked={f.active} onChange={set('active')} /> Visible en la encuesta</label>
        {f.type === 'rating' && <p className="hint">Las preguntas de estrellas forman el promedio de satisfacción y el ranking de QR.</p>}
        {f.type === 'yes_no' && <p className="hint">La primera pregunta Sí/No se usa como indicador de “Recomendación”.</p>}
        {err && <p className="err">{err}</p>}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}

export default function Questions({ onChange }) {
  const [list, setList] = useState(null)
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('questions').select('*').order('position').order('created_at')
    if (error) setErr(error.message)
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  const changed = () => { load(); onChange?.() }

  const move = async (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const arr = [...list]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setList(arr)
    await Promise.all(arr.map((q, idx) => (q.position !== idx + 1 ? supabase.from('questions').update({ position: idx + 1 }).eq('id', q.id) : null)))
    changed()
  }

  const toggle = async (q) => {
    await supabase.from('questions').update({ active: !q.active }).eq('id', q.id)
    changed()
  }

  const remove = async (q) => {
    if (!window.confirm(`¿Eliminar la pregunta “${q.title}”?\nLas respuestas ya recibidas se conservan. Si solo quieres ocultarla, usa el ojo.`)) return
    const { error } = await supabase.from('questions').delete().eq('id', q.id)
    if (error) setErr(error.message)
    changed()
  }

  const nextPosition = (list?.reduce((m, q) => Math.max(m, q.position), 0) || 0) + 1

  return (
    <>
      <div className="main-head">
        <div>
          <h1>Preguntas de la encuesta</h1>
          <p>Ordénalas, edítalas u ocúltalas. El banner de vehículos aparece automáticamente en todas.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({})}><Plus size={18} /> Nueva pregunta</button>
      </div>
      {err && <div className="card err" style={{ marginBottom: 12 }}>{err}</div>}
      {!list ? <div className="card empty"><div className="spinner" /></div> : !list.length ? (
        <div className="card empty">Aún no hay preguntas. Crea la primera.</div>
      ) : (
        <div>
          {list.map((q, i) => (
            <div key={q.id} className={'list-item' + (q.active ? '' : ' dim')}>
              <div className="order-btns">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir"><ChevronUp size={18} /></button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Bajar"><ChevronDown size={18} /></button>
              </div>
              <div className="grow">
                <div className="t">{i + 1}. {q.title}{q.required && <span className="q-required"> *</span>}</div>
                <div className="s">
                  <span className="type-badge">{TYPES[q.type]}</span>
                  {q.options?.length > 0 && <> · {q.options.join(' · ')}</>}
                  {' · 🌐 '}{Object.keys(q.translations || {}).length}/{TRANSLATION_LANGS.length}
                  {!q.active && <> · <span className="pill off">Oculta</span></>}
                </div>
              </div>
              <button className="icon-btn" title={q.active ? 'Ocultar' : 'Mostrar'} onClick={() => toggle(q)}>
                {q.active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button className="icon-btn" title="Editar" onClick={() => setEdit(q)}><Pencil size={17} /></button>
              <button className="icon-btn" title="Eliminar" style={{ color: 'var(--bad)' }} onClick={() => remove(q)}><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
      )}
      {edit && (
        <Editor initial={edit} nextPosition={nextPosition} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); changed() }} />
      )}
    </>
  )
}
