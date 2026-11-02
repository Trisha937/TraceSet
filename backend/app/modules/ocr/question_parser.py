
import re
from typing import Any, Dict, List, Tuple

from backend.app.modules.ocr.text_cleaning import clean_text


OPTION_CANDIDATE_PATTERN = re.compile(
    r"(?ix)(?:^|[\s\(\[\{])(?P<label>[A-Da-d])\s*(?:\)|\]|\}|\.)"
)

OPTION_SUSPICIOUS_LABEL_PATTERN = re.compile(
    r"(?ix)(?:^|[\(\[\{])(?P<label>[A-Da-d][Yy]|©|6)(?![A-Za-z0-9])(?:\s*(?:\)|\]|\}|\.))?"
)

OPTION_UNCERTAIN_NUMERIC_LABEL_PATTERN = re.compile(
    r"(?ix)(?:^|[\s\(\[\{])\(\s*(?P<label>\d+)\s*(?=(?:\s*(?:\)|\]|\}|$)|\s*\(?[A-Da-d]))"
)

OPTION_LINE_PATTERN = re.compile(
    r"^\s*(?:\(?\s*)(?P<label>[A-Da-d])\s*(?:\)|\]|\}|\.)\s*(?P<value>.*)$",
    re.IGNORECASE,
)

QUESTION_START_PATTERN = re.compile(
    r"^\s*(?:Q(?:UESTION)?\s*)?(?P<number>\d+)\s*(?:[\.:\)]|$)|^\s*QUESTION\s+(?P<number2>\d+)\b",
    re.IGNORECASE,
)

HEADING_OR_INSTRUCTION_PATTERN = re.compile(
    r"(?i)^(?:section|part|chapter|instruction|instructions|note|notes)\b|(?:consists of|mark each|questions? of|choose the correct|select the correct|answer all)",
)



def _is_heading_or_instruction(text: str) -> bool:
    if not text or not text.strip():
        return False

    normalized = text.strip()

    # Section headings and general instructions
    if re.match(
        r"^(?:section|part|chapter|instruction|instructions|note|notes)\b",
        normalized,
        flags=re.IGNORECASE,
    ):
        return True

    # Examination instructions that must not be parsed as questions
    instruction_patterns = [
        r"each question carries",
        r"each question is worth",
        r"select one option",
        r"choose one option",
        r"choose the correct",
        r"select the correct",
        r"answer all",
        r"attempt all",
        r"mark each",
        r"questions of",
        r"consists of",
        r"no calculators allowed",
        r"select the most appropriate option",
    ]

    if any(
        re.search(pattern, normalized, flags=re.IGNORECASE)
        for pattern in instruction_patterns
    ):
        return True

    # Paper-ending text
    if re.match(
        r"^(?:end of|end)\s+(?:the\s+)?(?:sample\s+)?paper\b",
        normalized,
        flags=re.IGNORECASE,
    ):
        return True

    return False


def _is_question_start(line: str) -> bool:
    stripped = line.strip()

    if not stripped:
        return False

    if re.match(
        r"^\s*(?:Q(?:UESTION)?\s*)?\d+\s*(?:[\.:\)]|$)",
        stripped,
        flags=re.IGNORECASE,
    ):
        return True

    if re.match(
        r"^\s*QUESTION\s+\d+\b",
        stripped,
        flags=re.IGNORECASE,
    ):
        return True

    return False


def _split_question_lines(lines: List[str]):
    parts: List[str] = []
    buffer: List[str] = []

    for line in lines:
        if not line.strip():
            continue

        if _is_question_start(line) and buffer:
            candidate = "\n".join(buffer).strip()

            if candidate:
                parts.append(candidate)

            buffer = []

        buffer.append(line.strip())

    if buffer:
        candidate = "\n".join(buffer).strip()

        if candidate:
            parts.append(candidate)

    return [part for part in parts if part]


def _extract_question_number(text: str):
    match = re.match(
        r"^\s*(?:Q(?:UESTION)?\s*)?(?P<number>\d+)\s*(?:[\.:\)]|$)",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return int(match.group("number"))

    match = re.match(
        r"^\s*QUESTION\s+(?P<number>\d+)\b",
        text,
        flags=re.IGNORECASE,
    )

    if match:
        return int(match.group("number"))

    return 0


def _strip_question_prefix(text: str) -> str:
    text = text.strip()

    if not text:
        return ""

    text = re.sub(
        r"^\s*(?:Q(?:UESTION)?\s*)?\d+\s*(?:[\.:\)]|\s+)\s*",
        "",
        text,
        count=1,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"^\s*QUESTION\s+\d+\s*(?:[\.:\)]|\s+)\s*",
        "",
        text,
        count=1,
        flags=re.IGNORECASE,
    )

    return text.strip()


def _extract_question_text(raw_question: str):
    lines = raw_question.splitlines()
    question_lines: List[str] = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            continue

        if OPTION_LINE_PATTERN.match(stripped):
            break

        if _is_question_start(stripped):
            candidate = _strip_question_prefix(stripped)

            if candidate and not re.match(
                r"^(?:\(?\s*[A-Da-d]\s*(?:\)|\]|\}|\.)|[A-Da-d]\.)",
                candidate,
                flags=re.IGNORECASE,
            ):
                question_lines.append(candidate)

            continue

        question_lines.append(stripped)

    text = " ".join(question_lines).strip()

    return _strip_question_prefix(text)


def _normalize_option_label(
    raw_label: str,
    expected_order: List[str],
    seen_labels: set[str],
) -> Tuple[str | None, bool]:

    candidate = (raw_label or "").strip()

    if not candidate:
        return None, False

    normalized = candidate.upper().replace(" ", "")
    remaining = [
        label for label in expected_order
        if label not in seen_labels
    ]

    if normalized in {"A", "B", "C", "D"}:
        return normalized, False

    if normalized == "©" and "C" in remaining:
        return "C", True

    if normalized == "BY" and "B" in remaining:
        return "B", True

    if normalized == "6" and "B" in remaining:
        return "B", True

    if normalized in {"{D", "D}", "D"} and "D" in remaining:
        return "D", True

    return None, False


def _clean_option_value(value: str) -> str:
    cleaned = value.strip()

    if not cleaned:
        return ""

    # Preserve spaces between words.
    cleaned = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", cleaned)

    cleaned = re.sub(r"^\s*[:;,]+\s*", "", cleaned)
    cleaned = re.sub(r"\s*[:;,]+\s*$", "", cleaned)

    cleaned = re.sub(
        r"\s*\(\s*(?:[A-Da-d][Yy]?|[0-9]+|©)\s*(?:\)|\]|\}|$)\s*$",
        "",
        cleaned,
    )

    cleaned = re.sub(
        r"\s*\(\s*(?:[A-Da-d][Yy]?|[0-9]+|©)\s*$",
        "",
        cleaned,
    )

    return cleaned.strip()


def _parse_option_matches(
    block: str,
    question_text: str | None = None,
) -> Tuple[Dict[str, str], List[str], List[str]]:

    option_block = block

    if question_text:
        question_text = question_text.strip()

        if question_text:
            pos = block.find(question_text)

            if pos == 0:
                option_block = block[pos + len(question_text):]

            elif (
                pos > 0
                and block[:pos].strip()
                and _is_question_start(block[:pos].strip())
            ):
                option_block = block[pos + len(question_text):]

    else:
        prefix_match = re.match(
            r"^\s*(?:Q(?:UESTION)?\s*)?\d+\s*(?:[\.:\)]|$)",
            block,
            re.IGNORECASE,
        )

        if prefix_match:
            option_block = block[prefix_match.end():]

        else:
            prefix_match = re.match(
                r"^\s*QUESTION\s+\d+\b",
                block,
                re.IGNORECASE,
            )

            if prefix_match:
                option_block = block[prefix_match.end():]

    matches: List[re.Match[str]] = []

    for pattern in (
        OPTION_CANDIDATE_PATTERN,
        OPTION_SUSPICIOUS_LABEL_PATTERN,
    ):
        matches.extend(pattern.finditer(option_block))

    matches = sorted(matches, key=lambda match: match.start())

    uncertain_matches: List[re.Match[str]] = []

    for match in OPTION_UNCERTAIN_NUMERIC_LABEL_PATTERN.finditer(option_block):
        overlaps = any(
            (
                match.start() >= existing.start()
                and match.start() < existing.end()
            )
            or (
                existing.start() >= match.start()
                and existing.start() < match.end()
            )
            for existing in matches
        )

        if not overlaps:
            uncertain_matches.append(match)

    options: Dict[str, str] = {}
    option_order: List[str] = []
    warnings: List[str] = []

    expected_order = ["A", "B", "C", "D"]
    seen_labels: set[str] = set()

    for index, match in enumerate(matches):
        raw_label = match.group("label").strip()

        normalized, is_inferred = _normalize_option_label(
            raw_label,
            expected_order,
            seen_labels,
        )

        if normalized is None or normalized in seen_labels:
            continue

        start = match.end()

        next_match = (
            matches[index + 1]
            if index + 1 < len(matches)
            else None
        )

        end = next_match.start() if next_match else len(option_block)

        value = _clean_option_value(option_block[start:end])

        if not value:
            continue

        options[normalized] = value
        option_order.append(normalized)
        seen_labels.add(normalized)

        if is_inferred or raw_label.upper() != normalized:
            warnings.append(
                f"OCR option label '{raw_label}' normalized to '{normalized}'."
            )

    for match in uncertain_matches:
        label = match.group("label").strip()

        warnings.append(
            f"Uncertain option label '({label}' was ignored because it could not be mapped safely to a valid option letter."
        )

    if matches and len(option_order) < 4:
        warnings.append(
            "Detected only partial MCQ options; some labels may be missing or uncertain."
        )

    if matches and not option_order:
        warnings.append(
            "Option boundaries were too uncertain to assign A-D values reliably."
        )

    return options, option_order, warnings


def parse_mcq_questions(text: str) -> List[Dict[str, Any]]:
    cleaned = clean_text(text)

    # Separate inline question labels before parsing.
    cleaned = re.sub(
        r'(?i)(?<!^)(?<!\n)\s+(?=Q(?:UESTION)?\s*\d+\s*[.):])',
        '\n',
        cleaned,
    )
    lines = [
        line.strip()
        for line in cleaned.splitlines()
        if line.strip()
    ]

    blocks = _split_question_lines(lines)
    items: List[Dict[str, Any]] = []

    for index, block in enumerate(blocks):

        if _is_heading_or_instruction(block):
            continue

        # Ignore titles and unnumbered text.
        first_line = block.splitlines()[0]

        if not _is_question_start(first_line):
            continue

        question_text = _extract_question_text(block)

        if not question_text:
            continue

        options, option_order, warnings = _parse_option_matches(
            block,
            question_text,
        )

        is_complete = set(option_order) == {"A", "B", "C", "D"}

        if not options:
            items.append({
                "question_number": _extract_question_number(block),
                "position_index": index,
                "question_text": question_text,
                "raw_text": block,
                "options": {},
                "option_order": [],
                "page_number": 1,
                "is_complete": False,
                "extraction_quality": "low",
                "ocr_confidence": 0.0,
                "warnings": warnings or [
                    "No multiple choice options were detected."
                ],
            })
            continue

        quality = (
            "high"
            if is_complete and not warnings
            else "medium"
            if len(option_order) >= 2
            else "low"
        )

        items.append({
            "question_number": _extract_question_number(block),
            "position_index": index,
            "question_text": question_text,
            "raw_text": block,
            "options": options,
            "option_order": option_order,
            "page_number": 1,
            "is_complete": is_complete,
            "extraction_quality": quality,
            "ocr_confidence": 0.0,
            "warnings": warnings,
        })

    return items
