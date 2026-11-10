import { useEffect, useRef, useState } from 'react'
import { Nfc, X } from 'lucide-react'
import { useI18n } from '../i18n'

export const hasWebNfc = () => typeof window !== 'undefined' && 'NDEFReader' in window
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// Lee un mensaje NDEF y devuelve el primer texto/URL que contenga
function ndefToText(message) {
  for (const r of message.records) {
    try {
      if (r.recordType === 'url' || r.recordType === 'absolute-url') return new TextDecoder().decode(r.data)
      if (r.recordType === 'text') return new TextDecoder(r.encoding || 'utf-8').decode(r.data)
    } catch { /* siguiente registro */ }
  }
  return null
}

// Lector unificado: QR con la cámara trasera + TAG NFC (Android/Chrome).
// En iPhone el NFC lo lee el sistema directamente y abre la encuesta.
export default function Scanner({ onResult, onClose }) {
  const { t } = useI18n()
  const videoRef = useRef(null)
  const doneRef = useRef(false)
  const [msg, setMsg] = useState(t('scanAim'))
  const [nfcOn, setNfcOn] = useState(false)

  useEffect(() => {
    let stream, raf, stopped = false
    const abort = new AbortController()
    const finish = (text) => {
      if (doneRef.current) return
      doneRef.current = true
      stopped = true
      navigator.vibrate?.(60)
      onResult(text)
    }

    // ---- NFC (Android) ----
    if (hasWebNfc()) {
      try {
        const reader = new window.NDEFReader()
        reader.scan({ signal: abort.signal })
          .then(() => {
            setNfcOn(true)
            reader.onreading = (e) => { const txt = ndefToText(e.message); if (txt) finish(txt) }
          })
          .catch(() => setNfcOn(false))
      } catch { /* NFC no disponible */ }
    }

    // ---- QR con la cámara trasera ----
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null
    let jsQR = null
    const jsQRReady = detector ? Promise.resolve() : import('jsqr').then((m) => { jsQR = m.default })

    const tick = async () => {
      if (stopped) return
      const v = videoRef.current
      if (v && v.readyState >= 2) {
        try {
          let text = null
          if (detector) {
            text = (await detector.detect(v))[0]?.rawValue
          } else {
            const w = 480, h = Math.round((v.videoHeight / v.videoWidth) * 480) || 480
            canvas.width = w; canvas.height = h
            ctx.drawImage(v, 0, 0, w, h)
            text = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })?.data
          }
          if (text) return finish(text)
        } catch { /* sigue intentando */ }
      }
      raf = requestAnimationFrame(tick)
    }

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        })
        if (stopped) return stream.getTracks().forEach((tr) => tr.stop())
        const v = videoRef.current
        v.setAttribute('playsinline', '') // iOS: evita pantalla completa
        v.srcObject = stream
        await v.play()
        await jsQRReady
        tick()
      } catch (e) {
        setMsg(e?.name === 'NotAllowedError' ? t('camDenied') : t('camFail'))
      }
    })()

    return () => {
      stopped = true
      abort.abort()
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((tr) => tr.stop())
    }
  }, [onResult, t])

  return (
    <div className="scanner">
      <video ref={videoRef} playsInline muted autoPlay />
      <div className="scanner-frame" />
      <div className="scanner-top">
        <strong>{t('scanTitle')}</strong>
        <button className="icon-btn" onClick={onClose} aria-label={t('close')}><X size={22} /></button>
      </div>
      <div className="scanner-msg">
        <div>{msg}</div>
        {nfcOn && <div className="nfc-badge"><Nfc size={18} /> {t('nfcHint')}</div>}
        {!nfcOn && isIOS() && <div className="nfc-note"><Nfc size={16} /> {t('nfcIos')}</div>}
      </div>
    </div>
  )
}

// Extrae el TAG de una URL de encuesta (…#/t/TAG) o devuelve '' para el QR genérico
export function parseSurveyQr(text) {
  const s = String(text || '').trim()
  try {
    const m = s.match(/#\/t\/([A-Za-z0-9_-]+)/)
    if (m) return { ok: true, tag: decodeURIComponent(m[1]).toUpperCase() }
    const u = new URL(s)
    if (u.hash === '' || u.hash === '#/' || u.hash === '#') return { ok: true, tag: '' }
  } catch { /* no es URL */ }
  if (/^[A-Za-z0-9_-]{2,32}$/.test(s)) return { ok: true, tag: s.toUpperCase() }
  return { ok: false }
}
