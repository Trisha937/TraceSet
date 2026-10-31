# TraceSet – AI-Powered Examination Paper Leak Detection and Source Identification

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B%20%2F%2018-blue.svg)](https://www.postgresql.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg)](https://www.sqlalchemy.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()

**TraceSet** is an automated forensic examination security and source attribution platform. When an examination paper leaks (via camera snaps, social media leaks, scans, or text clippings), TraceSet analyzes the leaked material, matches it against question-level digital fingerprints embedded across exam versions, and identifies the most probable source examination centre with explainable forensic evidence.

---

## 1. The Core Problem & TraceSet Solution

### The Challenge of Traditional Exam Security
- **Single File Hashes Fail on Real-World Leaks**: Traditional digital watermarks or full-file SHA-256 hashes become useless once a question paper is photographed, cropped, photocopied, or retyped into a messaging app.
- **Academic Fairness**: Examination versions distributed to different centres must test identical syllabi, possess equivalent difficulty, and maintain exact total marks.

### How TraceSet Solves It
1. **Academic Parity with Controlled Variation**: Pre-generates multiple versions (Set A, Set B, Set C) from an approved question bank. All sets maintain identical total marks and difficulty distributions while incorporating controlled, subtle variations (option shuffling, question order permutations, and predefined academically equivalent question phrasing).
2. **Centre Mapping**: Each paper set is assigned to a designated examination centre.
3. **Structured Digital Fingerprints**: Rather than hashing the PDF file, TraceSet records structured question-level fingerprints in PostgreSQL.
4. **Resilient OCR Extraction**: Parses text, question boundaries, and answer options from camera photos, PDFs, and scanned documents.
5. **Multi-Feature AI Matching & Abstention**: Evaluates wording matches, semantic sentence embeddings, option permutations, and question sequences to rank probable source centres. When evidence is ambiguous or shared across all versions, the system abstains rather than making false attributions.

---

## 2. End-to-End Pipeline

```
+--------------------------------------------------------------------------------------------------+
|                                        TRACESET PIPELINE                                         |
+--------------------------------------------------------------------------------------------------+
|  1. PAPER GENERATION & FINGERPRINTING                                                            |
|     Question Bank  -->  Controlled Variations (Order, Options, Variants)  -->  Sets A, B, C      |
|     Mapping: Set A -> Centre A, Set B -> Centre B, Set C -> Centre C                             |
|     Storage: Question-level fingerprints committed to PostgreSQL                                 |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+--------------------------------------------------------------------------------------------------+
|  2. SUSPECTED LEAK INGESTION & OCR EXTRACTION                                                    |
|     Upload (PDF / Photo / Scans)  -->  Preprocessing  -->  OCR  -->  Structured Question JSON    |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+--------------------------------------------------------------------------------------------------+
|  3. AI MATCHING & FORENSIC ATTRIBUTION                                                           |
|     - Fuzzy & exact text matching                                                                |
|     - Semantic embeddings (Sentence Transformers)                                                |
|     - Option order permutation alignment                                                         |
|     - Question sequence alignment                                                                |
|     - Abstention & uncertainty evaluation                                                        |
+--------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+--------------------------------------------------------------------------------------------------+
|  4. INVESTIGATION DASHBOARD                                                                      |
|     Ranked candidate centres, forensic evidence breakdown, similarity scores & confidence warnings|
+--------------------------------------------------------------------------------------------------+
```

---

## 3. System Architecture & Modular Design

TraceSet is built as an integrated system sharing **one FastAPI backend** and **one PostgreSQL database**:

```text
TraceSet/
|-- frontend/                               # React.js Investigation Dashboard
|   |-- README.md
|   `-- src/
|       |-- components/                     # Reusable UI components
|       |-- pages/                          # Dashboard, Paper Management, Leak Upload, Results
|       `-- services/                       # API client services
|
|-- backend/
|   |-- app/
|   |   |-- main.py                         # Unified FastAPI application entrypoint
|   |   |-- database.py                     # Shared PostgreSQL connection & SessionLocal
|   |   |-- models/                         # Unified SQLAlchemy database models
|   |   |   |-- examination.py              # Exam definitions
|   |   |   |-- centre.py                   # Examination centre records
|   |   |   |-- question.py                 # Question bank & variants
|   |   |   |-- paper_version.py            # Paper versions assigned to centres
|   |   |   |-- paper_fingerprint.py        # Question-level digital fingerprints
|   |   |   |-- leak.py                     # Uploads & OCR extracted questions
|   |   |   `-- analysis.py                 # Matching results & forensic evidence
|   |   |-- schemas/                        # Pydantic data validation contracts
|   |   |   |-- paper.py                    # Paper generation & fingerprint schemas
|   |   |   `-- shared.py                   # OCR extraction & matching schemas
|   |   |-- modules/
|   |   |   |-- paper_generation/           # Paper generation & fingerprinting engine
|   |   |   |   |-- generator.py            # Controlled generation algorithm
|   |   |   |   |-- fingerprint.py          # Fingerprint computation & feature extraction
|   |   |   |   `-- service.py              # DB transactions & reference fingerprint queries
|   |   |   |-- ocr/                        # Document ingestion & OCR extraction
|   |   |   `-- matching/                   # AI multi-feature matching & candidate ranking
|   |   `-- routes/
|   |       |-- paper_routes.py             # Paper management & fingerprint REST APIs
|   |       `-- __init__.py
|   `-- tests/
|       `-- test_paper_generation.py        # Comprehensive test suite
|
|-- sample_data/
|   |-- sample_exam_data.py                 # Reference question bank & examination data
|   |-- sample_examination.json             # Exam metadata fixture
|   |-- sample_centres.json                 # Centre fixtures (Delhi, Mumbai, Bengaluru)
|   |-- sample_questions.json               # Question bank fixture with variants
|   `-- seed_data.py                        # Automated database initialization & seeder
|
|-- requirements.txt
|-- .env.example
|-- .gitignore
`-- README.md
```

---

## 4. Database Architecture

All modules connect to the unified PostgreSQL database (`traceset`). Below is the complete table design:

| Table | Entity | Key Fields | Purpose |
| :--- | :--- | :--- | :--- |
| **`examinations`** | Exam Metadata | `id`, `code`, `name`, `subject`, `total_marks`, `duration_minutes` | Stores official examination specifications |
| **`centres`** | Exam Centres | `id`, `code`, `name`, `city`, `state`, `contact_email` | Physical examination centres receiving specific paper sets |
| **`questions`** | Question Bank | `id`, `code`, `subject`, `topic`, `difficulty`, `marks`, `primary_text`, `options`, `variants` | Master question repository with predefined equivalent variants |
| **`paper_versions`** | Generated Sets | `id`, `examination_id`, `centre_id`, `version_code`, `total_marks`, `difficulty_summary` | Paper versions (e.g. SET_A, SET_B, SET_C) assigned to centres |
| **`paper_fingerprints`**| Fingerprints | `id`, `paper_version_id`, `question_id`, `question_order`, `variant_id`, `option_order`, `distinguishing_features` | Granular question-level digital fingerprint records |
| **`leak_uploads`** | Leak Ingestion | `id`, `filename`, `file_path`, `file_type`, `file_size_bytes`, `status`, `total_pages` | Uploaded leak media files and processing status |
| **`extracted_questions`**| Extracted Items| `id`, `upload_id`, `extracted_text`, `options`, `page_number`, `extraction_quality` | OCR extracted questions and parsed options |
| **`analysis_results`** | Match Analysis | `id`, `upload_id`, `status`, `top_candidate_version_id`, `top_similarity_score`, `explanation` | Forensic candidate rankings and confidence score |
| **`matching_evidence`** | Forensic Clues | `id`, `analysis_result_id`, `paper_version_id`, `feature_type`, `score`, `description` | Specific evidence items (e.g. option order agreement, text match) |

---

## 5. Controlled Variations & Digital Fingerprinting

To reliably trace a leak back to an origin paper version while safeguarding academic standards, TraceSet uses four orthogonal dimensions of controlled variation:

1. **Strict Academic Parity**: Every generated paper version maintains the exact same total marks and identical difficulty distribution (e.g., 3 EASY, 5 MEDIUM, 2 HARD).
2. **Predefined Equivalent Variants**: Questions switch between academically equivalent phrasing variants (`DEFAULT`, `VAR_1`, `VAR_2`) that test the identical concept at the identical difficulty level without changing meaning.
3. **Question Ordering Permutations**: Question sequence is shuffled deterministically across versions.
4. **Option Ordering Permutations**: Answer options ($A, B, C, D$) are permuted per version. The system stores the explicit option mapping (`{"A": "orig_C", "B": "orig_A", ...}`).
5. **Fine-Grained Question-Level Records**: Rather than an all-or-nothing PDF hash, each question entry in `paper_fingerprints` contains text hashes, option order signatures, and position tokens. This allows forensic attribution even when a leak contains only 2 or 3 questions.

---

## 6. Installation & Setup Guide

### Prerequisites
- **Python**: 3.10+ (Developed and validated on Python 3.13)
- **Database**: PostgreSQL 16+ / 18 running locally or accessible via network
- **Git**: Installed

### Step 1: Clone and Configure Environment
```powershell
# Navigate into TraceSet directory
cd TraceSet

# Create .env from template
cp .env.example .env
```

Verify your `.env` connection string:
```ini
DATABASE_URL=postgresql://postgres:admin@localhost:5432/traceset
BACKEND_PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### Step 2: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Initialize Database & Seed Baseline Data
Run the database seeder to create all PostgreSQL tables, load sample examination questions, and generate baseline paper versions (SET_A, SET_B, SET_C) with centre mappings and digital fingerprints:
```powershell
python sample_data/seed_data.py
```

### Step 4: Run the Automated Test Suite
Run the test suite to verify question balancing, controlled variation parity, centre associations, and fingerprint retrieval:
```powershell
python -m pytest backend/tests/test_paper_generation.py -v
```

### Step 5: Start the TraceSet Backend Server
```powershell
uvicorn backend.app.main:app --reload --port 8000
```
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 7. API Reference

### Paper Generation & Reference Fingerprint Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and module operational status |
| `POST` | `/api/papers/examinations` | Register a new examination specification |
| `GET` | `/api/papers/examinations` | List registered examinations |
| `POST` | `/api/papers/centres` | Register an examination centre |
| `GET` | `/api/papers/centres` | List all examination centres |
| `POST` | `/api/papers/questions` | Add a new question (with options and variants) to the question bank |
| `GET` | `/api/papers/questions` | Retrieve questions from the question bank |
| `POST` | `/api/papers/generate` | Generate paper versions with controlled variations and save fingerprints |
| `GET` | `/api/papers/versions` | List all generated paper versions and assigned centres |
| `GET` | `/api/papers/versions/{id}` | Retrieve a specific rendered paper version |
| `GET` | `/api/papers/fingerprints` | Retrieve question-level reference fingerprints for forensic matching |

### Retrieval Interface for Matching Engine
The AI matching module can retrieve reference fingerprints directly in Python or via REST API:
```python
from backend.app.database import SessionLocal
from backend.app.modules.paper_generation.service import get_reference_fingerprints_for_matching

db = SessionLocal()
reference_fingerprints = get_reference_fingerprints_for_matching(db, examination_id="...")
```

---

## 8. Forensic Rules & Uncertainty Handling

TraceSet enforces essential forensic principles to prevent false accusations:
- **Transparent Evidence**: Attribution is never reported as a black-box score; it provides clear breakdowns (wording match, option permutation match, question position match).
- **Abstention Mechanism**: If a leaked snippet contains questions identical across all paper versions or if OCR quality is too degraded, TraceSet reports **"Insufficient evidence to reliably identify the source"** rather than forcing a low-confidence guess.
- **Probabilistic Similarity**: Scores are reported as **similarity/matching scores**, not absolute proof of who leaked the document.
