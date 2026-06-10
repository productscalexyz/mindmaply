import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Editor from './pages/Editor'
import Embed from './pages/Embed'
import Docs from './pages/Docs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/embed" element={<Embed />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
