import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// Lector QR con la cámara trasera del teléfono
export default function Scanner({ onResult, onClose }) {
  const videoRef = useRef(null)
  const [msg, setMsg] = useState('Apunta la cámara al código QR de tu guía')

  useEffect(() => {
    let stream, raf, stopped = false
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
            const codes = await detector.detect(v)
            text = codes[0]?.rawValue
          } else {
            const w = 480, h = Math.round((v.videoHeight / v.videoWidth) * 480) || 480
            canvas.width = w; canvas.height = h
            ctx.drawImage(v, 0, 0, w, h)
            const img = ctx.getImageData(0, 0, w, h)
            text = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' })?.data
          }
          if (text) { stopped = true; navigator.vibrate?.(60); onResult(text); return }
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
        if (stopped) return stream.getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        await jsQRReady
        tick()
      } catch (e) {
        setMsg(e?.name === 'NotAllowedError'
          ? 'Permite el acceso a la cámara para escanear el código.'
          : 'No se pudo abrir la cámara. Usa la cámara de tu teléfono para escanear el QR.')
      }
    })()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onResult])

  return (
    <div className="scanner">
      <video ref={videoRef} playsInline muted />
      <div className="scanner-frame" />
      <div className="scanner-top">
        <strong>Escanear QR</strong>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={22} /></button>
      </div>
      <div className="scanner-msg">{msg}</div>
    </div>
  )
}

// Extrae el TAG de una URL de encuesta (…#/t/TAG) o devuelve '' para el QR genérico
export function parseSurveyQr(text) {
  try {
    const m = String(text).match(/#\/t\/([A-Za-z0-9_-]+)/)
    if (m) return { ok: true, tag: decodeURIComponent(m[1]).toUpperCase() }
    const u = new URL(text)
    if (u.hash === '' || u.hash === '#/' || u.hash === '#') return { ok: true, tag: '' }
  } catch { /* no es URL */ }
  if (/^[A-Za-z0-9_-]{2,32}$/.test(text)) return { ok: true, tag: text.toUpperCase() }
  return { ok: false }
}
