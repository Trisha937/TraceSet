import fitz

from backend.app.modules.ocr.config import OCR_RENDER_DPI, OCR_MAX_PAGES
from backend.app.modules.ocr.ocr_engine import ocr_image
from backend.app.modules.ocr.preprocessing import prepare_image_for_ocr


def extract_pdf_pages(file_bytes: bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []

    try:
        for page_index in range(min(len(doc), OCR_MAX_PAGES)):
            page = doc[page_index]
            text = page.get_text("text")

            # Use embedded text when the PDF already contains readable text.
            if text and text.strip():
                pages.append({
                    "page_number": page_index + 1,
                    "raw_text": text,
                    "cleaned_text": text.strip(),
                    "ocr_confidence": 0.0,
                })
                continue

            # Use OCR when the PDF page is scanned.
            pix = page.get_pixmap(
                matrix=fitz.Matrix(
                    OCR_RENDER_DPI / 72,
                    OCR_RENDER_DPI / 72,
                )
            )

            image = pix.tobytes("png")
            prepared = prepare_image_for_ocr(image)
            extracted, confidence = ocr_image(prepared)

            pages.append({
                "page_number": page_index + 1,
                "raw_text": extracted,
                "cleaned_text": extracted.strip(),
                "ocr_confidence": confidence,
            })

        return pages

    finally:
        doc.close()


def extract_image_text(file_bytes: bytes, filename: str | None = None):
    prepared = prepare_image_for_ocr(file_bytes)
    extracted, confidence = ocr_image(prepared, filename=filename)

    return [{
        "page_number": 1,
        "raw_text": extracted,
        "cleaned_text": extracted.strip(),
        "ocr_confidence": confidence,
    }]
