import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export const PERIODS = [
  { id: '7', label: '7 días', days: 7 },
  { id: '30', label: '30 días', days: 30 },
  { id: '90', label: '90 días', days: 90 },
  { id: 'all', label: 'Todo', days: null }
]
export const GENERIC = '__generic__'

const SELECT = 'id, created_at, score, recommend, comment, tag, worker_id, answers(question_id, question_title, question_type, value)'

async function fetchAll(since) {
  const rows = []
  const page = 1000
  for (let from = 0; from < 20000; from += page) {
    let q = supabase.from('responses').select(SELECT).order('created_at', { ascending: false }).range(from, from + page - 1)
    if (since) q = q.gte('created_at', since)
    const { data, error } = await q
    if (error) throw error
    rows.push(...data)
    if (data.length < page) break
  }
  return rows
}

export function useAdminData() {
  const [period, setPeriod] = useState('30')
  const [workerFilter, setWorkerFilter] = useState('')
  const [responses, setResponses] = useState([])
  const [workers, setWorkers] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const days = PERIODS.find((p) => p.id === period)?.days
    const since = days ? new Date(Date.now() - days * 864e5).toISOString() : null
    Promise.all([
      fetchAll(since),
      supabase.from('workers').select('*').order('name'),
      supabase.from('questions').select('*').order('position')
    ])
      .then(([r, w, q]) => {
        if (!alive) return
        if (w.error) throw w.error
        if (q.error) throw q.error
        setResponses(r); setWorkers(w.data); setQuestions(q.data); setError('')
      })
      .catch((e) => alive && setError(e.message || 'Error cargando datos'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [period, tick])

  // Actualiza solo cada minuto para ver encuestas nuevas
  useEffect(() => {
    const t = setInterval(reload, 60_000)
    return () => clearInterval(t)
  }, [reload])

  const filtered = useMemo(() => {
    if (!workerFilter) return responses
    if (workerFilter === GENERIC) return responses.filter((r) => !r.worker_id)
    return responses.filter((r) => r.worker_id === workerFilter)
  }, [responses, workerFilter])

  const workerName = useCallback(
    (id) => (id ? workers.find((w) => w.id === id)?.name || 'Trabajador eliminado' : 'QR general'),
    [workers]
  )

  return {
    period, setPeriod, workerFilter, setWorkerFilter,
    responses, filtered, workers, questions, loading, error, reload, workerName
  }
}

// ---------- Cálculos ----------
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)

export function summarize(rows) {
  const scores = rows.map((r) => Number(r.score)).filter((n) => n > 0)
  const rec = rows.filter((r) => r.recommend !== null && r.recommend !== undefined)
  return {
    total: rows.length,
    avg: mean(scores),
    satisfaction: scores.length ? scores.filter((s) => s >= 4).length / scores.length : null,
    recommend: rec.length ? rec.filter((r) => r.recommend).length / rec.length : null
  }
}

export function timeSeries(rows, days) {
  const byWeek = !days || days > 45
  const key = (d) => {
    const x = new Date(d)
    if (byWeek) {
      const day = (x.getDay() + 6) % 7
      x.setDate(x.getDate() - day)
    }
    return x.toISOString().slice(0, 10)
  }
  const map = new Map()
  for (const r of rows) {
    const k = key(r.created_at)
    const e = map.get(k) || { k, n: 0, s: [] }
    e.n++
    if (r.score) e.s.push(Number(r.score))
    map.set(k, e)
  }
  return [...map.values()]
    .sort((a, b) => a.k.localeCompare(b.k))
    .map((e) => ({
      fecha: new Date(e.k + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
      encuestas: e.n,
      promedio: e.s.length ? +mean(e.s).toFixed(2) : null
    }))
}

export function distribution(rows) {
  const d = [0, 0, 0, 0, 0]
  for (const r of rows) {
    const s = Math.round(Number(r.score))
    if (s >= 1 && s <= 5) d[s - 1]++
  }
  return d.map((n, i) => ({ estrellas: `${i + 1}★`, n }))
}

export function perQuestion(rows, questions) {
  const ratings = new Map()
  const choices = new Map()
  for (const r of rows) {
    for (const a of r.answers || []) {
      const id = a.question_id || a.question_title
      if (a.question_type === 'rating' && typeof a.value === 'number') {
        const e = ratings.get(id) || { title: a.question_title, vals: [] }
        e.vals.push(a.value)
        ratings.set(id, e)
      } else if (a.question_type === 'single' || a.question_type === 'multiple') {
        const e = choices.get(id) || { title: a.question_title, counts: {}, n: 0 }
        e.n++
        for (const v of [].concat(a.value)) e.counts[v] = (e.counts[v] || 0) + 1
        choices.set(id, e)
      }
    }
  }
  const title = (id, fallback) => questions.find((q) => q.id === id)?.title || fallback
  return {
    ratings: [...ratings.entries()].map(([id, e]) => ({ id, title: title(id, e.title), avg: mean(e.vals), n: e.vals.length })),
    choices: [...choices.entries()].map(([id, e]) => ({
      id, title: title(id, e.title), n: e.n,
      options: Object.entries(e.counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))
    }))
  }
}

export function ranking(rows, workers, workerName) {
  const map = new Map()
  for (const r of rows) {
    const k = r.worker_id || GENERIC
    const e = map.get(k) || []
    e.push(r)
    map.set(k, e)
  }
  // Incluye trabajadores activos sin encuestas
  for (const w of workers) if (w.active && !map.has(w.id)) map.set(w.id, [])
  return [...map.entries()]
    .map(([k, list]) => {
      const s = summarize(list)
      const w = workers.find((x) => x.id === k)
      return { id: k, name: k === GENERIC ? 'QR general' : workerName(k), tag: w?.tag || (k === GENERIC ? 'GENERAL' : '—'), role: w?.role, ...s }
    })
    .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1) || b.total - a.total)
}

export function toCSV(rows, workerName) {
  const qTitles = []
  for (const r of rows) for (const a of r.answers || []) if (!qTitles.includes(a.question_title)) qTitles.push(a.question_title)
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : Array.isArray(v) ? v.join(' | ') : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v)
    return '"' + s.replace(/"/g, '""') + '"'
  }
  const head = ['Fecha', 'Trabajador', 'TAG', 'Promedio', 'Recomienda', ...qTitles]
  const lines = rows.map((r) => {
    const byTitle = Object.fromEntries((r.answers || []).map((a) => [a.question_title, a.value]))
    return [
      new Date(r.created_at).toLocaleString('es-CO'), workerName(r.worker_id), r.tag || 'GENERAL',
      r.score ?? '', r.recommend, ...qTitles.map((t) => byTitle[t])
    ].map(esc).join(',')
  })
  return '﻿' + [head.map(esc).join(','), ...lines].join('\r\n')
}
