/**
 * api.js — Axios base client for TraceSet backend
 */
import axios from 'axios'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://traceset.onrender.com').replace(/\/$/, '')

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
})

// Response interceptor: unwrap APIResponse envelope
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data
    }
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
