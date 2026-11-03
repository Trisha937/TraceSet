/**
 * matchingService.js
 * Real backend integration for TraceSet forensic matching.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://traceset.onrender.com'
).replace(/\/$/, '')

async function apiRequest(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, options)

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof body === 'object'
        ? body.detail || body.message
        : body

    throw new Error(message || `API error: ${response.status}`)
  }

  return body
}

function unwrapData(response) {
  return response?.data ?? response
}

export const matchingService = {
  async runAnalysis(uploadId) {
    // 1. Fetch extracted questions and upload detail
    const [upload, uploadDetail] = await Promise.all([
      apiRequest(`/api/leaks/${encodeURIComponent(uploadId)}/questions`),
      apiRequest(`/api/leaks/${encodeURIComponent(uploadId)}`).catch(() => null),
    ])

    const extractedQuestions = unwrapData(upload)
    const filename = uploadDetail?.filename || ''

    if (!Array.isArray(extractedQuestions) || extractedQuestions.length === 0) {
      throw new Error('No extracted questions found for this upload.')
    }

    // 2. Fetch official paper fingerprints.
    const fingerprintResponse = await apiRequest(
      '/api/papers/fingerprints'
    )

    const fingerprints = unwrapData(fingerprintResponse)

    if (!Array.isArray(fingerprints) || fingerprints.length === 0) {
      throw new Error(
        'No official paper fingerprints found. Generate official paper versions first.'
      )
    }

    // 3. Convert OCR questions to the matching engine format.
    const leakedQuestions = extractedQuestions.map(question => ({
      question_text:
        question.cleaned_text ||
        question.extracted_text ||
        question.question_text ||
        '',
      options: question.options || {},
    })).filter(question => question.question_text.trim())

    // 4. Convert stored fingerprints to the matching engine format.
    const officialPaperVersions = fingerprints.map(version => ({
      paper_version_id: version.paper_version_id || version.id,
      centre_id: version.centre_id,
      questions: (version.fingerprints || []).map(fingerprint => ({
        question_text: fingerprint.variant_text || '',
        options: fingerprint.rendered_options || {},
      })),
    }))

    if (leakedQuestions.length === 0) {
      throw new Error('No usable question text was extracted.')
    }

    if (!officialPaperVersions.some(version => version.questions.length > 0)) {
      throw new Error('Official fingerprints contain no questions to compare.')
    }

    // 5. Call the actual backend matching engine.
    const result = await apiRequest('/matching/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leaked_questions: leakedQuestions,
        official_paper_versions: officialPaperVersions,
        upload_id: uploadId,
        filename: filename,
      }),
    })

    const matchingResult = unwrapData(result)

    const candidates = matchingResult.ranked_candidates || []
    const topCandidate = candidates[0] || null

    // 6. Adapt backend response to the existing frontend UI.
    return {
      id: `analysis-${uploadId}`,
      upload_id: uploadId,
      status: matchingResult.status,
      top_candidate_version_id: topCandidate?.paper_version_id || null,
      top_candidate_centre_id: topCandidate?.centre_id || null,
      top_similarity_score: topCandidate?.similarity_score ?? null,
      total_matched_questions: topCandidate?.matched_questions ?? 0,
      explanation: matchingResult.explanation || '',
      warnings: matchingResult.warnings || [],
      ranked_candidates: candidates,
    }
  },

  // The backend currently has no endpoint for retrieving saved analyses.
  async getAnalysisResult() {
    return null
  },
}
