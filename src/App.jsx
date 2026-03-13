import { Routes, Route } from 'react-router-dom'
import RadarPage from './pages/RadarPage.jsx'
import CallbackPage from './pages/CallbackPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RadarPage />} />
      <Route path="/callback" element={<CallbackPage />} />
    </Routes>
  )
}
