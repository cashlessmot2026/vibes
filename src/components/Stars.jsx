export const RATING_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']
export const RATING_EMOJI = ['', '😞', '😕', '🙂', '😀', '😎']

function Star({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"
        fill={filled ? '#FFB81C' : '#DCE4EC'}
        stroke={filled ? '#F2A100' : '#C9D5E0'}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Stars({ value, onChange }) {
  return (
    <div>
      <div className="rating-emoji">{RATING_EMOJI[value] || ''}</div>
      <div className="stars" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="star-btn"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} de 5`}
            onClick={() => onChange(n)}
          >
            <Star filled={n <= (value || 0)} />
          </button>
        ))}
      </div>
      <div className="rating-label">{RATING_LABELS[value] || 'Toca una estrella'}</div>
    </div>
  )
}

export const miniStars = (v) => {
  const r = Math.round(Number(v) || 0)
  return '★'.repeat(r) + '☆'.repeat(5 - r)
}
