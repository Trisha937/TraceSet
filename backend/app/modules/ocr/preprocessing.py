import io

import cv2
import numpy as np
from PIL import Image, ImageOps

from backend.app.modules.ocr.config import OCR_BLUR_THRESHOLD


def prepare_image_for_ocr(image_bytes: bytes) -> np.ndarray:
    """Prepare an uploaded image for OCR by improving contrast and binarizing it."""
    with Image.open(io.BytesIO(image_bytes)) as source_image:
        image = source_image.convert("RGB")

    image = ImageOps.autocontrast(image)
    np_image = np.array(image)

    gray = cv2.cvtColor(np_image, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    _, binary = cv2.threshold(
        blurred,
        OCR_BLUR_THRESHOLD,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )

    return binary