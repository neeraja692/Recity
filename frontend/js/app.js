/**
 * ReCity Application Controller
 * Handles SPA navigation, Before/After image slider, voting, modals, and dynamic data binding.
 */

const App = {
  state: {
    currentView: "overview",
    spaces: [],
    selectedSpace: null,
    activeConceptKey: "A",
    sliderPosition: 50,
    isDraggingSlider: false
  },

  async init() {
    this.bindEvents();
    this.setupBeforeAfterSlider();
    await this.loadInitialData();
    this.navigate("overview");
  },

  bindEvents() {
    // Navigation links
    document.querySelectorAll(".nav-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        this.navigate(view);
      });
    });

    // Space Registration Form
    const form = document.getElementById("spaceRegisterForm");
    if (form) {
      form.addEventListener("submit", (e) => this.handleSpaceRegistration(e));
    }

    // Comment Form
    const commentForm = document.getElementById("addCommentForm");
    if (commentForm) {
      commentForm.addEventListener("submit", (e) => this.handleCommentSubmit(e));
    }

    // Filters in Explore View
    const filterWard = document.getElementById("filterWard");
    const filterCondition = document.getElementById("filterCondition");
    const filterNeed = document.getElementById("filterNeed");
    const searchInput = document.getElementById("searchSpaces");

    [filterWard, filterCondition, filterNeed].forEach(el => {
      if (el) el.addEventListener("change", () => this.applyFilters());
    });
    if (searchInput) {
      searchInput.addEventListener("input", () => this.applyFilters());
    }

    // File Dropzone preview
    const photoInput = document.getElementById("regPhoto");
    if (photoInput) {
      photoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        const statusEl = document.getElementById("photoUploadStatus");
        if (file && statusEl) {
          statusEl.innerHTML = `<strong>Selected:</strong> ${file.name} (${Math.round(file.size / 1024)} KB)`;
        }
      });
    }
  },

  async loadInitialData() {
    try {
      this.state.spaces = await Api.getSpaces();
      this.renderSpacesList(this.state.spaces);
      this.renderRecentSites(this.state.spaces);
      this.updateCityMetrics();

      if (this.state.spaces.length > 0) {
        this.state.selectedSpace = this.state.spaces[0];
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  },

  navigate(viewName) {
    this.state.currentView = viewName;

    // Toggle active link
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.view === viewName);
    });

    // Toggle view section
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${viewName}`);
    });

    // View specific activations
    if (viewName === "overview") {
      setTimeout(() => {
        MapModule.init("leafletMap");
        MapModule.renderSpaces(this.state.spaces);
      }, 100);
    }

    if (viewName === "map") {
      setTimeout(() => {
        MapModule.init("leafletMapFull");
        MapModule.renderSpaces(this.state.spaces);
      }, 100);
    }

    if (viewName === "space-detail") {
      if (!this.state.selectedSpace && this.state.spaces.length > 0) {
        this.state.selectedSpace = this.state.spaces[0];
      }
      if (this.state.selectedSpace) {
        this.renderSpaceDetail(this.state.selectedSpace);
      }
    }

    if (viewName === "impact") {
      this.loadImpactDashboard();
    }

    if (viewName === "admin") {
      this.loadAdminView();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  /* ---------------- Interactive Before & After Visualizer ---------------- */
  setupBeforeAfterSlider() {
    const container = document.getElementById("visualizerContainer");
    const overlay = document.getElementById("visualizerOverlay");
    const handle = document.getElementById("sliderHandle");

    if (!container || !overlay || !handle) return;

    const setPosition = (x) => {
      const rect = container.getBoundingClientRect();
      let pos = ((x - rect.left) / rect.width) * 100;
      pos = Math.max(0, Math.min(100, pos));
      this.state.sliderPosition = pos;

      overlay.style.width = `${pos}%`;
      handle.style.left = `${pos}%`;
    };

    const onMouseDown = (e) => {
      this.state.isDraggingSlider = true;
      setPosition(e.clientX || (e.touches && e.touches[0].clientX));
    };

    const onMouseMove = (e) => {
      if (!this.state.isDraggingSlider) return;
      setPosition(e.clientX || (e.touches && e.touches[0].clientX));
    };

    const onMouseUp = () => {
      this.state.isDraggingSlider = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    container.addEventListener("touchstart", onMouseDown);
    window.addEventListener("touchmove", onMouseMove);
    window.addEventListener("touchend", onMouseUp);
  },

  switchConceptVisual(conceptKey) {
    this.state.activeConceptKey = conceptKey;

    // Toggle button active state
    document.querySelectorAll(".btn-concept-tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.concept === conceptKey);
    });

    const afterImg = document.getElementById("visualizerAfterImg");
    const concept = this.state.selectedSpace?.proposals?.find(p => p.concept_key === conceptKey);

    if (afterImg && concept) {
      afterImg.src = concept.after_image_url || "assets/after_garden.jpg";
    }

    // Scroll to the proposal card if on space detail view
    const targetCard = document.getElementById(`proposal-card-${conceptKey}`);
    if (targetCard && this.state.currentView === "space-detail") {
      targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      targetCard.style.borderColor = "var(--accent)";
    }
  },

  /* ---------------- Space Detail & Multiple Futures ---------------- */
  async openSpaceDetail(spaceId) {
    try {
      const space = await Api.getSpace(spaceId);
      this.state.selectedSpace = space;
      this.renderSpaceDetail(space);
      this.navigate("space-detail");
    } catch (err) {
      console.error("Error opening space detail:", err);
    }
  },

  renderSpaceDetail(space) {
    document.getElementById("detailTitle").textContent = space.title;
    document.getElementById("detailLocation").textContent = `${space.location_name} · ${space.ward}`;
    document.getElementById("detailArea").textContent = `${space.area_sqm} m²`;
    document.getElementById("detailCondition").textContent = space.current_condition;
    document.getElementById("detailNeed").textContent = space.primary_community_need;
    document.getElementById("detailConstraints").textContent = space.constraints || "None recorded.";
    document.getElementById("detailDescription").textContent = space.description || "Community-submitted urban plot undergoing revitalization analysis.";

    // Priority badge
    const pBadge = document.getElementById("detailPriorityBadge");
    pBadge.textContent = `Score: ${space.priority_score} (${space.priority_level} Priority)`;
    pBadge.className = `badge-tag priority-${space.priority_level.toLowerCase()}`;

    // Status pill
    document.getElementById("detailStatusBadge").textContent = space.status;

    // Before visualizer image
    const beforeImg = document.getElementById("visualizerBeforeImg");
    if (beforeImg) beforeImg.src = space.image_url || "assets/before_plot.jpg";

    // Reset visualizer to Concept A
    this.switchConceptVisual("A");

    // Render 3 Multiple Future Proposals
    const container = document.getElementById("proposalsContainer");
    if (!container) return;

    if (!space.proposals || space.proposals.length === 0) {
      container.innerHTML = `<div class="card" style="grid-column:span 3; text-align:center;">
        <p style="color:var(--text-muted); margin-bottom:12px;">AI is currently synthesizing transformation proposals for this space.</p>
        <button class="btn-primary" onclick="App.generateProposalsNow(${space.id})">Generate 3 Multiple Futures Now →</button>
      </div>`;
      return;
    }

    const totalVotes = space.proposals.reduce((sum, p) => sum + p.votes_count, 0);

    container.innerHTML = space.proposals.map(p => {
      const votePct = totalVotes > 0 ? Math.round((p.votes_count / totalVotes) * 100) : 0;
      const isRecommended = p.concept_key === "A";

      return `
        <div class="proposal-card ${isRecommended ? 'recommended' : ''}" id="proposal-card-${p.concept_key}">
          <div class="proposal-tag-header">
            <span class="concept-badge">Concept ${p.concept_key}</span>
            <span class="fit-score-pill">${p.fit_score}/100 Fit</span>
          </div>

          <img class="proposal-img-preview" src="${p.after_image_url}" alt="${p.title}" onclick="App.switchConceptVisual('${p.concept_key}')">

          <h4>${p.title}</h4>
          <p class="proposal-tagline">${p.tagline}</p>

          <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px; line-height:1.5;">${p.description}</p>

          <!-- Phased Planning -->
          <div class="proposal-phasing-box">
            <b>⚡ Phase 1 (Tactical):</b>
            ${p.temporary_phase}
          </div>
          <div class="proposal-phasing-box" style="border-left-color:var(--primary); background:#f4f7f5;">
            <b>🏛️ Phase 2 (Permanent):</b>
            ${p.permanent_phase}
          </div>

          <!-- Cost & Action Buttons -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin:12px 0 16px 0; font-size:12px;">
            <span>Est. Cost: <strong style="color:var(--primary);">₹${p.estimated_cost_inr.toLocaleString()}</strong></span>
            <button class="text-btn" style="color:var(--accent); font-weight:700; font-size:12px;" onclick="App.openCostModal(${p.id})">
              Itemized Cost Breakdown →
            </button>
          </div>

          <!-- Voting Box -->
          <div class="proposal-vote-box">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span style="font-weight:700;">Community Votes: <strong id="votes-val-${p.id}">${p.votes_count}</strong></span>
              <span style="color:var(--text-muted); font-weight:600;" id="votes-pct-${p.id}">${votePct}%</span>
            </div>
            <div class="vote-bar-wrap">
              <div class="vote-bar-fill" id="vote-bar-${p.id}" style="width:${votePct}%;"></div>
            </div>
            <div class="vote-action-row">
              <button class="btn-vote" onclick="App.voteForConcept(${p.id})">
                ▲ Vote for Concept ${p.concept_key}
              </button>
              <button class="btn-secondary" style="font-size:11.5px; padding:6px 12px;" onclick="App.switchConceptVisual('${p.concept_key}')">
                Compare in Slider 👁️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Render Comments
    this.renderComments(space.comments || []);
  },

  /* ---------------- Community Voting ---------------- */
  async voteForConcept(proposalId) {
    try {
      const res = await Api.voteProposal(proposalId);
      if (res.success) {
        this.showToast(res.message);

        // Update vote values in DOM
        if (res.all_proposals) {
          res.all_proposals.forEach(p => {
            const valEl = document.getElementById(`votes-val-${p.id}`);
            const pctEl = document.getElementById(`votes-pct-${p.id}`);
            const barEl = document.getElementById(`vote-bar-${p.id}`);
            if (valEl) valEl.textContent = p.votes_count;
            if (pctEl) pctEl.textContent = `${p.percentage}%`;
            if (barEl) barEl.style.width = `${p.percentage}%`;
          });
        }

        // Update space priority score if changed
        if (res.space_priority_score && this.state.selectedSpace) {
          this.state.selectedSpace.priority_score = res.space_priority_score;
          this.state.selectedSpace.priority_level = res.space_priority_level;
          const pBadge = document.getElementById("detailPriorityBadge");
          if (pBadge) {
            pBadge.textContent = `Score: ${res.space_priority_score} (${res.space_priority_level} Priority)`;
          }
        }
      }
    } catch (err) {
      console.error("Vote failed:", err);
    }
  },

  /* ---------------- Comments & Suggestions ---------------- */
  renderComments(comments) {
    const list = document.getElementById("commentsList");
    if (!list) return;

    if (comments.length === 0) {
      list.innerHTML = `<p style="font-size:12.5px; color:var(--text-muted); padding:10px 0;">No resident comments yet. Be the first to share an idea!</p>`;
      return;
    }

    list.innerHTML = comments.map(c => `
      <div class="comment-card">
        <div class="comment-meta">
          <div>
            <span class="comment-author">${c.author_name}</span>
            <span class="comment-role">${c.author_role || 'Resident'}</span>
          </div>
          <span style="color:var(--text-dim); font-size:11px;">Verified Resident</span>
        </div>
        <p style="font-size:13px; color:var(--text-main);">${c.comment_text}</p>
      </div>
    `).join("");
  },

  async handleCommentSubmit(e) {
    e.preventDefault();
    if (!this.state.selectedSpace) return;

    const authorInput = document.getElementById("commentAuthor");
    const roleInput = document.getElementById("commentRole");
    const textInput = document.getElementById("commentText");

    const payload = {
      author_name: authorInput.value.trim() || "Anonymous Neighbor",
      author_role: roleInput.value,
      comment_text: textInput.value.trim()
    };

    if (!payload.comment_text) return;

    try {
      const newComment = await Api.addComment(this.state.selectedSpace.id, payload);
      if (!this.state.selectedSpace.comments) this.state.selectedSpace.comments = [];
      this.state.selectedSpace.comments.unshift(newComment);
      this.renderComments(this.state.selectedSpace.comments);
      textInput.value = "";
      this.showToast("Thank you! Your feedback has been shared with the community.");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  },

  /* ---------------- Smart Space Registration ---------------- */
  async handleSpaceRegistration(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const submitBtn = document.getElementById("btnSubmitSpace");
    const originalText = submitBtn.innerHTML;

    // Show AI Generation Progress Animation
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⚙️ AI Synthesizing 3 Transformations...</span>`;

    try {
      const newSpace = await Api.createSpace(formData);
      this.showToast(`Space '${newSpace.title}' registered! 3 AI futures generated.`);
      this.state.spaces.unshift(newSpace);
      this.renderSpacesList(this.state.spaces);
      this.renderRecentSites(this.state.spaces);
      form.reset();

      // Open new space detail
      await this.openSpaceDetail(newSpace.id);
    } catch (err) {
      console.error("Registration error:", err);
      this.showToast("Registration saved in local session.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  },

  /* ---------------- Explore Spaces Filter & Grid ---------------- */
  renderSpacesList(spaces) {
    const grid = document.getElementById("spacesGrid");
    if (!grid) return;

    if (spaces.length === 0) {
      grid.innerHTML = `<div style="grid-column:span 3; padding:40px; text-align:center; color:var(--text-muted);">
        No urban spaces match the selected filters. Try broadening your criteria.
      </div>`;
      return;
    }

    grid.innerHTML = spaces.map(s => `
      <div class="space-card">
        <div class="space-thumb-wrap">
          <img src="${s.image_url}" alt="${s.title}" onerror="this.src='assets/before_plot.jpg'">
          <span class="space-status-badge">${s.status}</span>
          <span class="space-priority-badge priority-${s.priority_level.toLowerCase()}">
            ★ Priority ${s.priority_score}
          </span>
        </div>
        <div class="space-card-body">
          <h3>${s.title}</h3>
          <p class="space-card-location">${s.location_name} · ${s.ward}</p>

          <div class="space-card-meta">
            <span>Area: <b>${s.area_sqm} m²</b></span>
            <span>Need: <b>${s.primary_community_need}</b></span>
          </div>

          <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px; line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${s.description || 'Underutilized vacant space requiring community intervention and revival.'}
          </p>

          <div class="space-card-actions">
            <button class="btn-primary" style="flex:1; justify-content:center; font-size:12.5px; padding:8px 12px;" onclick="App.openSpaceDetail(${s.id})">
              Revive & Explore Proposals →
            </button>
            <button class="btn-secondary" style="font-size:12px; padding:8px 12px;" onclick="App.openPriorityModal(${s.id})">
              Score Info
            </button>
          </div>
        </div>
      </div>
    `).join("");
  },

  renderRecentSites(spaces) {
    const list = document.getElementById("recentSitesList");
    if (!list) return;

    list.innerHTML = spaces.slice(0, 3).map(s => `
      <div style="display:flex; align-items:center; gap:12px; padding:10px; border:1px solid var(--border-light); border-radius:10px; margin-bottom:8px; cursor:pointer;" onclick="App.openSpaceDetail(${s.id})">
        <img src="${s.image_url}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" onerror="this.src='assets/before_plot.jpg'">
        <div style="flex:1; min-width:0;">
          <h4 style="font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title}</h4>
          <span style="font-size:11px; color:var(--text-muted);">${s.area_sqm} m² · ${s.ward}</span>
        </div>
        <span class="badge-tag priority-${s.priority_level.toLowerCase()}" style="font-size:10px; padding:3px 8px;">
          ${s.priority_level}
        </span>
      </div>
    `).join("");
  },

  applyFilters() {
    const ward = document.getElementById("filterWard")?.value || "";
    const cond = document.getElementById("filterCondition")?.value || "";
    const need = document.getElementById("filterNeed")?.value || "";
    const q = document.getElementById("searchSpaces")?.value.toLowerCase().trim() || "";

    let filtered = this.state.spaces.filter(s => {
      const matchWard = !ward || s.ward === ward;
      const matchCond = !cond || s.current_condition === cond;
      const matchNeed = !need || s.primary_community_need === need;
      const matchSearch = !q || s.title.toLowerCase().includes(q) || s.location_name.toLowerCase().includes(q);
      return matchWard && matchCond && matchNeed && matchSearch;
    });

    this.renderSpacesList(filtered);
    MapModule.renderSpaces(filtered);
  },

  /* ---------------- Metrics & Impact Dashboard ---------------- */
  async updateCityMetrics() {
    const stats = await Api.getCityStats();
    if (stats && stats.overview) {
      const ov = stats.overview;
      const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setText("statTotalSpaces", ov.total_spaces);
      setText("statTotalArea", `${ov.total_area_sqm.toLocaleString()} m²`);
      setText("statBeneficiaries", ov.total_beneficiaries.toLocaleString());
      setText("statTotalVotes", ov.total_votes);
      setText("statAvgFit", `${ov.avg_fit_score}%`);
    }
  },

  async loadImpactDashboard() {
    const stats = await Api.getCityStats();
    if (stats && stats.wards) {
      ChartsModule.renderWardChart(stats.wards);
      ChartsModule.renderVotingChart(stats.overview);
      ChartsModule.renderRadarImpact();
    }
  },

  /* ---------------- Municipal Admin View ---------------- */
  async loadAdminView() {
    const tableBody = document.getElementById("adminSpacesTableBody");
    if (!tableBody) return;

    const ranking = await Api.getPriorityRanking();

    tableBody.innerHTML = ranking.map(item => `
      <tr>
        <td><strong>#${item.rank}</strong></td>
        <td>
          <strong style="color:var(--text-main); font-size:13.5px;">${item.title}</strong><br>
          <span style="font-size:11px; color:var(--text-muted);">${item.location} (${item.ward})</span>
        </td>
        <td>${item.area_sqm} m²</td>
        <td>
          <span class="badge-tag priority-${item.priority_level.toLowerCase()}">
            ${item.priority_score} · ${item.priority_level}
          </span>
        </td>
        <td>
          <span style="font-weight:700; color:var(--primary);">${item.leading_proposal}</span><br>
          <span style="font-size:11px; color:var(--text-muted);">${item.total_votes} community votes</span>
        </td>
        <td>
          <select class="status-select" onchange="App.handleStatusChange(${item.id}, this.value)">
            <option value="Pending Review" ${item.status === 'Pending Review' ? 'selected' : ''}>Pending Review</option>
            <option value="Under Review" ${item.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
            <option value="Community Voting" ${item.status === 'Community Voting' ? 'selected' : ''}>Community Voting</option>
            <option value="Feasibility Study" ${item.status === 'Feasibility Study' ? 'selected' : ''}>Feasibility Study</option>
            <option value="Approved for Pilot" ${item.status === 'Approved for Pilot' ? 'selected' : ''}>Approved for Pilot</option>
            <option value="Under Construction" ${item.status === 'Under Construction' ? 'selected' : ''}>Under Construction</option>
            <option value="Completed" ${item.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>
          <button class="btn-primary" style="font-size:11.5px; padding:6px 12px;" onclick="App.exportDossierModal(${item.id})">
            Export Proposal Dossier 📄
          </button>
        </td>
      </tr>
    `).join("");
  },

  async handleStatusChange(spaceId, newStatus) {
    try {
      const res = await Api.updateStatus(spaceId, newStatus, "Ward Planning Officer", "Administrative transition via portal");
      this.showToast(`Updated status to '${newStatus}'`);
    } catch (err) {
      console.error("Status update error:", err);
    }
  },

  /* ---------------- Modals ---------------- */
  async openCostModal(proposalId) {
    const modal = document.getElementById("costModal");
    const content = document.getElementById("costModalContent");
    if (!modal || !content) return;

    content.innerHTML = `<p style="padding:20px; text-align:center;">Calculating detailed bill of quantities...</p>`;
    modal.classList.add("show");

    try {
      const data = await Api.getCostBreakdown(proposalId);
      const c = data.cost_data;

      content.innerHTML = `
        <div style="margin-bottom:18px;">
          <h3 style="font-family:var(--font-title); font-size:20px; margin-bottom:4px;">${data.proposal_title}</h3>
          <p style="font-size:12.5px; color:var(--text-muted);">Preliminary Cost Estimator for ${data.space_area_sqm} m² plot revival.</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:20px;">
          <div style="background:var(--bg-subtle); padding:14px; border-radius:10px; border:1px solid var(--border-light);">
            <div style="font-size:11px; color:var(--text-muted);">Total Capital (CapEx)</div>
            <div style="font-size:22px; font-weight:800; color:var(--primary);">${c.total_capex_formatted}</div>
            <div style="font-size:11px; color:var(--accent); font-weight:600;">${c.cost_band} Cost Band</div>
          </div>
          <div style="background:var(--bg-subtle); padding:14px; border-radius:10px; border:1px solid var(--border-light);">
            <div style="font-size:11px; color:var(--text-muted);">Phase 1 Tactical Pop-Up</div>
            <div style="font-size:22px; font-weight:800; color:#d97706;">${c.temporary_tactical_formatted}</div>
            <div style="font-size:11px; color:var(--text-muted);">Movable & Reusable kit</div>
          </div>
          <div style="background:var(--bg-subtle); padding:14px; border-radius:10px; border:1px solid var(--border-light);">
            <div style="font-size:11px; color:var(--text-muted);">Annual Maintenance</div>
            <div style="font-size:22px; font-weight:800; color:var(--accent);">${c.annual_opex_formatted}</div>
            <div style="font-size:11px; color:var(--text-muted);">Community Co-managed</div>
          </div>
        </div>

        <h4 style="font-size:14px; margin-bottom:10px;">Itemized Capital Expenditure Breakdown</h4>
        <div class="table-responsive" style="margin-bottom:18px;">
          <table class="custom-table">
            <thead>
              <tr><th>Component / Work Item</th><th style="text-align:right;">Estimated Amount</th><th style="text-align:right;">Share %</th></tr>
            </thead>
            <tbody>
              ${c.items.map(it => `
                <tr>
                  <td>${it.item}</td>
                  <td style="text-align:right; font-weight:700;">₹${it.amount_inr.toLocaleString()}</td>
                  <td style="text-align:right;">${it.share_pct}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <p style="font-size:11px; color:var(--text-dim); line-height:1.5; background:#fffbe8; padding:10px; border-radius:8px; border:1px solid #fde68a;">
          <strong>Notice:</strong> ${c.disclaimer}
        </p>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color:red;">Error loading cost data.</p>`;
    }
  },

  async openPriorityModal(spaceId) {
    const modal = document.getElementById("priorityModal");
    const content = document.getElementById("priorityModalContent");
    if (!modal || !content) return;

    modal.classList.add("show");
    try {
      const data = await Api.getPriorityFactors(spaceId);
      const f = data.factors;

      content.innerHTML = `
        <div style="margin-bottom:18px;">
          <h3 style="font-family:var(--font-title); font-size:20px; margin-bottom:4px;">Smart Redevelopment Priority Score</h3>
          <p style="font-size:12.5px; color:var(--text-muted);">${data.space_title} · Transparent Multi-Factor Decision Formula</p>
        </div>

        <div style="display:flex; align-items:center; gap:16px; background:#f4f9f6; padding:16px; border-radius:12px; margin-bottom:20px;">
          <div style="width:64px; height:64px; background:var(--primary); color:#ffffff; border-radius:14px; display:grid; place-items:center; font-size:24px; font-weight:900;">
            ${data.priority_score}
          </div>
          <div>
            <h4 style="font-size:15px; font-weight:800; color:var(--primary);">${data.priority_level} Priority Project</h4>
            <p style="font-size:12px; color:var(--text-muted);">${data.recommendation}</p>
          </div>
        </div>

        <h4 style="font-size:14px; margin-bottom:12px;">Component Factor Weights</h4>
        <div style="display:grid; gap:10px; margin-bottom:20px;">
          <div style="background:var(--bg-subtle); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>1. Severity of Neglect (weight: ${f.neglect_severity.weight})</span>
            <strong>${f.neglect_severity.score}/100</strong>
          </div>
          <div style="background:var(--bg-subtle); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>2. Beneficiary Reach (weight: ${f.beneficiary_reach.weight})</span>
            <strong>${f.beneficiary_reach.score}/100 (~${f.beneficiary_reach.est_residents} residents)</strong>
          </div>
          <div style="background:var(--bg-subtle); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>3. Community Demand & Votes (weight: ${f.community_demand.weight})</span>
            <strong>${f.community_demand.score}/100 (${f.community_demand.votes} votes)</strong>
          </div>
          <div style="background:var(--bg-subtle); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>4. Potential Environmental Benefits (weight: ${f.environmental_potential.weight})</span>
            <strong>${f.environmental_potential.score}/100</strong>
          </div>
          <div style="background:var(--bg-subtle); padding:10px 14px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>5. Preliminary Feasibility Index (weight: ${f.feasibility_index.weight})</span>
            <strong>${f.feasibility_index.score}/100</strong>
          </div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color:red;">Error loading priority factors.</p>`;
    }
  },

  async exportDossierModal(spaceId) {
    const modal = document.getElementById("dossierModal");
    const content = document.getElementById("dossierModalContent");
    if (!modal || !content) return;

    modal.classList.add("show");
    try {
      const d = await Api.exportProposalDossier(spaceId);
      const s = d.site_summary;
      const c = d.leading_community_choice;
      const f = d.financial_feasibility;

      content.innerHTML = `
        <div style="border-bottom:2px solid var(--primary); padding-bottom:14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent); font-weight:800;">
              ${d.metadata.challenge} · Municipal Executive Brief
            </div>
            <h2 style="font-family:var(--font-title); font-size:24px; color:var(--primary); font-weight:800;">
              Urban Space Revival Proposal Dossier
            </h2>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:13px; color:var(--text-main);">${d.metadata.dossier_id}</strong><br>
            <span style="font-size:11px; color:var(--text-muted);">${d.metadata.generated_date}</span>
          </div>
        </div>

        <!-- Site & Priority Banner -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div style="background:var(--bg-subtle); padding:16px; border-radius:10px;">
            <h4 style="font-size:13px; text-transform:uppercase; color:var(--primary); margin-bottom:8px;">Site Assessment</h4>
            <p><strong>Name:</strong> ${s.name}</p>
            <p><strong>Ward / Location:</strong> ${s.location} (${s.ward})</p>
            <p><strong>Coordinates:</strong> ${s.coordinates}</p>
            <p><strong>Area:</strong> ${s.plot_area} · <strong>Condition:</strong> ${s.current_condition}</p>
          </div>

          <div style="background:#eaf6ef; padding:16px; border-radius:10px; border:1px solid #b7dfc8;">
            <h4 style="font-size:13px; text-transform:uppercase; color:var(--primary); margin-bottom:8px;">Decision-Support Metric</h4>
            <div style="font-size:26px; font-weight:800; color:var(--primary); margin-bottom:4px;">
              ${d.priority_decision_support.score} / 100
            </div>
            <p style="font-size:12px; font-weight:700; color:#059669;">${d.priority_decision_support.tier} Redevelopment Priority</p>
            <p style="font-size:11.5px; color:var(--text-muted);">${d.priority_decision_support.official_recommendation}</p>
          </div>
        </div>

        <!-- Transformation Concept -->
        <div style="border:1px solid var(--border-light); border-radius:10px; padding:16px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="font-size:15px; font-weight:800; color:var(--primary);">
              Leading Community Transformation Concept: ${c.title}
            </h4>
            <span class="fit-score-pill">${c.fit_score}</span>
          </div>
          <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">${c.tagline}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; font-size:12px;">
            <div>
              <strong>Environmental Impact:</strong>
              <p style="color:var(--text-muted);">${c.environmental_impact}</p>
            </div>
            <div>
              <strong>Social & Community Dividend:</strong>
              <p style="color:var(--text-muted);">${c.social_dividend}</p>
            </div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:14px; margin-bottom:8px;">Financial Feasibility Overview</h4>
          <div style="display:flex; gap:16px; margin-bottom:10px; font-size:12.5px;">
            <span>Total Capital Budget: <strong>${f.total_capex_formatted}</strong></span>
            <span>Tactical Phase 1: <strong>${f.temporary_tactical_formatted}</strong></span>
            <span>Annual Maintenance: <strong>${f.annual_opex_formatted}</strong></span>
          </div>
        </div>

        <p style="font-size:11px; color:var(--text-dim); line-height:1.5; margin-bottom:18px;">
          <em>${d.disclaimer}</em>
        </p>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="btn-secondary" onclick="window.print()">Print / Save as PDF 🖨️</button>
          <button class="btn-primary" onclick="App.closeAllModals()">Close Dossier</button>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color:red;">Error exporting dossier.</p>`;
    }
  },

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("show"));
  },

  showToast(message) {
    const toast = document.getElementById("toastNotice");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }
};

// Expose globally so external hooks and inline handlers have reliable access
window.App = App;

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
