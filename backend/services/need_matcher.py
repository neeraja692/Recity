"""
Community Need Matching Engine
Calculates transparent match scores between urban space characteristics,
neighborhood deficits, and proposed reuse concepts.
"""

def evaluate_need_fit(concept_type: str, primary_need: str, condition: str, area_sqm: float, ward: str) -> dict:
    base_score = 65
    breakdown = []

    # 1. Primary Need Alignment
    need_alignment_map = {
        "garden": ["Green Space & Cooling", "Rainwater Retention", "Waste Reduction & Composting"],
        "play": ["Children Play Area", "Active Recreation & Sports", "Youth & Family Spaces"],
        "learning": ["Community Learning & Skill Center", "Public Seating & Seniors", "Digital & Book Exchange"],
        "rain_garden": ["Rainwater Retention", "Green Space & Cooling"],
        "market": ["Community Market & Artisan Kiosks", "Public Seating & Seniors"]
    }

    matching_needs = need_alignment_map.get(concept_type, [])
    if primary_need in matching_needs:
        bonus = 22
        base_score += bonus
        breakdown.append(f"+{bonus} pts: Direct alignment with reported neighborhood priority ('{primary_need}')")
    else:
        breakdown.append("+0 pts: Indirect match with primary neighborhood priority")

    # 2. Site Area Suitability
    if concept_type == "garden":
        if 80 <= area_sqm <= 1500:
            base_score += 8
            breakdown.append(f"+8 pts: Site area ({area_sqm} m²) is optimal for pocket garden and planting beds")
        else:
            base_score -= 5
            breakdown.append(f"-5 pts: Area ({area_sqm} m²) requires layout adjustments for community garden")
    elif concept_type == "play":
        if 150 <= area_sqm <= 2500:
            base_score += 9
            breakdown.append(f"+9 pts: Site area ({area_sqm} m²) offers safe buffer zone for play equipment")
        else:
            base_score -= 6
            breakdown.append(f"-6 pts: Area ({area_sqm} m²) is constrained for multi-age play zones")
    elif concept_type == "learning":
        if 100 <= area_sqm <= 1200:
            base_score += 7
            breakdown.append(f"+7 pts: Site area ({area_sqm} m²) fits modular study pergola & workshop shelter")

    # 3. Current Condition Synergy
    if "Neglected" in condition or "Dumping" in condition:
        if concept_type in ["garden", "play"]:
            base_score += 6
            breakdown.append(f"+6 pts: Transformation from neglected state yields high community revitalization dividend")
    elif "Paved" in condition:
        if concept_type in ["learning", "play"]:
            base_score += 5
            breakdown.append(f"+5 pts: Existing paved sub-base reduces initial civil foundation expense")

    # Cap between 50 and 96
    final_score = max(52, min(96, round(base_score)))

    # Qualitative explanation
    if final_score >= 85:
        verdict = "Exceptional Match — Addresses critical local deficit with optimal site suitability."
    elif final_score >= 70:
        verdict = "Strong Alternative — Feasible community intervention with tangible public benefits."
    else:
        verdict = "Moderate Alternative — Requires targeted community interest and phased budget alignment."

    return {
        "score": final_score,
        "verdict": verdict,
        "breakdown": breakdown
    }
