import hashlib
from typing import Dict, Any, List


def compute_text_hash(text: str) -> str:
    """Computes a normalized SHA-256 fingerprint hash of cleaned text."""
    normalized = " ".join(text.strip().lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def compute_option_order_signature(option_map: Dict[str, str]) -> str:
    """
    Computes a deterministic signature representing option ordering.
    Example: {"A": "B", "B": "C", "C": "A", "D": "D"} -> "A:B|B:C|C:A|D:D"
    """
    sorted_pairs = [f"{k}:{v}" for k, v in sorted(option_map.items())]
    signature_str = "|".join(sorted_pairs)
    return hashlib.md5(signature_str.encode("utf-8")).hexdigest()[:12]


def build_question_fingerprint_features(
    question_order: int,
    question_id: str,
    question_code: str,
    variant_id: str,
    variant_text: str,
    option_map: Dict[str, str],
    rendered_options: Dict[str, str],
    marks: int,
    difficulty: str
) -> Dict[str, Any]:
    """
    Constructs structured, multi-dimensional fingerprint features for one question
    in a specific paper version. Member 3 uses these features for granular evidence.
    """
    text_fingerprint = compute_text_hash(variant_text)
    option_sig = compute_option_order_signature(option_map)
    
    # Position signature combines question ID and its ordered position
    position_token = f"{question_id}@pos{question_order}"
    position_hash = hashlib.md5(position_token.encode("utf-8")).hexdigest()[:10]

    return {
        "text_hash": text_fingerprint,
        "option_order_signature": option_sig,
        "position_hash": position_hash,
        "question_code": question_code,
        "marks": marks,
        "difficulty": difficulty,
        "total_options": len(rendered_options),
        "option_keys": sorted(list(rendered_options.keys()))
    }

