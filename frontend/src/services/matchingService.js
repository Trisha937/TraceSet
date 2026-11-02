/**
 * matchingService.js — Member 3 (AI Matching & Source Identification)
 *
 * VITE_USE_MOCK_MATCHING=true → uses mockData (Member 3 not yet implemented)
 * VITE_USE_MOCK_MATCHING=false → will make real API calls when Member 3 delivers
 *
 * Replace this file with real API calls once Member 3 integrates.
 * Expected endpoint: POST /api/matching/analyse  { upload_id: string }
 * Expected response: MatchingAnalysisResult (see backend/app/schemas/shared.py)
 */
import { mockAnalysisResults } from './mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_MATCHING !== 'false'

// ── Local session store (mock phase only) ─────────────────────────────────
let _results = { ...mockAnalysisResults }

export const matchingService = {
  // Run forensic analysis for a given upload
  async runAnalysis(uploadId) {
    if (USE_MOCK) {
      await delay(1_800) // simulate AI processing time

      // Return pre-defined result if exists, or generate a generic one
      if (_results[uploadId]) {
        return _results[uploadId]
      }

      // Generic fallback for newly uploaded mocks
      const fallback = {
        id:       `analysis-mock-${Date.now()}`,
        upload_id: uploadId,
        status:   'insufficient_evidence',
        top_candidate_version_id: null,
        top_candidate_centre_id:  null,
        top_similarity_score:     null,
        total_matched_questions:  0,
        explanation:
          'Insufficient evidence — this upload was recently added and has limited extracted questions. ' +
          'Please try uploading a clearer scan with more visible questions.',
        warnings: ['Newly uploaded file — limited extracted questions available'],
        ranked_candidates: [],
      }
      _results[uploadId] = fallback
      return fallback
    }
    // TODO: return apiClient.post('/api/matching/analyse', { upload_id: uploadId })
  },

  // Get existing analysis result for an upload
  async getAnalysisResult(uploadId) {
    if (USE_MOCK) {
      await delay(200)
      return _results[uploadId] || null
    }
    // TODO: return apiClient.get(`/api/matching/results/${uploadId}`)
  },
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))
