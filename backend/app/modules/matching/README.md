# Member 3: AI Matching & Source Identification

**Owner:** Member 3  
**Location:** `backend/app/modules/matching/`

## Role & Responsibilities
- Core intelligence module: compares OCR-extracted questions against official digital fingerprints created by Member 1.
- Fetch reference fingerprints via:
  ```python
  from backend.app.modules.paper_generation.service import get_reference_fingerprints_for_matching
  # or API GET /api/papers/fingerprints
  ```
- Multi-dimensional matching:
  - Exact & fuzzy text matching
  - Semantic similarity (Sentence Transformers / cosine similarity)
  - Option-order agreement matching
  - Question-order arrangement matching
  - Combined scoring and abstention mechanism (handling uncertainty & identical questions)
- Save results in shared PostgreSQL tables: `analysis_results` and `matching_evidence`.

