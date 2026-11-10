import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Survey from './pages/Survey'
import Thanks from './pages/Thanks'
import { ADMIN_PATH } from './config'

const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/' + ADMIN_PATH)
  useEffect(() => {
    document.body.classList.toggle('public', !isAdmin)
    if (!isAdmin) document.title = 'San Andrés Vibes · Encuesta'
  }, [isAdmin])

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/t/:tag" element={<Welcome />} />
      <Route path="/encuesta" element={<Survey />} />
      <Route path="/gracias" element={<Thanks />} />
      <Route
        path={`/${ADMIN_PATH}/*`}
        element={
          <Suspense fallback={<div className="center-msg"><div><div className="spinner" />Cargando panel…</div></div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
