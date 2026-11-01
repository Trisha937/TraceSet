import numpy as np
from rapidfuzz import fuzz
from sentence_transformers import SentenceTransformer, util

# Load a lightweight, high-performing Sentence Transformer model for semantic matching
model = SentenceTransformer('all-MiniLM-L6-v2')

def calculate_match_score(leaked_questions, official_paper_versions):
    """
    Compares extracted leaked questions against official paper versions 
    and ranks candidates based on similarity, option ordering, and evidence.
    """
    candidates_scores = []

    for version in official_paper_versions:
        version_id = version.get("paper_version_id")
        centre_id = version.get("centre_id")
        official_questions = version.get("questions", [])

        total_score = 0.0
        matched_count = 0
        evidence_list = []

        for l_q in leaked_questions:
            l_text = l_q.get("question_text", "")
            l_options = l_q.get("options", {})
            
            best_question_score = 0.0
            matched_with_question = False

            for o_q in official_questions:
                o_text = o_q.get("question_text", "")
                o_options = o_q.get("options", {})

                # 1. Semantic Similarity (Meaning matching)
                emb1 = model.encode(l_text, convert_to_tensor=True)
                emb2 = model.encode(o_text, convert_to_tensor=True)
                semantic_sim = float(util.cos_sim(emb1, emb2)[0][0]) * 100  # Scale to 0-100

                # 2. Fuzzy Text Matching (Wording/Spelling matching)
                fuzzy_sim = fuzz.ratio(l_text.lower(), o_text.lower())

                # Combined text score (weighted average)
                text_score = (semantic_sim * 0.6) + (fuzzy_sim * 0.4)

                if text_score > 75:  # Threshold for considering it a match
                    matched_with_question = True
                    best_question_score = max(best_question_score, text_score)

                    # Check option order matching if options exist
                    if l_options and o_options and l_options == o_options:
                        if "Option order matches" not in evidence_list:
                            evidence_list.append("Option order matches")

            if matched_with_question:
                matched_count += 1
                total_score += best_question_score

        if matched_count > 0:
            avg_score = total_score / len(official_questions) if official_questions else 0
            
            if "Question wording matches" not in evidence_list and matched_count > 0:
                evidence_list.append("Question wording matches")

            candidates_scores.append({
                "paper_version_id": version_id,
                "centre_id": centre_id,
                "similarity_score": round(min(avg_score, 100.0), 2),
                "matched_questions": matched_count,
                "evidence": evidence_list
            })

    # Sort candidates by similarity score descending
    candidates_scores = sorted(candidates_scores, key=lambda x: x["similarity_score"], reverse=True)

    # Abstention Mechanism (Uncertainty Handling)
    if not candidates_scores or candidates_scores[0]["similarity_score"] < 40:
        return {
            "status": "no_match",
            "ranked_candidates": [],
            "explanation": "No reliable match found with the available reference fingerprints.",
            "warnings": ["The leak did not match any stored official paper variants."]
        }
    
    # Check if top candidates are too close (Ambiguity / Insufficient Evidence)
    if len(candidates_scores) > 1 and abs(candidates_scores[0]["similarity_score"] - candidates_scores[1]["similarity_score"]) < 3.0:
        return {
            "status": "ambiguous_match",
            "ranked_candidates": candidates_scores,
            "explanation": "Multiple versions have similar scores. Insufficient distinct evidence to isolate a single source.",
            "warnings": ["Overlapping questions detected across multiple centres."]
        }

    return {
        "status": "possible_match",
        "ranked_candidates": candidates_scores,
        "explanation": f"Version {candidates_scores[0]['paper_version_id']} has the strongest available matching evidence.",
        "warnings": []
    }