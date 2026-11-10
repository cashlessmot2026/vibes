import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

let deferred = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export default function InstallButton({ className = 'btn btn-outline' }) {
  const [can, setCan] = useState(!!deferred)
  const [tip, setTip] = useState(false)

  useEffect(() => {
    const h = (e) => { e.preventDefault(); deferred = e; setCan(true) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  if (isStandalone() || (!can && !isIOS())) return null

  const install = async () => {
    if (deferred) {
      deferred.prompt()
      await deferred.userChoice
      deferred = null
      setCan(false)
    } else setTip(true)
  }

  return (
    <>
      <button className={className} onClick={install}><Download size={18} /> Instalar app</button>
      {tip && (
        <div className="toast" onClick={() => setTip(false)}>
          En iPhone: toca <b>Compartir</b> y luego <b>“Agregar a inicio”</b>.
        </div>
      )}
    </>
  )
}
