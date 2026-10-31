import random
from typing import List, Dict, Any, Optional
from backend.app.modules.paper_generation.fingerprint import build_question_fingerprint_features


class PaperGenerationError(Exception):
    pass


def permute_options(options_dict: Dict[str, str], rng: random.Random) -> Dict[str, Any]:
    """
    Permutes answer options while tracking the mapping back to original keys.
    Returns:
        rendered_options: e.g. {"A": "Option text 2", "B": "Option text 1", ...}
        option_order_map: e.g. {"A": "orig_B", "B": "orig_A", ...}
    """
    orig_keys = sorted(list(options_dict.keys()))
    items = [(k, options_dict[k]) for k in orig_keys]
    
    # Shuffle items with the controlled RNG
    shuffled_items = list(items)
    rng.shuffle(shuffled_items)
    
    rendered_options = {}
    option_order_map = {}
    
    for idx, (orig_key, text) in enumerate(shuffled_items):
        new_key = orig_keys[idx]  # Keep standard letter sequence A, B, C, D...
        rendered_options[new_key] = text
        option_order_map[new_key] = orig_key

    return {
        "rendered_options": rendered_options,
        "option_order_map": option_order_map
    }


def select_question_variant(question: Dict[str, Any], version_index: int, rng: random.Random) -> Dict[str, str]:
    """
    Selects a predefined academically equivalent variant of the question.
    Preserves difficulty and academic meaning while introducing subtle controlled phrasing differences.
    """
    variants = question.get("variants") or []
    
    # If no variants exist, use primary text
    if not variants:
        return {
            "variant_id": "DEFAULT",
            "variant_text": question["primary_text"]
        }
    
    # Pool includes default phrasing + all predefined variants
    pool = [{"variant_id": "DEFAULT", "text": question["primary_text"]}]
    for var in variants:
        pool.append({"variant_id": var["variant_id"], "text": var["text"]})
    
    # Deterministically select variant according to version_index or controlled RNG
    selected = pool[version_index % len(pool)]
    return {
        "variant_id": selected["variant_id"],
        "variant_text": selected["text"]
    }


def balance_question_selection(
    questions: List[Dict[str, Any]],
    target_count: int,
    target_difficulty: Optional[Dict[str, int]] = None,
    rng: Optional[random.Random] = None
) -> List[Dict[str, Any]]:
    """
    Selects questions ensuring target difficulty balance and syllabus representation.
    """
    if rng is None:
        rng = random.Random(42)

    if len(questions) < target_count:
        raise PaperGenerationError(
            f"Not enough questions in bank ({len(questions)}) to generate a paper of {target_count} questions."
        )

    if not target_difficulty:
        # Default distribution: 30% EASY, 50% MEDIUM, 20% HARD
        easy_count = max(1, int(target_count * 0.3))
        hard_count = max(1, int(target_count * 0.2))
        medium_count = target_count - easy_count - hard_count
        target_difficulty = {"EASY": easy_count, "MEDIUM": medium_count, "HARD": hard_count}

    by_difficulty: Dict[str, List[Dict[str, Any]]] = {"EASY": [], "MEDIUM": [], "HARD": []}
    for q in questions:
        diff = q.get("difficulty", "MEDIUM").upper()
        if diff in by_difficulty:
            by_difficulty[diff].append(q)
        else:
            by_difficulty["MEDIUM"].append(q)

    selected: List[Dict[str, Any]] = []
    
    # Select per difficulty
    for diff, needed in target_difficulty.items():
        available = by_difficulty.get(diff, [])
        if len(available) < needed:
            # Fallback gracefully to other questions if pool for this difficulty is small
            needed = min(needed, len(available))
        sample = rng.sample(available, needed)
        selected.extend(sample)

    # If still short of target_count, fill from remaining questions
    if len(selected) < target_count:
        remaining = [q for q in questions if q not in selected]
        shortfall = target_count - len(selected)
        if len(remaining) < shortfall:
            raise PaperGenerationError("Insufficient pool of questions to satisfy target count.")
        selected.extend(rng.sample(remaining, shortfall))

    return selected[:target_count]


def generate_controlled_paper_versions(
    base_questions: List[Dict[str, Any]],
    version_codes: List[str],
    centre_ids: List[str],
    num_questions: int = 10,
    target_difficulty: Optional[Dict[str, int]] = None,
    seed: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Main generator algorithm:
    1. Validates 1:1 mapping between version codes and centre IDs.
    2. Selects a balanced set of questions ensuring equal total marks and identical difficulty distributions.
    3. For each paper version (Set A, Set B, Set C):
       - Assigns version code and centre ID.
       - Permutes question order.
       - Applies predefined academically equivalent variant phrasing.
       - Permutes answer options while tracking option mappings.
       - Generates structured question-level digital fingerprint records.
    """
    if len(version_codes) != len(centre_ids):
        raise PaperGenerationError(
            f"Mismatch between number of version codes ({len(version_codes)}) and centre IDs ({len(centre_ids)})."
        )

    base_rng = random.Random(seed if seed is not None else 100)
    
    # Select common core questions to guarantee exact syllabus, marks and difficulty parity
    selected_core_questions = balance_question_selection(
        questions=base_questions,
        target_count=num_questions,
        target_difficulty=target_difficulty,
        rng=base_rng
    )

    total_marks = sum(q.get("marks", 1) for q in selected_core_questions)
    diff_summary = {}
    for q in selected_core_questions:
        diff = q.get("difficulty", "MEDIUM").upper()
        diff_summary[diff] = diff_summary.get(diff, 0) + 1

    generated_versions = []

    for idx, (ver_code, centre_id) in enumerate(zip(version_codes, centre_ids)):
        # Version-specific RNG derived from base seed + version index
        ver_seed = (seed or 100) + (idx * 37) + 17
        ver_rng = random.Random(ver_seed)

        # 1. Controlled variation: Question ordering permutation
        ordered_questions = list(selected_core_questions)
        ver_rng.shuffle(ordered_questions)

        version_fingerprints = []
        rendered_question_list = []

        for q_pos, q in enumerate(ordered_questions, start=1):
            # 2. Controlled variation: Predefined academically equivalent variant
            variant_info = select_question_variant(q, version_index=idx, rng=ver_rng)
            
            # 3. Controlled variation: Answer-option permutation
            opt_result = permute_options(q["options"], rng=ver_rng)
            
            # 4. Generate structured question-level fingerprint
            q_id = q.get("id") or q.get("code") or f"Q_{q_pos}"
            fp_features = build_question_fingerprint_features(
                question_order=q_pos,
                question_id=q_id,
                question_code=q["code"],
                variant_id=variant_info["variant_id"],
                variant_text=variant_info["variant_text"],
                option_map=opt_result["option_order_map"],
                rendered_options=opt_result["rendered_options"],
                marks=q.get("marks", 1),
                difficulty=q.get("difficulty", "MEDIUM")
            )

            version_fingerprints.append({
                "question_id": q_id,
                "question_code": q["code"],
                "question_order": q_pos,
                "variant_id": variant_info["variant_id"],
                "variant_text": variant_info["variant_text"],
                "option_order": opt_result["option_order_map"],
                "rendered_options": opt_result["rendered_options"],
                "distinguishing_features": fp_features,
                "marks": q.get("marks", 1),
                "difficulty": q.get("difficulty", "MEDIUM")
            })

            rendered_question_list.append({
                "order": q_pos,
                "question_id": q_id,
                "question_code": q["code"],
                "variant_id": variant_info["variant_id"],
                "text": variant_info["variant_text"],
                "options": opt_result["rendered_options"],
                "marks": q.get("marks", 1),
                "difficulty": q.get("difficulty", "MEDIUM")
            })

        generated_versions.append({
            "version_code": ver_code,
            "centre_id": centre_id,
            "total_marks": total_marks,
            "total_questions": len(rendered_question_list),
            "difficulty_summary": diff_summary,
            "fingerprints": version_fingerprints,
            "rendered_questions": rendered_question_list
        })

    return generated_versions
