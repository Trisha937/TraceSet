/**
 * mockData.js — Isolated mock data for Member 2 (OCR) and Member 3 (Matching).
 *
 * ALL shapes match the backend Pydantic schemas in:
 *   backend/app/schemas/shared.py   (OCR + Matching contracts)
 *   backend/app/models/leak.py      (LeakUpload, ExtractedQuestion)
 *   backend/app/models/analysis.py  (AnalysisResult, MatchingEvidence)
 *
 * Sample data uses real identifiers from:
 *   sample_data/sample_centres.json      (CENTRE_A/B/C)
 *   sample_data/sample_examination.json  (EXAM-2026-CS101)
 *
 * To replace with real API data: delete usage of these constants from
 * leakService.js and matchingService.js, and make real HTTP calls.
 */

// ── Shared UUIDs (aligned with seeded DB values) ───────────────────────────
export const MOCK_EXAM_ID    = 'exam-2026-cs101-0000-000000000001'
export const MOCK_CENTRE_A   = 'centre-a-0000-0000-0000-000000000001'
export const MOCK_CENTRE_B   = 'centre-b-0000-0000-0000-000000000002'
export const MOCK_CENTRE_C   = 'centre-c-0000-0000-0000-000000000003'
export const MOCK_VERSION_A  = 'version-set-a-0000-0000-000000000001'
export const MOCK_VERSION_B  = 'version-set-b-0000-0000-000000000002'
export const MOCK_VERSION_C  = 'version-set-c-0000-0000-000000000003'

// ── Mock Leak Uploads (Member 2 schema: LeakUpload) ───────────────────────
export const mockLeakUploads = [
  {
    id:                  'upload-0000-0000-0000-000000000001',
    filename:            'leaked_paper_photo_delhi.jpg',
    file_path:           '/uploads/leaked_paper_photo_delhi.jpg',
    file_type:           'image/jpeg',
    file_size_bytes:     2_048_000,
    status:              'EXTRACTED',
    total_pages:         1,
    processing_warnings: [],
    created_at:          '2026-10-31T14:30:00',
  },
  {
    id:                  'upload-0000-0000-0000-000000000002',
    filename:            'exam_scan_partial.pdf',
    file_path:           '/uploads/exam_scan_partial.pdf',
    file_type:           'application/pdf',
    file_size_bytes:     512_000,
    status:              'EXTRACTED',
    total_pages:         3,
    processing_warnings: ['Page 3 OCR quality low — some questions may be incomplete'],
    created_at:          '2026-10-30T09:15:00',
  },
  {
    id:                  'upload-0000-0000-0000-000000000003',
    filename:            'whatsapp_screenshot.png',
    file_path:           '/uploads/whatsapp_screenshot.png',
    file_type:           'image/png',
    file_size_bytes:     384_000,
    status:              'FAILED',
    total_pages:         1,
    processing_warnings: ['Image quality too degraded for reliable OCR'],
    created_at:          '2026-10-29T17:45:00',
  },
]

// ── Mock Extracted Questions (Member 2 schema: ExtractedQuestion) ──────────
export const mockExtractedQuestions = {
  'upload-0000-0000-0000-000000000001': [
    {
      id: 'eq-0001', upload_id: 'upload-0000-0000-0000-000000000001',
      detected_question_number: 1, detected_order: 1,
      extracted_text: 'Which algorithm is used to find the shortest path in a weighted graph?',
      cleaned_text:   'Which algorithm is used to find the shortest path in a weighted graph?',
      options: { A: "Dijkstra's Algorithm", B: 'Breadth-First Search', C: 'Depth-First Search', D: 'Prim\'s Algorithm' },
      detected_option_order: ['A','B','C','D'],
      page_number: 1, extraction_quality: 'HIGH', is_partial: 'NO', warnings: [],
    },
    {
      id: 'eq-0002', upload_id: 'upload-0000-0000-0000-000000000001',
      detected_question_number: 2, detected_order: 2,
      extracted_text: 'In machine learning, what technique reduces overfitting by adding penalty terms?',
      cleaned_text:   'In machine learning, what technique reduces overfitting by adding penalty terms?',
      options: { A: 'Regularization', B: 'Normalisation', C: 'Augmentation', D: 'Pruning' },
      detected_option_order: ['A','B','C','D'],
      page_number: 1, extraction_quality: 'HIGH', is_partial: 'NO', warnings: [],
    },
    {
      id: 'eq-0003', upload_id: 'upload-0000-0000-0000-000000000001',
      detected_question_number: 3, detected_order: 3,
      extracted_text: 'What does the kernel function do in Support Vector Machines?',
      cleaned_text:   'What does the kernel function do in Support Vector Machines?',
      options: { A: 'Maps data to higher-dimensional space', B: 'Reduces feature count', C: 'Normalises input vectors', D: 'Applies dropout' },
      detected_option_order: ['A','B','C','D'],
      page_number: 1, extraction_quality: 'MEDIUM', is_partial: 'NO',
      warnings: ['Minor image blur detected around options B and C'],
    },
  ],
  'upload-0000-0000-0000-000000000002': [
    {
      id: 'eq-0010', upload_id: 'upload-0000-0000-0000-000000000002',
      detected_question_number: 1, detected_order: 1,
      extracted_text: 'What is the time complexity of QuickSort in the average case?',
      cleaned_text:   'What is the time complexity of QuickSort in the average case?',
      options: { A: 'O(n log n)', B: 'O(n²)', C: 'O(n)', D: 'O(log n)' },
      detected_option_order: ['A','B','C','D'],
      page_number: 1, extraction_quality: 'HIGH', is_partial: 'NO', warnings: [],
    },
  ],
}

// ── Mock Analysis Results (Member 3 schema: MatchingAnalysisResult) ────────
export const mockAnalysisResults = {
  'upload-0000-0000-0000-000000000001': {
    id:     'analysis-0000-0000-0000-000000000001',
    upload_id: 'upload-0000-0000-0000-000000000001',
    status: 'possible_match',
    top_candidate_version_id:  MOCK_VERSION_A,
    top_candidate_centre_id:   MOCK_CENTRE_A,
    top_similarity_score:      87.5,
    total_matched_questions:   7,
    explanation:
      'Strong forensic evidence points to SET_A distributed to North Zone Examination Centre — Delhi. ' +
      'Option ordering on 3 questions exactly matches the SET_A permutation pattern. ' +
      '7 of 10 questions show high word-level overlap. Question sequence alignment score: 0.75.',
    warnings: [],
    ranked_candidates: [
      {
        paper_version_id: MOCK_VERSION_A,
        centre_id:        MOCK_CENTRE_A,
        centre_code:      'CENTRE_A',
        centre_name:      'North Zone Examination Centre - Delhi',
        similarity_score: 87.5,
        matched_questions: 7,
        evidence: [
          'Option order exactly matches SET_A permutation on Q1, Q2, Q4',
          '7/10 questions pass text similarity threshold (≥ 0.85)',
          'Question sequence alignment: 75%',
          'Semantic similarity (embedding cosine): 0.88',
        ],
        detailed_evidence: [
          { feature_type: 'text_similarity',   score: 0.92, description: 'High word-level overlap on 7 questions' },
          { feature_type: 'option_order',       score: 1.00, description: 'Exact option permutation matches SET_A on Q1, Q2, Q4' },
          { feature_type: 'question_order',     score: 0.75, description: 'Question sequence 75% aligned with SET_A ordering' },
          { feature_type: 'semantic_similarity',score: 0.88, description: 'Sentence embeddings strongly aligned with SET_A variants' },
        ],
      },
      {
        paper_version_id: MOCK_VERSION_B,
        centre_id:        MOCK_CENTRE_B,
        centre_code:      'CENTRE_B',
        centre_name:      'West Zone Examination Centre - Mumbai',
        similarity_score: 34.2,
        matched_questions: 3,
        evidence: [
          '3/10 questions text-matched (shared across all versions)',
          'Option order does NOT match SET_B pattern',
          'Question sequence alignment: 20%',
        ],
        detailed_evidence: [
          { feature_type: 'text_similarity',   score: 0.42, description: '3 questions matched but are shared across all versions' },
          { feature_type: 'option_order',       score: 0.10, description: 'Option permutations do not align with SET_B' },
          { feature_type: 'question_order',     score: 0.20, description: 'Question sequence not aligned' },
          { feature_type: 'semantic_similarity',score: 0.45, description: 'Moderate semantic overlap; likely shared questions' },
        ],
      },
      {
        paper_version_id: MOCK_VERSION_C,
        centre_id:        MOCK_CENTRE_C,
        centre_code:      'CENTRE_C',
        centre_name:      'South Zone Examination Centre - Bengaluru',
        similarity_score: 29.1,
        matched_questions: 2,
        evidence: [
          '2/10 questions matched (common knowledge questions)',
          'No option order alignment with SET_C',
          'Question sequence alignment: 10%',
        ],
        detailed_evidence: [
          { feature_type: 'text_similarity',   score: 0.35, description: 'Only common-knowledge questions matched' },
          { feature_type: 'option_order',       score: 0.05, description: 'Option order strongly mismatched with SET_C' },
          { feature_type: 'question_order',     score: 0.10, description: 'No meaningful sequence alignment' },
          { feature_type: 'semantic_similarity',score: 0.38, description: 'Low semantic similarity overall' },
        ],
      },
    ],
  },
  'upload-0000-0000-0000-000000000002': {
    id:     'analysis-0000-0000-0000-000000000002',
    upload_id: 'upload-0000-0000-0000-000000000002',
    status: 'insufficient_evidence',
    top_candidate_version_id:  null,
    top_candidate_centre_id:   null,
    top_similarity_score:      null,
    total_matched_questions:   1,
    explanation:
      'Insufficient evidence to reliably identify the source. ' +
      'Only 1 question was extracted from this upload, and it is identical across all paper versions. ' +
      'TraceSet requires at least 3 distinguishable questions to make a reliable attribution.',
    warnings: [
      'Only 1 question extracted — minimum 3 required for attribution',
      'Extracted question is shared across all paper versions (non-distinguishing)',
    ],
    ranked_candidates: [],
  },
}
