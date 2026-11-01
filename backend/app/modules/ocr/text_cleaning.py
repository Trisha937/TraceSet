import re


def normalize_whitespace(value: str) -> str:
    if value is None:
        return ""

    cleaned = re.sub(r"\r\n?", "\n", value)
    cleaned = re.sub(r"\t+", " ", cleaned)
    cleaned = re.sub(r"[ \f\v]+", " ", cleaned)
    cleaned = re.sub(r" *\n *", "\n", cleaned)

    return cleaned.strip()


def clean_text(value: str) -> str:
    text = normalize_whitespace(value)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" +\n", "\n", text)
    text = re.sub(r"\n +", "\n", text)

    return text.strip()