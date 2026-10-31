"""
Smart Redevelopment Priority Score Engine
Calculates multi-factor decision-support priority index for urban space revival proposals.
"""

def calculate_priority_score(
    current_condition: str,
    area_sqm: float,
    community_votes: int = 0,
    has_constraints: bool = False,
    primary_need: str = "Green Space & Cooling"
) -> dict:
    """
    Weighted Composite Formula:
    PriorityScore = (NeglectSeverity * 0.25)
                  + (BeneficiaryReach * 0.25)
                  + (CommunityDemand * 0.20)
                  + (EnvironmentalBenefit * 0.15)
                  + (FeasibilityScore * 0.15)
    """

    # 1. Neglect Severity (0 - 100)
    severity_map = {
        "Illegal Dumping Ground": 95,
        "Neglected Plot": 86,
        "Brownfield": 82,
        "Vacant Lot": 72,
        "Underused Paved Area": 60,
        "Roadside Strip": 65
    }
    neglect_score = severity_map.get(current_condition, 75)

    # 2. Beneficiary Reach (0 - 100)
    # Area roughly maps to walking catchment benefit (500m² can serve ~1,200 residents)
    estimated_beneficiaries = round(area_sqm * 2.8)
    if area_sqm >= 800:
        beneficiary_score = 92
    elif area_sqm >= 400:
        beneficiary_score = 84
    elif area_sqm >= 200:
        beneficiary_score = 75
    else:
        beneficiary_score = 62

    # 3. Community Demand & Citizen Engagement (0 - 100)
    # Base baseline is 60, escalates with community votes
    vote_bonus = min(35, community_votes * 3.5)
    demand_score = min(98, 60 + vote_bonus)

    # 4. Potential Environmental Benefits (0 - 100)
    if "Green" in primary_need or "Cooling" in primary_need:
        eco_score = 90
    elif "Rainwater" in primary_need:
        eco_score = 88
    else:
        eco_score = 70

    # 5. Feasibility Score (0 - 100)
    feasibility_score = 85
    if has_constraints:
        feasibility_score -= 15
    if area_sqm > 5000:
        feasibility_score -= 10 # very large plots require extensive clearances

    # Weighted calculation
    composite_score = (
        (neglect_score * 0.25) +
        (beneficiary_score * 0.25) +
        (demand_score * 0.20) +
        (eco_score * 0.15) +
        (feasibility_score * 0.15)
    )

    final_score = round(composite_score, 1)

    if final_score >= 80.0:
        level = "High"
        recommendation = "Top Tier Priority — Candidate for immediate municipal ward funding or CSR grant."
    elif final_score >= 65.0:
        level = "Medium"
        recommendation = "Secondary Priority — Recommended for tactical tactical pop-up pilot while scoping."
    else:
        level = "Low"
        recommendation = "Under Review — Requires further community mobilization or site survey."

    return {
        "score": final_score,
        "level": level,
        "estimated_beneficiaries": estimated_beneficiaries,
        "recommendation": recommendation,
        "factors": {
            "neglect_severity": {"weight": "25%", "score": neglect_score},
            "beneficiary_reach": {"weight": "25%", "score": beneficiary_score, "est_residents": estimated_beneficiaries},
            "community_demand": {"weight": "20%", "score": round(demand_score, 1), "votes": community_votes},
            "environmental_potential": {"weight": "15%", "score": eco_score},
            "feasibility_index": {"weight": "15%", "score": feasibility_score}
        }
    }
