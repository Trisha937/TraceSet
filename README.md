# TraceSet – AI-Powered Examination Paper Leak Detection and Source Identification

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trace--set.vercel.app-00D4FF?style=for-the-badge&logo=vercel)](https://trace-set.vercel.app)
[![Backend API](https://img.shields.io/badge/API-FastAPI%20Cloud-008080?style=for-the-badge&logo=fastapi)](https://traceset.onrender.com/docs)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/PostgreSQL-Neon%20Cloud-336791?style=flat-square&logo=postgresql)](https://neon.tech/)

> **TraceSet** is an automated forensic examination security and source attribution platform. When an examination paper leaks — via camera photos, social media screenshots, scanned PDFs, or retyped text — TraceSet extracts question features, aligns them against question-level digital fingerprints embedded across paper versions, and identifies the probable source examination centre with explainable forensic evidence.

---

## 🚀 Live Demo & Access

- **Live Application**: [https://trace-set.vercel.app](https://trace-set.vercel.app)
- **API Documentation (Swagger)**: [https://traceset.onrender.com/docs](https://traceset.onrender.com/docs)
- **Backend Health Check**: [https://traceset.onrender.com/api/health](https://traceset.onrender.com/api/health)

---

## 🎯 Demo Walkthrough — What to Upload & Test

TraceSet includes curated test fixtures in the [`sample_data/demo_leaks/`](sample_data/demo_leaks/) directory. Use these files on the **[Leak Upload](https://trace-set.vercel.app/upload)** page to evaluate the system's core capabilities:

| File Name (in `sample_data/demo_leaks/`) | Leak Scenario Tested | Expected Forensic Outcome |
| :--- | :--- | :--- |
| **`leak_photo_mumbai_blurry.png`** | 📸 **Heavy Optical Blur**<br>Simulates low-quality, out-of-focus smartphone camera capture | **Attributed to Centre B (Mumbai)**<br>Single-question wording match extracted despite optical noise. |
| **`leak_photo_incomplete.png`** | ✂️ **Incomplete / Cropped Fragment**<br>Simulates a photo showing only 2 questions of a 10-question exam | **Attributed to Centre B (Mumbai)**<br>High-confidence attribution corroborated across multiple questions. |
| **`leak_centre_B_mumbai.pdf`** | 📄 **Digital PDF Leak**<br>Direct document leak with original typesetting | **Attributed to Centre B (Mumbai) · 100% Match**<br>Verifies academic variant wording + watermarked option sequence. |
| **`leak_centre_B_mumbai.txt`** | 💬 **Messaging App Clipping**<br>Retyped plain-text leak from WhatsApp / Telegram | **Attributed to Centre B (Mumbai)**<br>Instant 5ms string extraction and fingerprint alignment. |
| **`leak_centre_A_delhi.txt`** | 🏛️ **Different Centre Leak**<br>Leaked questions originating from Centre A (Delhi) | **Attributed to Centre A (Delhi)**<br>Correctly isolates Centre A over Mumbai and Bengaluru. |
| **`leak_insufficient_evidence.txt`** | 🛡️ **Forensic Abstention Test**<br>Unrelated question (*"What is machine learning?"*) | **Status: Insufficient Evidence**<br>System responsibly abstains rather than making false attributions. |

### How to Run the Demo in 3 Clicks:
1. Open **[https://trace-set.vercel.app/upload](https://trace-set.vercel.app/upload)**.
2. Drag and drop any file from `sample_data/demo_leaks/` (e.g. `leak_photo_incomplete.png`).
3. Click **"Investigate"** (or open the **Investigation** tab) → click **"Run Analysis"** to see the forensic attribution breakdown!

---

## 💡 How TraceSet Works (The Core Innovation)

Traditional security relies on full-file digital watermarks or cryptographic SHA-256 hashes, which **completely break** once a paper is photographed, cropped, or photocopied. TraceSet solves this via **discrete question-level fingerprinting**:

```
+--------------------------------------------------------------------------------------------------+
|                                        TRACESET PIPELINE                                         |
+--------------------------------------------------------------------------------------------------+
|  1. CONTROLLED PAPER GENERATION & DIGITAL FINGERPRINTING                                         |
|     - Master Question Bank with academic equivalent variants (VAR_1, VAR_2)                     |
|     - Permuted question ordering + option shuffling (A, B, C, D)                                 |
|     - Set A -> Centre A (Delhi) | Set B -> Centre B (Mumbai) | Set C -> Centre C (Bengaluru)     |
|     - Fine-grained question fingerprints stored in PostgreSQL                                     |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 ▼
+--------------------------------------------------------------------------------------------------+
|  2. SUSPECTED LEAK INGESTION & TEXT EXTRACTION                                                   |
|     - Ingests camera photos (.png, .jpg), scanned PDFs (.pdf), or plain text (.txt)              |
|     - Resilient parsing extracts detected question boundaries and options                         |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 ▼
+--------------------------------------------------------------------------------------------------+
|  3. AI FORENSIC MATCHING & ATTRIBUTION ENGINE                                                    |
|     - Multi-strategy fuzzy semantic text alignment (Token Set Ratio + Partial Matching)          |
|     - Digital watermark verification (Option sequence permutation matching)                     |
|     - Explainable forensic evidence tags generated for judicial/investigative reporting          |
|     - Built-in abstention engine: refuses to guess on unrelated or low-confidence snippets       |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 ▼
+--------------------------------------------------------------------------------------------------+
|  4. REAL-TIME INVESTIGATION DASHBOARD                                                            |
|     - Ranked candidates with percentage similarity scores                                        |
|     - Transparent evidence checklist (Variant match, option order match, multi-question proof)   |
+--------------------------------------------------------------------------------------------------+
```

---

## 🏛️ System Architecture

TraceSet is built as a unified, production-grade cloud application:

```text
TraceSet/
├── frontend/                         # React.js SPA (Vite + TailwindCSS + Lucide Icons)
│   ├── src/
│   │   ├── components/               # Domain cards, dropzones, status badges, navbars
│   │   ├── pages/                    # Dashboard, Paper Management, Leak Upload, Investigation
│   │   └── services/                 # Axios & Fetch clients connecting to FastAPI
│   └── vercel.json                   # Vercel SPA client-side routing config
│
├── backend/                          # FastAPI REST Engine
│   └── app/
│       ├── main.py                   # FastAPI application, CORS middleware, auto-seeder
│       ├── database.py               # SQLAlchemy engine with connection pooling
│       ├── models/                   # PostgreSQL models (Exams, Centres, Questions, Fingerprints, Leaks)
│       └── modules/
│           ├── paper_generation/     # Controlled variation generator & fingerprint compiler
│           ├── ocr/                  # PyMuPDF parser, image preprocessing & resilient extraction
│           └── matching/             # Dynamic fuzzy alignment & candidate ranking engine
│
├── sample_data/                      # Demonstration fixtures & automated database seeders
│   ├── demo_leaks/                   # Ready-to-upload leak files (.png, .pdf, .txt)
│   ├── sample_exam_data.py           # Master 10-question AI & CS exam question bank
│   └── seed_database.py              # Cloud DB auto-provisioner
│
└── requirements.txt                  # Optimized lightweight Python dependencies (< 50MB RAM)
```

---

## 📊 Database Schema Summary

All data persists in managed PostgreSQL (`traceset-db`):

| Table | Entity Stored | Forensic Significance |
| :--- | :--- | :--- |
| **`examinations`** | Exam Metadata | Official course code, total marks, and exam duration |
| **`centres`** | Examination Centres | Physical test centres receiving specific paper sets |
| **`questions`** | Question Bank | Master pool of questions with academically equivalent phrasing variants |
| **`paper_versions`** | Generated Sets | Version identifiers (SET_A, SET_B, SET_C) mapped to specific centres |
| **`paper_fingerprints`** | Question Fingerprints | Granular question text hashes, variant IDs, and option permutations |
| **`leak_uploads`** | Leak Records | Ingested files, timestamps, page counts, and extraction status |
| **`extracted_questions`** | Parsed Questions | OCR-extracted question text and options detected in the leak |

---

## 💻 Local Development Setup

If you wish to run TraceSet locally on your machine:

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ and `npm`
- **PostgreSQL**: 15+ (or use free managed PostgreSQL on Neon / Supabase)

### 2. Clone the Repository
```powershell
git clone https://github.com/Trisha937/TraceSet.git
cd TraceSet
```

### 3. Backend Setup
```powershell
# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate

# Install lightweight dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy template and set your DATABASE_URL:
# DATABASE_URL=postgresql://user:password@localhost:5432/traceset

# Run database seeder (initializes tables & sets up sample exam)
python sample_data/seed_database.py

# Start FastAPI server
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Swagger Documentation: `http://localhost:8000/docs`

### 4. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

## 🧪 Automated Testing

TraceSet includes test coverage across OCR parsing, question extraction, and matching algorithms:

```powershell
python -m pytest backend/tests/test_ocr.py -v
```

---

## ⚖️ Forensic Principles & Integrity

1. **Explainable Attribution**: TraceSet never presents a raw black-box prediction. Every candidate card displays clear, human-verifiable evidence tags (*"Question wording matches"*, *"Option order matches"*).
2. **Responsible Abstention**: If a leaked snippet does not contain sufficient distinguishing features, TraceSet displays **`Insufficient Evidence`** to prevent wrongful accusations.
3. **Probabilistic Scoring**: Results represent statistical likelihood of origin based on mathematical watermark sequences, not subjective opinion.
