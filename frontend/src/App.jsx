import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import PaperManagement from './pages/PaperManagement'
import LeakUpload from './pages/LeakUpload'
import InvestigationResults from './pages/InvestigationResults'
import { ToastProvider } from './components/ui/Toast'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"          element={<Dashboard />}            />
            <Route path="papers"             element={<PaperManagement />}      />
            <Route path="upload"             element={<LeakUpload />}           />
            <Route path="results"            element={<InvestigationResults />} />
            <Route path="results/:uploadId"  element={<InvestigationResults />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
