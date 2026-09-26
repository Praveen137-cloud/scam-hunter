import io
import base64
from typing import Optional, Tuple
from PIL import Image
import numpy as np


def extract_text_from_image(image_bytes: bytes) -> Tuple[str, float]:
    """Extract text from image using EasyOCR with fallback."""
    try:
        import easyocr
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        results = reader.readtext(image_array, detail=1)
        
        texts = []
        confidences = []
        for (bbox, text, confidence) in results:
            if confidence > 0.3:
                texts.append(text)
                confidences.append(confidence)
        
        extracted_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        return extracted_text, avg_confidence
    except ImportError:
        return _fallback_ocr(image_bytes)
    except Exception as e:
        return f"OCR Error: {str(e)}", 0.0


def _fallback_ocr(image_bytes: bytes) -> Tuple[str, float]:
    """Fallback OCR using basic image analysis."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        return f"[Image uploaded: {image.size[0]}x{image.size[1]} pixels. OCR engine not available. Please ensure EasyOCR is installed.]", 0.0
    except Exception:
        return "[Could not process image]", 0.0


def preprocess_image(image_bytes: bytes) -> bytes:
    """Preprocess image for better OCR accuracy."""
    try:
        import cv2
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image.convert('RGB'))
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        result_image = Image.fromarray(thresh)
        output = io.BytesIO()
        result_image.save(output, format='PNG')
        return output.getvalue()
    except Exception:
        return image_bytes


def validate_image(image_bytes: bytes, max_size_mb: int = 10) -> Tuple[bool, str]:
    """Validate image file."""
    if len(image_bytes) > max_size_mb * 1024 * 1024:
        return False, f"Image too large (max {max_size_mb}MB)"
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.format not in ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'TIFF']:
            return False, f"Unsupported image format: {image.format}"
        return True, "Valid"
    except Exception as e:
        return False, f"Invalid image: {str(e)}"
