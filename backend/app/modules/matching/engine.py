import os
import numpy as np
from rapidfuzz import fuzz


_model = None
_util = None


def get_sentence_transformer():
    # Heavy ML models are disabled on cloud containers with limited RAM.
    # RapidFuzz provides fast, accurate matching without any memory overhead.
    return None, None


def calculate_match_score(leaked_questions, official_paper_versions):
    """
    Compares extracted leaked questions against official paper versions
    and ranks candidates based on similarity, option ordering, and evidence.

    Designed to handle:
    - Partial leaks (only a few questions photographed)
    - Blurry/incomplete images (OCR extracts garbled text)
    - Camera-photo leaks (rotated, low-res, partial crop)
    """
    candidates_scores = []

    for version in official_paper_versions:
        version_id = version.get("paper_version_id")
        centre_id = version.get("centre_id")
        official_questions = version.get("questions", [])

        total_score = 0.0
        matched_count = 0
        evidence_list = []
        option_match_count = 0

        for l_q in leaked_questions:
            l_text = (l_q.get("question_text") or l_q.get("cleaned_text") or "").strip()
            l_options = l_q.get("options", {})

            if not l_text:
                continue

            best_question_score = 0.0
            matched_with_question = False
            best_matched_options = False

            for o_q in official_questions:
                o_text = (o_q.get("question_text") or o_q.get("primary_text") or "").strip()
                o_options = o_q.get("options", {})

                if not o_text:
                    continue

                # Fuzzy text matching — handles OCR typos, partial sentences, blurry text
                score_token_set = float(fuzz.token_set_ratio(l_text.lower(), o_text.lower()))
                score_partial = float(fuzz.partial_ratio(l_text.lower(), o_text.lower()))
                score_token_sort = float(fuzz.token_sort_ratio(l_text.lower(), o_text.lower()))

                # Take the best of all fuzzy strategies
                text_score = max(score_token_set, score_partial, score_token_sort)

                # Lowered threshold: 35 supports heavily blurred/partial text from photos
                if text_score > 35:
                    matched_with_question = True
                    best_question_score = max(best_question_score, text_score)

                    # Check option order matching
                    if l_options and o_options:
                        option_score = sum(
                            fuzz.token_set_ratio(
                                str(l_options.get(k, "")).lower(),
                                str(o_options.get(k, "")).lower()
                            )
                            for k in set(list(l_options.keys()) + list(o_options.keys()))
                        ) / max(len(set(list(l_options.keys()) + list(o_options.keys()))), 1)

                        if option_score > 50:
                            best_matched_options = True

            if matched_with_question:
                matched_count += 1
                total_score += best_question_score
                if best_matched_options:
                    option_match_count += 1

        # Evidence assembly
        if matched_count > 0:
            evidence_list.append("Question wording matches")
        if option_match_count > 0:
            evidence_list.append("Option order matches")
        if matched_count >= 2:
            evidence_list.append("Multiple questions corroborated")

        # Score normalization — partial leaks divide by leaked questions only
        eval_count = max(len(leaked_questions), 1)
        avg_score = (total_score / eval_count) if matched_count > 0 else 0.0

        # Bonus for partial leaks that match strongly on at least 1 question
        if matched_count > 0 and len(leaked_questions) < 5:
            # For partial leaks (fewer than 5 questions), boost score to reflect
            # that even 1 strong matching question is significant forensic evidence
            partial_bonus = (matched_count / max(len(leaked_questions), 1)) * 15
            avg_score = min(avg_score + partial_bonus, 100.0)

        candidates_scores.append({
            "paper_version_id": version_id,
            "centre_id": centre_id,
            "similarity_score": round(min(avg_score, 100.0), 2),
            "matched_questions": matched_count,
            "evidence": evidence_list
        })

    # Sort by similarity score descending
    candidates_scores = sorted(candidates_scores, key=lambda x: x["similarity_score"], reverse=True)

    # No match at all (even after partial-leak scoring)
    if not candidates_scores or candidates_scores[0]["similarity_score"] < 20:
        return {
            "status": "no_match",
            "ranked_candidates": [],
            "explanation": "No reliable match found with the available reference fingerprints.",
            "warnings": ["The leak did not match any stored official paper variants."]
        }

    # Ambiguous — top two candidates too close to distinguish
    if (
        len(candidates_scores) > 1
        and abs(candidates_scores[0]["similarity_score"] - candidates_scores[1]["similarity_score"]) < 3.0
        and candidates_scores[0]["similarity_score"] < 50
    ):
        return {
            "status": "ambiguous_match",
            "ranked_candidates": candidates_scores,
            "explanation": "Multiple versions have similar scores. Insufficient distinct evidence to isolate a single source.",
            "warnings": ["Overlapping questions detected across multiple centres."]
        }

    return {
        "status": "possible_match",
        "ranked_candidates": candidates_scores,
        "explanation": (
            f"Version {candidates_scores[0]['paper_version_id']} has the strongest available matching evidence."
            + (" (Partial leak — limited questions available for analysis.)" if candidates_scores[0]["matched_questions"] < 3 else "")
        ),
        "warnings": []
    }
