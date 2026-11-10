/**
 * ReCity API Client
 * Seamlessly interfaces with FastAPI backend with smart offline/fallback caching.
 */

const API_BASE = window.location.origin.includes("http") ? "" : "http://127.0.0.1:8000";

const Api = {
  // Test if backend is reachable
  async isOnline() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/city-stats`, { method: "HEAD", signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 1. Fetch Spaces
  async getSpaces(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/spaces?${qs}`);
      if (!res.ok) throw new Error("Backend response error");
      return await res.json();
    } catch (err) {
      console.warn("Backend unavailable, using local mock data:", err);
      return MockData.getSpaces(params);
    }
  },

  // 2. Fetch Single Space with Proposals & Comments
  async getSpace(id) {
    try {
      const res = await fetch(`${API_BASE}/api/spaces/${id}`);
      if (!res.ok) throw new Error("Backend response error");
      return await res.json();
    } catch (err) {
      console.warn("Using local mock space:", err);
      return MockData.getSpace(id);
    }
  },

  // 3. Register New Space (FormData with photo)
  async createSpace(formData) {
    try {
      const res = await fetch(`${API_BASE}/api/spaces`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Failed to register space on server");
      return await res.json();
    } catch (err) {
      console.warn("Using offline mock registration:", err);
      return MockData.createSpace(formData);
    }
  },

  // 4. Cast Community Vote for Proposal
  async voteProposal(proposalId) {
    try {
      const res = await fetch(`${API_BASE}/api/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to register vote");
      return await res.json();
    } catch (err) {
      return MockData.voteProposal(proposalId);
    }
  },

  // 5. Add Resident Comment
  async addComment(spaceId, commentData) {
    try {
      const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData)
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return await res.json();
    } catch (err) {
      return MockData.addComment(spaceId, commentData);
    }
  },

  // 6. Fetch Citywide Impact Statistics
  async getCityStats() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/city-stats`);
      if (!res.ok) throw new Error("Failed to load statistics");
      return await res.json();
    } catch (err) {
      return MockData.getCityStats();
    }
  },

  // 7. Fetch Priority Ranking Leaderboard
  async getPriorityRanking() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/priority-ranking`);
      if (!res.ok) throw new Error("Failed to load priority ranking");
      return await res.json();
    } catch (err) {
      return MockData.getPriorityRanking();
    }
  },

  // 8. Admin Status Update
  async updateStatus(spaceId, status, actor, notes) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/spaces/${spaceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, actor, notes })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    } catch (err) {
      return MockData.updateStatus(spaceId, status);
    }
  },

  // 9. Fetch Itemized Cost Breakdown
  async getCostBreakdown(proposalId) {
    try {
      const res = await fetch(`${API_BASE}/api/proposals/${proposalId}/cost-breakdown`);
      if (!res.ok) throw new Error("Failed to fetch cost breakdown");
      return await res.json();
    } catch (err) {
      return MockData.getCostBreakdown(proposalId);
    }
  },

  // 10. Fetch Priority Score Factors
  async getPriorityFactors(spaceId) {
    try {
      const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/priority-factors`);
      if (!res.ok) throw new Error("Failed to fetch priority factors");
      return await res.json();
    } catch (err) {
      return MockData.getPriorityFactors(spaceId);
    }
  },

  // 11. Export Official Redevelopment Dossier
  async exportProposalDossier(spaceId) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/spaces/${spaceId}/export-proposal`);
      if (!res.ok) throw new Error("Failed to export proposal dossier");
      return await res.json();
    } catch (err) {
      return MockData.exportProposalDossier(spaceId);
    }
  }
};

// Resilient In-Memory / Local Storage Fallback if opened directly via file://
const MockData = {
  _spaces: [
    {
      id: 1,
      title: "Andheri Link Road Under-Metro Dead Space",
      location_name: "Below Metro Line 2A Pillars 180-184, Near D.N. Nagar",
      ward: "K/W Ward - Andheri West, Mumbai",
      latitude: 19.1254,
      longitude: 72.8362,
      area_sqm: 520.0,
      current_condition: "Neglected Plot",
      space_type: "Corner Lot",
      primary_community_need: "Green Space & Cooling",
      image_url: "assets/before_plot.jpg",
      description: "Unused plot with broken concrete, accumulated litter, and weeds. High footfall from neighboring residential buildings.",
      constraints: "Check underground drainage line; preserve mature roadside tree.",
      status: "Community Voting",
      priority_score: 84.5,
      priority_level: "High",
      proposals: [
        {
          id: 101,
          concept_key: "A",
          title: "Community Pocket Garden & Urban Oasis",
          concept_type: "garden",
          tagline: "Micro-urban agriculture, native biodiversity, and shaded communal sanctuary.",
          description: "Revitalizes this 520 m² plot with 12 raised timber vegetable and herb beds, permeable gravel walkways, and a timber pergola with solar fairy lighting.",
          fit_score: 94,
          fit_reason: "Exceptional Match — Addresses critical local deficit with optimal site suitability.",
          estimated_cost_inr: 285000,
          cost_band: "Medium",
          votes_count: 52,
          after_image_url: "assets/after_garden.jpg",
          environmental_benefit: "Adds ~340 m² permeable canopy, reduces urban heat island by up to 2.4°C locally, and sequesters ~450 kg CO₂/yr.",
          community_benefit: "Supports 1,140 neighborhood residents with fresh herbs, weekend workshops, and morning walking benches.",
          temporary_phase: "Phase 1 (Months 1–4): Deploy 10 movable planter boxes, upcycled pallet seating, and temporary burlap shade sails.",
          permanent_phase: "Phase 2 (Months 5–12): Install permanent timber pergola, permeable brick paving, and rainwater harvesting barrels.",
          maintenance_estimate: "₹18,500/year — Managed via Ward Green Volunteer Committee."
        },
        {
          id: 102,
          concept_key: "B",
          title: "Inclusive Children's Play & Family Recreation Zone",
          concept_type: "play",
          tagline: "Safe, vibrant multi-generational play park with soft safety turf and parent seating.",
          description: "Converts the plot into an energetic public playground featuring rubberized impact flooring, a wooden nature-slide, sensory tactile wall, and swing sets.",
          fit_score: 86,
          fit_reason: "Strong Alternative — Crucial recreation within 5-minute walking distance of 4 schools.",
          estimated_cost_inr: 410000,
          cost_band: "Medium",
          votes_count: 78,
          after_image_url: "assets/after_play.jpg",
          environmental_benefit: "Replaces cracked degraded concrete with safe permeable safety rubber and flowering shrub buffer.",
          community_benefit: "Serves approximately 1,820 children and family members daily, promoting physical activity and neighborly connection.",
          temporary_phase: "Phase 1 (Months 1–3): Surface clearing, installation of pop-up hopscotch floor murals, sandbox corner, and portable beanbags.",
          permanent_phase: "Phase 2 (Months 4–10): Poured-in-place safety rubber flooring, certified timber play structures, safety fencing, and evening solar lighting.",
          maintenance_estimate: "₹26,000/year — Weekly equipment safety checks and quarterly sanitation."
        },
        {
          id: 103,
          concept_key: "C",
          title: "Open-Air Learning Pavilion & Skill Exchange Hub",
          concept_type: "learning",
          tagline: "Solar-powered community classroom, free book exchange, and digital co-working pergola.",
          description: "Constructs an open timber pavilion with rooftop solar panels, communal study benches, weatherproof library bookshelves, and magnetic whiteboard wall.",
          fit_score: 79,
          fit_reason: "Strong Alternative — Fosters youth education, adult literacy, and community planning meetings.",
          estimated_cost_inr: 360000,
          cost_band: "Medium",
          votes_count: 41,
          after_image_url: "assets/after_learning.jpg",
          environmental_benefit: "Rooftop 3.2 kW solar array provides 100% net-zero off-grid renewable energy for night lighting and laptop charging.",
          community_benefit: "Enables quiet evening study for students from congested apartments and weekend artisan flea pop-ups.",
          temporary_phase: "Phase 1 (Months 1–3): Pop-up book cabinet ('Little Free Library'), folding tables, and weekend outdoor tutoring circles.",
          permanent_phase: "Phase 2 (Months 4–12): Engineered timber pavilion with insulated solar canopy, waterproof cabinets, and vandal-proof night illumination.",
          maintenance_estimate: "₹22,000/year — Managed jointly by local youth library club and ward council."
        }
      ],
      comments: [
        { id: 1, author_name: "Priya Sharma", author_role: "Local Resident", comment_text: "Our children desperately need Concept B play area! Right now there is no safe spot away from traffic.", likes: 18 },
        { id: 2, author_name: "Ramesh Kulkarni", author_role: "Senior Citizen Committee", comment_text: "Concept A pocket garden with benches would be a blessing for morning walks. Please ensure good lighting.", likes: 11 }
      ]
    },
    {
      id: 2,
      title: "FC Road Deccan Gymkhana Neglected Municipal Corner",
      location_name: "Corner of Fergusson College Road & Goodluck Chowk Lane",
      ward: "Zone 3 (Ghole Road) - Deccan Gymkhana, Pune",
      latitude: 18.5186,
      longitude: 73.8415,
      area_sqm: 340.0,
      current_condition: "Underused Paved Area",
      space_type: "Paved Plaza",
      primary_community_need: "Public Seating & Seniors",
      image_url: "assets/before_plot.jpg",
      description: "Concrete paved dead-space currently occupied by parked handcarts and temporary debris. Close to senior residential colonies.",
      constraints: "Maintain 3m emergency vehicle clear corridor to market rear entrance.",
      status: "Feasibility Study",
      priority_score: 76.2,
      priority_level: "High",
      proposals: [],
      comments: []
    },
    {
      id: 3,
      title: "Dharavi Mithi Riverbank Buffer Strip",
      location_name: "Adjacent to 90ft Road Culvert, Dharavi",
      ward: "G/N Ward - Dharavi, Mumbai",
      latitude: 19.0435,
      longitude: 72.8567,
      area_sqm: 260.0,
      current_condition: "Illegal Dumping Ground",
      space_type: "Roadside Strip",
      primary_community_need: "Rainwater Retention",
      image_url: "assets/before_plot.jpg",
      description: "Chronic roadside dumping stretch that causes monsoon waterlogging and foul odor. Potential bioswale candidate.",
      constraints: "Requires soil testing for heavy metals and culvert edge safety rail.",
      status: "Under Review",
      priority_score: 79.8,
      priority_level: "High",
      proposals: [],
      comments: []
    },
    {
      id: 4,
      title: "Panchavati Godavari Ghat Community Reserve Ground",
      location_name: "Near Ramkund Approach Road, Panchavati",
      ward: "Panchavati Division - Nashik",
      latitude: 19.9975,
      longitude: 73.7898,
      area_sqm: 480.0,
      current_condition: "Vacant Lot",
      space_type: "Open Ground",
      primary_community_need: "Children Play Area",
      image_url: "assets/before_plot.jpg",
      description: "Fenced empty government-allocated reserve plot. Lacks grass or amenities; children currently play on the busy road.",
      constraints: "Require child safety buffer setback and night-time lockable perimeter.",
      status: "Approved for Pilot",
      priority_score: 82.0,
      priority_level: "High",
      proposals: [],
      comments: []
    },
    {
      id: 5,
      title: "Sitabuldi Market Underutilized Civic Plaza",
      location_name: "Behind Sitabuldi Main Road Wholesale Market Gate 3",
      ward: "K/W Ward - Andheri West, Mumbai",
      latitude: 21.1466,
      longitude: 79.0882,
      area_sqm: 620.0,
      current_condition: "Underused Paved Area",
      space_type: "Under-Flyover",
      primary_community_need: "Community Learning & Skill Center",
      image_url: "assets/before_plot.jpg",
      description: "Shaded concrete space below elevated metro track. Well-protected from rain but poorly lit and neglected at night.",
      constraints: "Adhere to Metro Rail transit safety clearance; non-combustible materials only.",
      status: "Community Voting",
      priority_score: 74.0,
      priority_level: "Medium",
      proposals: [],
      comments: []
    }
  ],

  getSpaces(params = {}) {
    let list = [...this._spaces];
    if (params.ward) list = list.filter(s => s.ward === params.ward);
    if (params.condition) list = list.filter(s => s.current_condition === params.condition);
    if (params.need) list = list.filter(s => s.primary_community_need === params.need);
    return list;
  },

  getSpace(id) {
    return this._spaces.find(s => s.id === Number(id)) || this._spaces[0];
  },

  createSpace(formData) {
    const title = formData.get("title") || "New Community Site";
    const area = Number(formData.get("area_sqm")) || 350;
    const s = {
      id: Date.now(),
      title,
      location_name: formData.get("location_name") || "Ward 12",
      ward: formData.get("ward") || "K/W Ward - Andheri West, Mumbai",
      latitude: 19.1254 + (Math.random() - 0.5) * 0.04,
      longitude: 72.8362 + (Math.random() - 0.5) * 0.04,
      area_sqm: area,
      current_condition: formData.get("current_condition") || "Neglected Plot",
      space_type: formData.get("space_type") || "Open Ground",
      primary_community_need: formData.get("primary_community_need") || "Green Space & Cooling",
      image_url: "assets/before_plot.jpg",
      description: formData.get("description") || "",
      constraints: formData.get("constraints") || "Check boundary clearances.",
      status: "Community Voting",
      priority_score: 81.0,
      priority_level: "High",
      proposals: this._spaces[0].proposals,
      comments: []
    };
    this._spaces.unshift(s);
    return s;
  },

  voteProposal(proposalId) {
    for (let s of this._spaces) {
      if (s.proposals) {
        let p = s.proposals.find(x => x.id === Number(proposalId));
        if (p) {
          p.votes_count += 1;
          return { success: true, message: `Vote recorded for ${p.title}!`, proposal_id: p.id, new_votes: p.votes_count };
        }
      }
    }
    return { success: true, message: "Vote recorded!" };
  },

  addComment(spaceId, commentData) {
    const s = this.getSpace(spaceId);
    const c = {
      id: Date.now(),
      author_name: commentData.author_name || "Resident",
      author_role: commentData.author_role || "Local Resident",
      comment_text: commentData.comment_text,
      likes: 0
    };
    if (!s.comments) s.comments = [];
    s.comments.unshift(c);
    return c;
  },

  getCityStats() {
    return {
      overview: {
        total_spaces: 5,
        total_area_sqm: 2220.0,
        total_proposals: 15,
        total_votes: 726,
        total_comments: 10,
        total_beneficiaries: 6216,
        green_canopy_sqm: 312,
        co2_offset_tonnes_yr: 0.3,
        avg_fit_score: 82.2
      },
      wards: [
        { ward: "K/W Ward - Andheri West, Mumbai", spaces: 2, area_sqm: 1140, votes: 340 },
        { ward: "Zone 3 (Ghole Road) - Deccan Gymkhana, Pune", spaces: 1, area_sqm: 340, votes: 120 },
        { ward: "G/N Ward - Dharavi, Mumbai", spaces: 1, area_sqm: 260, votes: 98 },
        { ward: "Panchavati Division - Nashik", spaces: 1, area_sqm: 480, votes: 168 }
      ],
      conditions: [
        { label: "Neglected Plot", count: 1 },
        { label: "Underused Paved Area", count: 2 },
        { label: "Illegal Dumping Ground", count: 1 },
        { label: "Vacant Lot", count: 1 }
      ],
      needs: [
        { label: "Green Space & Cooling", count: 1 },
        { label: "Children Play Area", count: 1 },
        { label: "Public Seating & Seniors", count: 1 },
        { label: "Rainwater Retention", count: 1 },
        { label: "Community Learning & Skill Center", count: 1 }
      ]
    };
  },

  getPriorityRanking() {
    return this._spaces.map((s, idx) => ({
      rank: idx + 1,
      id: s.id,
      title: s.title,
      location: s.location_name,
      ward: s.ward,
      area_sqm: s.area_sqm,
      priority_score: s.priority_score,
      priority_level: s.priority_level,
      status: s.status,
      total_votes: 145,
      leading_proposal: "Community Pocket Garden",
      leading_votes: 78
    }));
  },

  updateStatus(spaceId, status) {
    const s = this.getSpace(spaceId);
    s.status = status;
    return { success: true, new_status: status };
  },

  getCostBreakdown(proposalId) {
    return {
      proposal_title: "Community Pocket Garden & Urban Oasis",
      space_area_sqm: 520,
      cost_data: {
        total_capex_inr: 285000,
        total_capex_formatted: "₹2,85,000",
        cost_band: "Medium",
        temporary_tactical_cost_inr: 51300,
        temporary_tactical_formatted: "₹51,300",
        annual_opex_inr: 18525,
        annual_opex_formatted: "₹18,525/year",
        items: [
          { item: "Site Clearance & Debris Removal", amount_inr: 41600, share_pct: 14.6 },
          { item: "Permeable Gravel Paths & Walkway Hardscaping", amount_inr: 51480, share_pct: 18.1 },
          { item: "Timber Pergola & Seed Tool Cabinet", amount_inr: 78000, share_pct: 27.4 },
          { item: "Lush Native Plants, Vegetables & Drip Irrigation", amount_inr: 64000, share_pct: 22.5 },
          { item: "Park Benches, Compost Bins & Signage", amount_inr: 25000, share_pct: 8.8 },
          { item: "Solar-Powered Pathway Fairy Lights", amount_inr: 25000, share_pct: 8.8 }
        ],
        disclaimer: "Preliminary planning estimate. Validate with structural and civil bill of quantities."
      }
    };
  },

  getPriorityFactors(spaceId) {
    return {
      space_title: "Andheri Link Road Under-Metro Dead Space",
      priority_score: 84.5,
      priority_level: "High",
      recommendation: "Top Tier Priority — Candidate for immediate municipal ward funding or CSR grant.",
      factors: {
        neglect_severity: { weight: "25%", score: 86 },
        beneficiary_reach: { weight: "25%", score: 84, est_residents: 1456 },
        community_demand: { weight: "20%", score: 88.5, votes: 171 },
        environmental_potential: { weight: "15%", score: 90 },
        feasibility_index: { weight: "15%", score: 85 }
      }
    };
  },

  exportProposalDossier(spaceId) {
    const s = this.getSpace(spaceId);
    return {
      metadata: {
        dossier_id: `RECITY-2026-W12-00${s.id}`,
        generated_date: "November 2026",
        system: "ReCity AI Urban Revival Platform",
        challenge: "SEVA First Innovation Challenge 2026"
      },
      site_summary: {
        name: s.title,
        location: s.location_name,
        ward: s.ward,
        coordinates: "19.1254° N, 72.8362° E",
        plot_area: `${s.area_sqm} m²`,
        current_condition: s.current_condition,
        space_type: s.space_type,
        identified_need: s.primary_community_need,
        status: s.status,
        constraints: s.constraints,
        before_image: s.image_url
      },
      priority_decision_support: {
        score: s.priority_score,
        tier: s.priority_level,
        estimated_beneficiaries: Math.round(s.area_sqm * 2.8),
        official_recommendation: "Top Tier Priority — Candidate for immediate municipal ward revitalization.",
        factor_weights: {
          neglect_severity: { weight: "25%", score: 86 },
          beneficiary_reach: { weight: "25%", score: 84 },
          community_demand: { weight: "20%", score: 88.5 },
          environmental_potential: { weight: "15%", score: 90 },
          feasibility_index: { weight: "15%", score: 85 }
        }
      },
      leading_community_choice: {
        concept_key: "A",
        title: "Community Pocket Garden & Urban Oasis",
        tagline: "Micro-urban agriculture, native biodiversity, and shaded communal sanctuary.",
        fit_score: "94/100",
        community_votes: 78,
        vote_share_pct: 46.2,
        after_image: "assets/after_garden.jpg",
        environmental_impact: "Adds 340 m² permeable canopy, reduces urban heat island by up to 2.4°C locally.",
        social_dividend: "Supports 1,140 neighborhood residents with fresh herbs and morning walking benches.",
        temporary_phase_1: "Phase 1 (Months 1–4): Deploy 10 movable planter boxes and pallet seating.",
        permanent_phase_2: "Phase 2 (Months 5–12): Install permanent timber pergola and rainwater harvesting."
      },
      financial_feasibility: {
        total_capex_formatted: "₹2,85,000",
        temporary_tactical_formatted: "₹51,300",
        annual_opex_formatted: "₹18,525/year",
        items: [
          { item: "Site Clearance & Debris Removal", amount_inr: 41600, share_pct: 14.6 },
          { item: "Permeable Hardscaping", amount_inr: 51480, share_pct: 18.1 },
          { item: "Timber Pergola & Seed Tool Cabinet", amount_inr: 78000, share_pct: 27.4 },
          { item: "Planting & Irrigation", amount_inr: 64000, share_pct: 22.5 },
          { item: "Solar-Powered Pathway Fairy Lights", amount_inr: 25000, share_pct: 8.8 }
        ]
      },
      disclaimer: "This document is an AI-assisted community decision-support brief prepared for municipal review."
    };
  }
};
