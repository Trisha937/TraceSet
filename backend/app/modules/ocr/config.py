import os
from pathlib import Path

OCR_MAX_FILE_SIZE_MB = int(os.getenv("OCR_MAX_FILE_SIZE_MB", "20"))
OCR_MAX_PAGES = int(os.getenv("OCR_MAX_PAGES", "50"))
OCR_RENDER_DPI = int(os.getenv("OCR_RENDER_DPI", "300"))

OCR_TESSERACT_LANG = os.getenv("OCR_TESSERACT_LANG", "eng")
TESSERACT_CMD = os.getenv("TESSERACT_CMD")

OCR_TESSERACT_PSM = int(os.getenv("OCR_TESSERACT_PSM", "6"))
OCR_LOW_CONFIDENCE = int(os.getenv("OCR_LOW_CONFIDENCE", "65"))
OCR_MEDIUM_CONFIDENCE = int(os.getenv("OCR_MEDIUM_CONFIDENCE", "80"))
OCR_BLUR_THRESHOLD = int(os.getenv("OCR_BLUR_THRESHOLD", "80"))

# Locate the TraceSet repository root.
PROJECT_ROOT = Path(__file__).resolve().parents[4]

UPLOAD_DIR = os.getenv(
    "LEAK_UPLOAD_DIR",
    str(PROJECT_ROOT / "backend" / "uploads" / "leaks"),
)

OCR_MAX_TEXT_CHARS = int(os.getenv("OCR_MAX_TEXT_CHARS", "200000"))


def max_file_size_bytes():
    return OCR_MAX_FILE_SIZE_MB * 1024 * 1024