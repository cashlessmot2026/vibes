import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { LANGS, useI18n } from '../i18n'

// variant="row": botones visibles (portada) · variant="menu": botón con globo (encuesta)
export default function LangPicker({ variant = 'row' }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  if (variant === 'row') {
    return (
      <div className="lang-row" role="group" aria-label={t('language')}>
        {LANGS.map((l) => (
          <button key={l.code} type="button" className={'lang-chip' + (lang === l.code ? ' on' : '')}
            onClick={() => setLang(l.code)} aria-pressed={lang === l.code} title={l.label}>
            {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  const cur = LANGS.find((l) => l.code === lang)
  return (
    <div className="lang-menu" ref={ref}>
      <button type="button" className="lang-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={t('language')}>
        <Globe size={17} /> {cur.code.toUpperCase()}
      </button>
      {open && (
        <ul className="lang-list" role="listbox">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button type="button" role="option" aria-selected={lang === l.code} className={lang === l.code ? 'on' : ''}
                onClick={() => { setLang(l.code); setOpen(false) }}>
                <b className="lang-code">{l.code.toUpperCase()}</b> {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
