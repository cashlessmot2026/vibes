import { supabase } from './supabase'

const Q_CACHE = 'sav-questions-v1'
const QUEUE = 'sav-pending-v1'

const read = (k, d) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d }
}
const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage lleno o bloqueado */ }
}

export async function loadQuestions() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, position, type, title, subtitle, options, required')
      .eq('active', true)
      .order('position', { ascending: true })
    if (error) throw error
    write(Q_CACHE, data)
    return { questions: data, offline: false }
  } catch (e) {
    const cached = read(Q_CACHE, null)
    if (cached?.length) return { questions: cached, offline: true }
    throw e
  }
}

export async function getWorker(tag) {
  if (!tag) return null
  const key = 'sav-worker-' + tag.toUpperCase()
  try {
    const { data, error } = await supabase.rpc('get_worker_public', { p_tag: tag })
    if (error) throw error
    const w = data?.[0] || null
    write(key, w)
    return w
  } catch {
    return read(key, null)
  }
}

async function send(item) {
  const { error } = await supabase.rpc('submit_response', { p_tag: item.tag || null, p_answers: item.answers })
  if (error) throw error
}

// Envía la encuesta; si no hay internet queda en cola y se reenvía después.
export async function submitSurvey(tag, answers) {
  const item = { tag, answers, at: Date.now() }
  try {
    await send(item)
    return { queued: false }
  } catch (e) {
    const offline = !navigator.onLine || /fetch|network/i.test(String(e?.message))
    if (!offline) throw e
    write(QUEUE, [...read(QUEUE, []), item])
    return { queued: true }
  }
}

let flushing = false
export async function flushQueue() {
  if (flushing || !navigator.onLine) return
  const items = read(QUEUE, [])
  if (!items.length) return
  flushing = true
  const left = []
  for (const it of items) {
    try { await send(it) } catch { left.push(it) }
  }
  write(QUEUE, left)
  flushing = false
}

export function startQueueSync() {
  flushQueue()
  window.addEventListener('online', flushQueue)
  setInterval(flushQueue, 60_000)
}
