
import io
import shutil
import os
from typing import Any

import cv2
import numpy as np
import pytesseract
from PIL import Image

from backend.app.modules.ocr.config import (
    OCR_TESSERACT_LANG,
    OCR_TESSERACT_PSM,
    TESSERACT_CMD,
)
from backend.app.modules.ocr.exceptions import OCRUnavailableError


def _get_tesseract_cmd():
    command = (
        TESSERACT_CMD
        or shutil.which("tesseract")
        or r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )

    if not os.path.isfile(command):
        raise OCRUnavailableError(
            "Tesseract is not installed or configured."
        )

    return command


def _configure_tesseract():
    command = _get_tesseract_cmd()
    pytesseract.pytesseract.tesseract_cmd = command
    return command


def _image_to_numpy(image: Any):
    if isinstance(image, np.ndarray):
        return image

    if isinstance(image, Image.Image):
        return np.array(image.convert("RGB"))

    if isinstance(image, bytes):
        with Image.open(io.BytesIO(image)) as img:
            return np.array(img.convert("RGB"))

    raise TypeError("Unsupported image type")


def ocr_image(image: Any) -> tuple[str, float]:
    _configure_tesseract()

    image_array = _image_to_numpy(image)

    if image_array.ndim == 3:
        image_array = cv2.cvtColor(
            image_array,
            cv2.COLOR_RGB2GRAY,
        )

    config = (
        f"--psm {OCR_TESSERACT_PSM} "
        f"-l {OCR_TESSERACT_LANG}"
    )

    text = pytesseract.image_to_string(
        image_array,
        config=config,
    )

    data = pytesseract.image_to_data(
        image_array,
        config=config,
        output_type=pytesseract.Output.DICT,
    )

    conf_values = []

    for value in data.get("conf", []):
        try:
            confidence = float(value)

            if confidence >= 0:
                conf_values.append(confidence)

        except (ValueError, TypeError):
            continue

    avg_conf = (
        round(sum(conf_values) / len(conf_values), 2)
        if conf_values
        else 0.0
    )

    return text.strip(), avg_conf
