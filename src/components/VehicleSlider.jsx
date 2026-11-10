import { useEffect, useState } from 'react'
import { VEHICLE_IMAGES } from '../config'

// Banner automático con las fotos de los vehículos (se muestra en todas las preguntas)
export default function VehicleSlider({ images = VEHICLE_IMAGES, interval = 3500, caption = 'San Andrés Vibes' }) {
  const [i, setI] = useState(() => Math.floor(Math.random() * images.length))
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images.length, interval])

  // Solo se montan la imagen actual, la anterior y la siguiente
  const visible = new Set([i, (i + 1) % images.length, (i - 1 + images.length) % images.length])
  const dots = 7
  const dotOn = Math.floor((i / images.length) * dots)

  return (
    <div className="slider" aria-hidden="true">
      {images.map((src, n) =>
        visible.has(n) ? <img key={src} src={src} alt="" className={n === i ? 'on' : ''} loading="lazy" /> : null
      )}
      <span className="slider-tag">{caption}</span>
      <div className="slider-dots">
        {Array.from({ length: dots }, (_, n) => <i key={n} className={n === dotOn ? 'on' : ''} />)}
      </div>
    </div>
  )
}
