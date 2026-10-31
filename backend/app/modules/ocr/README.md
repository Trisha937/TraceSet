# Member 2: Leak Upload, OCR & Text Extraction

**Owner:** Member 2  
**Location:** `backend/app/modules/ocr/`

## Role & Responsibilities
- Accept suspected leaked examination material (PDFs, scanned PDFs, JPG/PNG images, partial exams).
- Preprocess images (grayscale, thresholding, noise reduction).
- Run OCR using Tesseract OCR or EasyOCR.
- Divide extracted text into individual questions and detect options.
- Save extracted questions in shared PostgreSQL tables: `leak_uploads` and `extracted_questions`.
- Provide reusable Python function/Pydantic schema (`OCRExtractionResult`) for Member 3's matching engine.

