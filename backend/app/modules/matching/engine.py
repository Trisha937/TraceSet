import os
from rapidfuzz import fuzz


def calculate_match_score(leaked_questions, official_paper_versions, filename=None):
    """
    Compares extracted leaked questions against official paper versions 
    and ranks candidates based on fuzzy semantic similarity, option ordering, and evidence.
    Fully dynamic, algorithmic calculation without heavy neural network overhead.
    """
    if not official_paper_versions:
        return {
            "status": "no_match",
            "ranked_candidates": [],
            "explanation": "No official reference fingerprints found in database.",
            "warnings": ["Database has no generated paper versions."]
        }

    candidates_scores = []

    for version in official_paper_versions:
        version_id = version.get("paper_version_id")
        centre_id = version.get("centre_id")
        official_questions = version.get("questions", [])

        total_score = 0.0
        matched_count = 0
        evidence_list = []

        for l_q in (leaked_questions or []):
            l_text = (l_q.get("question_text") or l_q.get("cleaned_text") or "").strip()
            l_options = l_q.get("options", {})

            if not l_text:
                continue

            best_question_score = 0.0
            matched_with_question = False

            for o_q in official_questions:
                o_text = (o_q.get("question_text") or o_q.get("primary_text") or "").strip()
                o_options = o_q.get("options", {})

                if not o_text:
                    continue

                # 1. Semantic word similarity
                semantic_sim = float(fuzz.token_set_ratio(l_text.lower(), o_text.lower()))

                # 2. Fuzzy substring similarity for blurry/cropped text
                fuzzy_sim = max(
                    float(fuzz.partial_ratio(l_text.lower(), o_text.lower())),
                    float(fuzz.token_set_ratio(l_text.lower(), o_text.lower()))
                )

                # Weighted text score
                text_score = (semantic_sim * 0.6) + (fuzzy_sim * 0.4)

                # Match threshold accommodating optical noise and variant wording
                if text_score > 60:
                    matched_with_question = True
                    best_question_score = max(best_question_score, text_score)

                    # Option order verification (digital fingerprint)
                    if l_options and o_options and l_options == o_options:
                        if "Option order matches" not in evidence_list:
                            evidence_list.append("Option order matches")

            if matched_with_question:
                matched_count += 1
                total_score += best_question_score

        # Normalize score over the number of leaked questions analyzed (supports partial leaks)
        eval_count = len(leaked_questions) if leaked_questions else len(official_questions)
        avg_score = (total_score / eval_count) if eval_count and matched_count > 0 else 0.0

        if matched_count > 0:
            if "Question wording matches" not in evidence_list:
                evidence_list.append("Question wording matches")

        candidates_scores.append({
            "paper_version_id": version_id,
            "centre_id": centre_id,
            "similarity_score": round(min(avg_score, 100.0), 1),
            "matched_questions": matched_count,
            "evidence": evidence_list
        })

    # Sort candidates by similarity score descending
    candidates_scores = sorted(candidates_scores, key=lambda x: x["similarity_score"], reverse=True)

    # Abstention Mechanism (Uncertainty Handling for fake / non-matching leaks)
    if not candidates_scores or candidates_scores[0]["similarity_score"] < 40:
        return {
            "status": "no_match",
            "ranked_candidates": [],
            "explanation": "No reliable match found with the available reference fingerprints.",
            "warnings": ["The leak did not match any stored official paper variants."]
        }

    # Ambiguity check
    if len(candidates_scores) > 1 and abs(candidates_scores[0]["similarity_score"] - candidates_scores[1]["similarity_score"]) < 3.0:
        return {
            "status": "ambiguous_match",
            "ranked_candidates": candidates_scores,
            "explanation": "Multiple versions have similar scores. Insufficient distinct evidence to isolate a single source.",
            "warnings": ["Overlapping questions detected across multiple centres."]
        }

    top_cand = candidates_scores[0]
    return {
        "status": "possible_match",
        "ranked_candidates": candidates_scores,
        "explanation": f"Version {top_cand['paper_version_id']} has the strongest available matching evidence.",
        "warnings": []
    }
