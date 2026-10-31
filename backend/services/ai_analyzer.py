"""
AI Space Analysis & Multiple-Future Generator
Synthesizes site spatial characteristics, community deficits, and visual concepts
into 3 actionable transformation futures with phased deployment plans.
"""

import os
from .need_matcher import evaluate_need_fit
from .cost_estimator import generate_cost_breakdown

def generate_three_futures(
    space_title: str,
    location_name: str,
    ward: str,
    area_sqm: float,
    current_condition: str,
    space_type: str,
    primary_community_need: str,
    description: str = "",
    constraints: str = ""
) -> list:
    """
    Produces 3 alternative futures:
    Concept A: Green Infrastructure & Pocket Ecology (Community Garden / Urban Oasis)
    Concept B: Active Social Recreation & Family Play (Inclusive Play Zone / Pocket Park)
    Concept C: Civic Innovation, Knowledge & Youth Gathering (Learning Pavilion & Skill Hub)
    """

    area = max(50.0, float(area_sqm))

    # Evaluate Concept A: Pocket Garden & Pollinator Oasis
    fit_a = evaluate_need_fit("garden", primary_community_need, current_condition, area, ward)
    cost_a = generate_cost_breakdown("garden", area)

    concept_a = {
        "concept_key": "A",
        "title": "Community Pocket Garden & Urban Oasis",
        "concept_type": "garden",
        "tagline": "Micro-urban agriculture, native biodiversity, and shaded communal sanctuary.",
        "description": f"Revitalizes this {area:.0f} m² {current_condition.lower()} with 12 raised timber vegetable and herb beds, perimeter native pollinator shrubs, permeable gravel pathways, and a timber pergola with solar fairy lighting. Built with drought-resilient drip irrigation.",
        "fit_score": fit_a["score"],
        "fit_reason": f"{fit_a['verdict']} Matches local demand for vegetation and biodiversity.",
        "estimated_cost_inr": cost_a["total_capex_inr"],
        "cost_band": cost_a["cost_band"],
        "votes_count": 42,
        "after_image_url": "/assets/after_garden.jpg",
        "environmental_benefit": f"Adds ~{area * 0.65:.0f} m² of permeable green canopy, reduces urban heat island by up to 2.4°C locally, and sequesters ~450 kg CO₂ annually.",
        "community_benefit": f"Supports {round(area * 2.2)} neighborhood residents with fresh herbs, weekend gardening workshops, and a quiet shaded restorative space for senior citizens.",
        "temporary_phase": "Phase 1 (Month 1–4): Deploy 10 movable planter boxes, upcycled pallet seating, and temporary burlap shade sails. Host a community seed-planting kick-off day.",
        "permanent_phase": "Phase 2 (Month 5–12): Install permanent timber pergola, permeable brick paving, rainwater harvesting barrel system, and sensory medicinal herb borders.",
        "maintenance_estimate": f"₹{cost_a['annual_opex_inr']:,}/yr — Managed via Ward Green Volunteer Committee & local resident association."
    }

    # Evaluate Concept B: Inclusive Play Area & Family Recreation
    fit_b = evaluate_need_fit("play", primary_community_need, current_condition, area, ward)
    cost_b = generate_cost_breakdown("play", area)

    concept_b = {
        "concept_key": "B",
        "title": "Inclusive Children's Play & Family Recreation Zone",
        "concept_type": "play",
        "tagline": "Safe, vibrant multi-generational play park with soft safety turf and parent seating.",
        "description": f"Converts the neglected site into an energetic, safe public playground featuring rubberized impact flooring, a wooden nature-slide, sensory tactile wall, swing sets, low artistic mural security fence, and perimeter shade trees with comfortable benches.",
        "fit_score": fit_b["score"],
        "fit_reason": f"{fit_b['verdict']} Provides crucial outdoor recreation for local children within 5-minute walking distance.",
        "estimated_cost_inr": cost_b["total_capex_inr"],
        "cost_band": cost_b["cost_band"],
        "votes_count": 68,
        "after_image_url": "/assets/after_play.jpg",
        "environmental_benefit": "Replaces cracked degraded concrete with safe permeable safety rubber and flowering shrub buffer, enhancing neighborhood stormwater infiltration.",
        "community_benefit": f"Serves approximately {round(area * 3.5)} children and family members daily, promoting physical activity and neighborly connection.",
        "temporary_phase": "Phase 1 (Month 1–3): Surface clearing, installation of pop-up hopscotch floor murals, sandbox corner, and portable beanbag play cushions.",
        "permanent_phase": "Phase 2 (Month 4–10): Poured-in-place safety rubber flooring, certified timber play structures, safety fencing, and evening solar pathway lighting.",
        "maintenance_estimate": f"₹{cost_b['annual_opex_inr']:,}/yr — Weekly equipment safety checks and quarterly rubber surface sanitation."
    }

    # Evaluate Concept C: Community Learning Pavilion & Skill Exchange Hub
    fit_c = evaluate_need_fit("learning", primary_community_need, current_condition, area, ward)
    cost_c = generate_cost_breakdown("learning", area)

    concept_c = {
        "concept_key": "C",
        "title": "Open-Air Learning Pavilion & Skill Exchange Hub",
        "concept_type": "learning",
        "tagline": "Solar-powered community classroom, free book exchange, and digital co-working pergola.",
        "description": f"Constructs an architect-designed open timber pavilion with rooftop solar panels, communal study benches, weatherproof library bookshelves, magnetic whiteboard presentation wall, and high-speed community Wi-Fi hotspot.",
        "fit_score": fit_c["score"],
        "fit_reason": f"{fit_c['verdict']} Fosters local youth education, evening adult literacy, and community planning meetings.",
        "estimated_cost_inr": cost_c["total_capex_inr"],
        "cost_band": cost_c["cost_band"],
        "votes_count": 35,
        "after_image_url": "/assets/after_learning.jpg",
        "environmental_benefit": "Rooftop 3.2 kW solar array provides 100% net-zero off-grid renewable energy for night lighting and laptop/phone charging.",
        "community_benefit": f"Enables evening study for students from congested apartments, community workshops, and weekend artisan flea pop-ups for ~{round(area * 2.8)} beneficiaries.",
        "temporary_phase": "Phase 1 (Month 1–3): Pop-up book cabinet ('Little Free Library'), folding tables, and weekend outdoor tutoring circles.",
        "permanent_phase": "Phase 2 (Month 4–12): Engineered timber pavilion with insulated solar canopy, waterproof cabinets, lockable equipment credenza, and vandal-proof night illumination.",
        "maintenance_estimate": f"₹{cost_c['annual_opex_inr']:,}/yr — Managed jointly by local youth library club and ward council."
    }

    return [concept_a, concept_b, concept_c]
