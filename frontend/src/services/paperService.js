/**
 * paperService.js — Member 1 (Paper Generation & Fingerprinting)
 *
 * VITE_USE_MOCK_PAPERS=false → makes real HTTP calls to FastAPI backend
 * VITE_USE_MOCK_PAPERS=true  → uses local mock data (fallback / testing)
 *
 * All endpoints are from backend/app/routes/paper_routes.py
 * Router prefix: /api/papers  (set in paper_routes.py line 32)
 * Health:        /api/health  (set in main.py)
 */
import apiClient from './api'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_PAPERS === 'true'

// ── Health check (no APIResponse envelope) ─────────────────────────────────
export async function getHealth() {
  return apiClient.get('/api/health')
}

// ── GET /api/papers/examinations ───────────────────────────────────────────
export async function getExaminations() {
  if (USE_MOCK) {
    await delay(300)
    return []
  }
  return apiClient.get('/api/papers/examinations')
}

// ── GET /api/papers/centres ────────────────────────────────────────────────
export async function getCentres() {
  if (USE_MOCK) {
    await delay(300)
    return []
  }
  return apiClient.get('/api/papers/centres')
}

// ── GET /api/papers/questions ──────────────────────────────────────────────
export async function getQuestions(params = {}) {
  if (USE_MOCK) {
    await delay(300)
    return []
  }
  return apiClient.get('/api/papers/questions', { params })
}

// ── GET /api/papers/versions ───────────────────────────────────────────────
export async function getPaperVersions(examinationId) {
  if (USE_MOCK) {
    await delay(300)
    return []
  }
  const params = examinationId ? { examination_id: examinationId } : {}
  return apiClient.get('/api/papers/versions', { params })
}

// ── GET /api/papers/versions/{version_id} ─────────────────────────────────
export async function getPaperVersion(versionId) {
  if (USE_MOCK) {
    await delay(300)
    return null
  }
  return apiClient.get(`/api/papers/versions/${versionId}`)
}

// ── GET /api/papers/fingerprints ──────────────────────────────────────────
export async function getFingerprints(examinationId) {
  if (USE_MOCK) {
    await delay(300)
    return []
  }
  const params = examinationId ? { examination_id: examinationId } : {}
  return apiClient.get('/api/papers/fingerprints', { params })
}

// ── Helper ─────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
