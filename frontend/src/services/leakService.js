/**
 * leakService.js — Member 2 (OCR / Leak Upload)
 *
 * VITE_USE_MOCK_OCR=true → uses mockData (Member 2 not yet implemented)
 * VITE_USE_MOCK_OCR=false → will make real API calls when Member 2 delivers
 *
 * Manages local session state for uploads during the mock phase.
 * Replace this entire file with real API calls once Member 2 integrates.
 */
import { mockLeakUploads, mockExtractedQuestions } from './mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_OCR !== 'false'

// ── Local session store (mock phase only) ─────────────────────────────────
let _uploads = [...mockLeakUploads]
let _questions = { ...mockExtractedQuestions }

export const leakService = {
  // List all uploads
  async getLeakUploads() {
    if (USE_MOCK) {
      await delay(250)
      return [..._uploads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    // TODO: return apiClient.get('/api/ocr/uploads')
  },

  // Get single upload with its extracted questions
  async getLeakUpload(id) {
    if (USE_MOCK) {
      await delay(200)
      const upload = _uploads.find(u => u.id === id)
      return upload ? { ...upload, extracted_questions: _questions[id] || [] } : null
    }
    // TODO: return apiClient.get(`/api/ocr/uploads/${id}`)
  },

  // Upload a new file (mock: simulates processing pipeline)
  async uploadLeak(file) {
    if (USE_MOCK) {
      await delay(600) // simulate network upload

      const newUpload = {
        id:                  `upload-mock-${Date.now()}`,
        filename:            file.name,
        file_path:           `/uploads/${file.name}`,
        file_type:           file.type,
        file_size_bytes:     file.size,
        status:              'PENDING',
        total_pages:         1,
        processing_warnings: [],
        created_at:          new Date().toISOString(),
      }

      _uploads = [newUpload, ..._uploads]

      // Simulate async OCR processing: PENDING → PROCESSING → EXTRACTED
      setTimeout(() => {
        _uploads = _uploads.map(u =>
          u.id === newUpload.id ? { ...u, status: 'PROCESSING' } : u
        )
      }, 1_200)

      setTimeout(() => {
        _uploads = _uploads.map(u =>
          u.id === newUpload.id ? { ...u, status: 'EXTRACTED' } : u
        )
        _questions[newUpload.id] = [
          {
            id: `eq-mock-${Date.now()}`,
            upload_id: newUpload.id,
            detected_question_number: 1, detected_order: 1,
            extracted_text: 'Mock extracted question from uploaded file',
            cleaned_text:   'Mock extracted question from uploaded file',
            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
            detected_option_order: ['A','B','C','D'],
            page_number: 1, extraction_quality: 'HIGH', is_partial: 'NO', warnings: [],
          },
        ]
      }, 4_000)

      return newUpload
    }
    // TODO: real multipart upload
    // const form = new FormData(); form.append('file', file)
    // return apiClient.post('/api/ocr/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // Delete an upload
  async deleteLeakUpload(id) {
    if (USE_MOCK) {
      await delay(200)
      _uploads = _uploads.filter(u => u.id !== id)
      delete _questions[id]
      return { success: true }
    }
    // TODO: return apiClient.delete(`/api/ocr/uploads/${id}`)
  },
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))
