import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Cell
} from 'recharts'
import { ClipboardList, Star, Smile, ThumbsUp, Download, RefreshCw, MessageSquare } from 'lucide-react'
import { PERIODS, GENERIC, summarize, timeSeries, distribution, perQuestion, ranking, toCSV } from './useData'
import { miniStars } from '../components/Stars'

const pct = (v) => (v === null || v === undefined ? '—' : Math.round(v * 100) + '%')
const num = (v) => (v === null || v === undefined ? '—' : v.toFixed(1))
const STAR_COLORS = ['#e5484d', '#ff7a45', '#ffb81c', '#3fd0c9', '#00a79d']

function Filters({ data, showWorker = true }) {
  return (
    <div className="filters">
      <div className="seg">
        {PERIODS.map((p) => (
          <button key={p.id} className={data.period === p.id ? 'on' : ''} onClick={() => data.setPeriod(p.id)}>{p.label}</button>
        ))}
      </div>
      {showWorker && (
        <select className="select" value={data.workerFilter} onChange={(e) => data.setWorkerFilter(e.target.value)}>
          <option value="">Todos los QR</option>
          <option value={GENERIC}>QR general</option>
          {data.workers.map((w) => <option key={w.id} value={w.id}>{w.name} · {w.tag}</option>)}
        </select>
      )}
      <button className="icon-btn" title="Actualizar" onClick={data.reload}><RefreshCw size={18} /></button>
    </div>
  )
}

function Head({ title, sub, data, showWorker, children }) {
  return (
    <div className="main-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      <div className="filters">{children}<Filters data={data} showWorker={showWorker} /></div>
    </div>
  )
}

function State({ data }) {
  if (data.error) return <div className="card err">Error: {data.error}</div>
  if (data.loading) return <div className="card empty"><div className="spinner" />Cargando datos…</div>
  return null
}

function Kpi({ icon: Icon, color, label, value, sub }) {
  return (
    <div className="card kpi">
      <div className="ic" style={{ background: color + '1f', color }}><Icon size={24} /></div>
      <div>
        <div className="lbl">{label}</div>
        <div className="val">{value}{sub && <small> {sub}</small>}</div>
      </div>
    </div>
  )
}

function Bars({ items, max, fmt = (v) => v }) {
  if (!items.length) return <div className="empty">Sin datos todavía</div>
  return items.map((it) => (
    <div className="bar-row" key={it.label}>
      <div className="name" title={it.label}>{it.label}</div>
      <div className="num">{fmt(it.value)}</div>
      <div className="bar"><i style={{ width: `${Math.max(2, (it.value / (max || 1)) * 100)}%` }} /></div>
    </div>
  ))
}

export function Overview({ data }) {
  const rows = data.filtered
  const days = PERIODS.find((p) => p.id === data.period)?.days
  const s = useMemo(() => summarize(rows), [rows])
  const series = useMemo(() => timeSeries(rows, days), [rows, days])
  const dist = useMemo(() => distribution(rows), [rows])
  const pq = useMemo(() => perQuestion(rows, data.questions), [rows, data.questions])
  const top = useMemo(() => ranking(data.responses, data.workers, data.workerName).filter((r) => r.total > 0).slice(0, 5), [data.responses, data.workers, data.workerName])

  return (
    <>
      <Head title="Resumen" sub="Satisfacción de los clientes de San Andrés Vibes" data={data} />
      <State data={data} />
      {!data.loading && !data.error && (
        <div className="grid">
          <div className="grid kpis">
            <Kpi icon={ClipboardList} color="#0a62ae" label="Total encuestas" value={s.total} />
            <Kpi icon={Star} color="#f2a100" label="Calificación promedio" value={num(s.avg)} sub="/ 5" />
            <Kpi icon={Smile} color="#00a79d" label="Satisfacción (4★ o más)" value={pct(s.satisfaction)} />
            <Kpi icon={ThumbsUp} color="#1fae5b" label="Recomendación" value={pct(s.recommend)} />
          </div>

          <div className="grid two">
            <div className="card">
              <h3>Evolución de la satisfacción <small>{!days || days > 45 ? 'por semana' : 'por día'}</small></h3>
              {series.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#eef3f7" vertical={false} />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#5f7385' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="l" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#5f7385' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" hide allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e3ebf2' }} />
                    <Bar yAxisId="r" dataKey="encuestas" fill="#cfeeed" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Line yAxisId="l" dataKey="promedio" stroke="#0a62ae" strokeWidth={3} dot={{ r: 3, fill: '#0a62ae' }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="empty">Aún no hay encuestas en este periodo</div>}
            </div>
            <div className="card">
              <h3>Niveles de satisfacción</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dist} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="#eef3f7" vertical={false} />
                  <XAxis dataKey="estrellas" tick={{ fontSize: 12, fill: '#5f7385' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5f7385' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f3f7fa' }} contentStyle={{ borderRadius: 12, border: '1px solid #e3ebf2' }} formatter={(v) => [v, 'Encuestas']} />
                  <Bar dataKey="n" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {dist.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid half">
            <div className="card">
              <h3>Calificación por aspecto</h3>
              <Bars items={pq.ratings.map((r) => ({ label: r.title, value: r.avg }))} max={5} fmt={(v) => v.toFixed(1)} />
            </div>
            <div className="card">
              <h3><TrophyMini /> Top QR mejor calificados</h3>
              <RankTable rows={top} compact />
            </div>
          </div>

          {pq.choices.length > 0 && (
            <div className="grid half">
              {pq.choices.map((c) => (
                <div className="card" key={c.id}>
                  <h3>{c.title} <small>{c.n} respuestas</small></h3>
                  <Bars items={c.options.map((o) => ({ label: o.label, value: o.count }))} max={c.n}
                    fmt={(v) => Math.round((v / c.n) * 100) + '%'} />
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3><MessageSquare size={17} /> Comentarios recientes</h3>
            <CommentList rows={rows.filter((r) => r.comment).slice(0, 5)} workerName={data.workerName} />
          </div>
        </div>
      )}
    </>
  )
}

const TrophyMini = () => <span aria-hidden="true">🏆</span>

function RankTable({ rows, compact }) {
  if (!rows.length) return <div className="empty">Sin calificaciones todavía</div>
  return (
    <table className="rank">
      <thead>
        <tr>
          <th>#</th><th>QR / Trabajador</th><th>Prom.</th><th>Encuestas</th>
          {!compact && <><th className="hide-m">Satisfacción</th><th className="hide-m">Recomienda</th></>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id}>
            <td><span className={`medal m${i + 1}`}>{i + 1}</span></td>
            <td>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <span className="tag">{r.tag}</span>{r.role && <span className="hint"> · {r.role}</span>}
            </td>
            <td>
              <b>{num(r.avg)}</b>
              {r.avg && <div className="mini-stars">{miniStars(r.avg)}</div>}
            </td>
            <td>{r.total}</td>
            {!compact && <><td className="hide-m">{pct(r.satisfaction)}</td><td className="hide-m">{pct(r.recommend)}</td></>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Ranking({ data }) {
  const rows = useMemo(() => ranking(data.responses, data.workers, data.workerName), [data.responses, data.workers, data.workerName])
  return (
    <>
      <Head title="Ranking de QR" sub="Trabajadores ordenados por calificación promedio" data={data} showWorker={false} />
      <State data={data} />
      {!data.loading && !data.error && <div className="card"><RankTable rows={rows} /></div>}
    </>
  )
}

function CommentList({ rows, workerName }) {
  if (!rows.length) return <div className="empty">No hay comentarios</div>
  return rows.map((r) => (
    <div className="comment" key={r.id}>
      <div className="meta">
        {r.score && <span className="mini-stars">{miniStars(r.score)}</span>}
        <b style={{ color: 'var(--ink)' }}>{workerName(r.worker_id)}</b>
        <span>{new Date(r.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        {r.recommend === true && <span className="pill ok">Recomienda</span>}
        {r.recommend === false && <span className="pill bad">No recomienda</span>}
      </div>
      {r.comment && <p>“{r.comment}”</p>}
    </div>
  ))
}

export function Comments({ data }) {
  const [onlyText, setOnlyText] = useState(true)
  const [minStars, setMinStars] = useState('')
  const rows = data.filtered.filter((r) =>
    (!onlyText || r.comment) &&
    (!minStars || (minStars === 'low' ? Number(r.score) < 3 : Number(r.score) >= Number(minStars)))
  )

  const exportCsv = () => {
    const blob = new Blob([toCSV(data.filtered, data.workerName)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `encuestas-san-andres-vibes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <Head title="Comentarios y respuestas" sub={`${rows.length} resultados`} data={data}>
        <select className="select" value={minStars} onChange={(e) => setMinStars(e.target.value)}>
          <option value="">Todas las notas</option>
          <option value="4">4★ o más</option>
          <option value="low">Menos de 3★</option>
        </select>
        <label className="check-row" style={{ margin: 0 }}>
          <input type="checkbox" checked={onlyText} onChange={(e) => setOnlyText(e.target.checked)} /> Solo con texto
        </label>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={16} /> Exportar CSV</button>
      </Head>
      <State data={data} />
      {!data.loading && !data.error && (
        <div className="card">
          {onlyText ? <CommentList rows={rows} workerName={data.workerName} /> : rows.length ? rows.map((r) => (
            <div className="comment" key={r.id}>
              <div className="meta">
                {r.score && <span className="mini-stars">{miniStars(r.score)}</span>}
                <b style={{ color: 'var(--ink)' }}>{data.workerName(r.worker_id)}</b>
                <span>{new Date(r.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                {(r.answers || []).map((a) => `${a.question_title}: ${
                  Array.isArray(a.value) ? a.value.join(', ') : typeof a.value === 'boolean' ? (a.value ? 'Sí' : 'No') : a.question_type === 'rating' ? a.value + '★' : a.value
                }`).join('\n')}
              </p>
            </div>
          )) : <div className="empty">Sin respuestas</div>}
        </div>
      )}
    </>
  )
}
