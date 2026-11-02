/**
 * api.js — Axios base client for TraceSet backend (port 8000)
 *
 * Response interceptor unwraps the shared APIResponse<T> envelope:
 *   { success: true, message: "...", data: T }
 *   → returns T directly to callers
 *
 * The /api/health endpoint does NOT use this envelope, so the
 * interceptor falls back to returning response.data as-is.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// ── Response interceptor: unwrap APIResponse envelope ──────────────────────
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    // If backend returned the standard { success, data } envelope, unwrap it
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data
    }
    // Otherwise (e.g. /api/health) return as-is
    return body
  },
  (error) => {
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Unexpected error'
    const status = error.response?.status || 0
    return Promise.reject({ message: detail, status })
  }
)

export default apiClient
