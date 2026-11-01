
import io

import pytest
from PIL import Image, ImageDraw, ImageFont

from backend.app.modules.ocr.text_cleaning import clean_text
from backend.app.modules.ocr.question_parser import parse_mcq_questions
from backend.app.modules.ocr.extractors import extract_pdf_pages
from backend.app.modules.ocr.service import process_leak_file
from backend.app.modules.ocr.exceptions import FileValidationError


def test_clean_text_removes_extra_whitespace():
    text = "  Hello   World  \n\n\n  TraceSet  "

    result = clean_text(text)

    assert result == "Hello World\n\nTraceSet"


def test_question_parser_extracts_mcq():
    text = """Q1. What does CPU stand for?
A. Central Processing Unit
B. Computer Personal Unit
C. Central Program Utility
D. Control Processing User"""

    questions = parse_mcq_questions(text)

    assert len(questions) == 1

    question = questions[0]

    assert question["question_number"] == 1
    assert question["options"]["A"] == "Central Processing Unit"
    assert question["options"]["B"] == "Computer Personal Unit"
    assert question["is_complete"] is True


def test_pdf_text_extraction():
    import fitz

    pdf = fitz.open()
    page = pdf.new_page()

    page.insert_text(
        (50, 50),
        "Q1. What is Python?\nA. Programming language\nB. Hardware"
    )

    pdf_bytes = pdf.tobytes()
    pdf.close()

    pages = extract_pdf_pages(pdf_bytes)

    assert len(pages) == 1
    assert "What is Python?" in pages[0]["raw_text"]


def test_image_upload_extraction():
    image = Image.new("RGB", (1800, 800), "white")
    draw = ImageDraw.Draw(image)

    font_path = r"C:\Windows\Fonts\arial.ttf"
    font = ImageFont.truetype(font_path, 42)

    lines = [
        "Q1. What does CPU stand for?",
        "A. Central Processing Unit",
        "B. Computer Personal Unit",
        "C. Central Program Utility",
        "D. Control Processing User",
    ]

    y_position = 60

    for line in lines:
        draw.text((60, y_position), line, fill="black", font=font)
        y_position += 130

    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")

    result = process_leak_file(
        file_bytes=image_bytes.getvalue(),
        filename="test_exam.png"
    )

    assert len(result.questions) >= 1
    assert result.pages[0].raw_text.strip() != ""


def test_empty_file_is_rejected():
    with pytest.raises(FileValidationError):
        process_leak_file(file_bytes=b"", filename="empty.pdf")
