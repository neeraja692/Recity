"""
Preliminary Cost Estimator Engine
Generates transparent, itemized preliminary cost projections,
comparing permanent capital redevelopment vs temporary tactical phases.
"""

def generate_cost_breakdown(concept_type: str, area_sqm: float) -> dict:
    area = max(50.0, float(area_sqm))

    # Base cost rates per square meter (in INR)
    rates = {
        "garden": {
            "clearing_per_sqm": 80,
            "paving_per_sqm": 220,
            "greenery_per_sqm": 280,
            "structure_base": 65000, # Pergola & tool shed
            "amenities_base": 35000, # Benches, compost bins, signage
            "solar_lighting": 28000
        },
        "play": {
            "clearing_per_sqm": 90,
            "paving_per_sqm": 420, # Safety rubber flooring + gravel
            "greenery_per_sqm": 160, # Lawn perimeter & hedge
            "structure_base": 140000, # Slide, swings, sensory climbing frames
            "amenities_base": 45000, # Enclosure safety fence, parent seating
            "solar_lighting": 32000
        },
        "learning": {
            "clearing_per_sqm": 70,
            "paving_per_sqm": 350, # Compact stone paving
            "greenery_per_sqm": 120, # Surrounding planters
            "structure_base": 160000, # Solar-roof timber pavilion & tables
            "amenities_base": 50000, # Outdoor waterproof library shelves, whiteboard
            "solar_lighting": 40000
        },
        "rain_garden": {
            "clearing_per_sqm": 95,
            "paving_per_sqm": 180,
            "greenery_per_sqm": 310, # Wetland native flora & bioswales
            "structure_base": 55000, # Overflow weir & sediment trap
            "amenities_base": 25000,
            "solar_lighting": 20000
        }
    }

    config = rates.get(concept_type, rates["garden"])

    clearing_cost = round(area * config["clearing_per_sqm"])
    paving_cost = round(area * 0.45 * config["paving_per_sqm"])
    greenery_cost = round(area * 0.55 * config["greenery_per_sqm"])
    structures_cost = round(config["structure_base"] * (1.0 + (area / 1000.0) * 0.4))
    amenities_cost = round(config["amenities_base"] * (1.0 + (area / 1200.0) * 0.3))
    lighting_cost = round(config["solar_lighting"])

    subtotal = (
        clearing_cost +
        paving_cost +
        greenery_cost +
        structures_cost +
        amenities_cost +
        lighting_cost
    )

    contingency = round(subtotal * 0.10) # 10% contingency
    total_permanent_cost = subtotal + contingency

    # Temporary Tactical Urbanism Phase (Months 1-6)
    # Movable planters, pallet seating, pop-up shade sails, community painting
    temporary_tactical_cost = round(total_permanent_cost * 0.18)

    # Annual Operating Maintenance (OpEx)
    annual_maintenance = round(total_permanent_cost * 0.065)

    # Cost Band
    if total_permanent_cost < 200000:
        cost_band = "Low"
    elif total_permanent_cost < 600000:
        cost_band = "Medium"
    else:
        cost_band = "High"

    items = [
        {"item": "Site Clearance, Debris Removal & Grading", "amount_inr": clearing_cost, "share_pct": round(clearing_cost/total_permanent_cost*100, 1)},
        {"item": "Walkways, Ground Prep & Permeable Surfacing", "amount_inr": paving_cost, "share_pct": round(paving_cost/total_permanent_cost*100, 1)},
        {"item": "Primary Architectural / Play / Pavilion Structure", "amount_inr": structures_cost, "share_pct": round(structures_cost/total_permanent_cost*100, 1)},
        {"item": "Lush Native Planting, Soil Prep & Irrigation", "amount_inr": greenery_cost, "share_pct": round(greenery_cost/total_permanent_cost*100, 1)},
        {"item": "Community Amenities (Seating, Bins, Fencing)", "amount_inr": amenities_cost, "share_pct": round(amenities_cost/total_permanent_cost*100, 1)},
        {"item": "Solar-Powered Outdoor Lighting & Signage", "amount_inr": lighting_cost, "share_pct": round(lighting_cost/total_permanent_cost*100, 1)},
        {"item": "Design, Permitting & Unforeseen Contingency (10%)", "amount_inr": contingency, "share_pct": 10.0}
    ]

    return {
        "total_capex_inr": total_permanent_cost,
        "total_capex_formatted": f"₹{total_permanent_cost:,.0f}",
        "cost_band": cost_band,
        "temporary_tactical_cost_inr": temporary_tactical_cost,
        "temporary_tactical_formatted": f"₹{temporary_tactical_cost:,.0f}",
        "annual_opex_inr": annual_maintenance,
        "annual_opex_formatted": f"₹{annual_maintenance:,.0f}/year",
        "items": items,
        "disclaimer": "Preliminary decision-support estimate based on standard public works unit schedules. Final engineering validation required prior to contractor bidding."
    }
