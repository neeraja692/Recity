/**
 * frontend/js/community.js - ReCity Community & Mobile-First Extension Module
 * 
 * Implements:
 * 1. Citizen Verification ("still vacant?" confirms and flags)
 * 2. Distance-based Duplicate Detection (Haversine via /api/community/check-duplicates)
 * 3. Mobile-First Reporting (Auto-GPS detection, Camera capture, PWA install)
 * 4. Crowdfunding & Volunteer Sign-Up per Approved Space
 */

(function () {
  'use strict';

  const API_BASE = window.location.origin.includes('http') ? '' : 'http://127.0.0.1:8000';

  // ---------------------------------------------------------------------------
  // 1. Service Worker & PWA Registration
  // ---------------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New ReCity content cached.');
                }
              };
            }
          };
        })
        .catch(err => console.debug('[PWA] Service worker registration note:', err));
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Mobile Floating Action Button (FAB)
  // ---------------------------------------------------------------------------
  function injectFloatingActionButton() {
    if (document.getElementById('floatingReportFab')) return;

    const fab = document.createElement('button');
    fab.id = 'floatingReportFab';
    fab.className = 'fab-report-btn';
    fab.setAttribute('aria-label', 'Report a Neglected Urban Space');
    fab.innerHTML = '📸 <span>Report Space</span>';

    fab.addEventListener('click', () => {
      if (window.App && typeof window.App.navigate === 'function') {
        window.App.navigate('register');
      } else {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        const regSection = document.getElementById('view-register');
        if (regSection) regSection.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(fab);
  }

  // ---------------------------------------------------------------------------
  // 3. Mobile-First Reporting Enhancements (GPS & Direct Camera)
  // ---------------------------------------------------------------------------
  function enhanceRegistrationForm() {
    const form = document.getElementById('spaceRegisterForm');
    if (!form || form.dataset.communityEnhanced) return;
    form.dataset.communityEnhanced = 'true';

    const latInput = document.getElementById('regLatitude');
    const lngInput = document.getElementById('regLongitude');
    const photoInput = document.getElementById('regPhoto');

    // (A) Direct Mobile Camera Capture
    if (photoInput) {
      photoInput.setAttribute('accept', 'image/*');
      photoInput.setAttribute('capture', 'environment'); // Opens rear camera directly on smartphones
    }

    // (B) Auto-Detect GPS Button
    if (latInput && lngInput) {
      const gpsBtn = document.createElement('button');
      gpsBtn.type = 'button';
      gpsBtn.className = 'btn-gps-auto';
      gpsBtn.innerHTML = '📍 Auto-Detect Current GPS';
      gpsBtn.title = 'Uses your device GPS to pinpoint the neglected space';

      gpsBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser.');
          return;
        }

        gpsBtn.disabled = true;
        gpsBtn.innerHTML = '⏳ Pinpointing coordinates...';

        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            latInput.value = lat;
            lngInput.value = lng;
            latInput.dispatchEvent(new Event('input', { bubbles: true }));
            lngInput.dispatchEvent(new Event('input', { bubbles: true }));

            gpsBtn.disabled = false;
            gpsBtn.innerHTML = '✅ GPS Acquired';
            setTimeout(() => { gpsBtn.innerHTML = '📍 Refresh GPS'; }, 3000);

            // Immediately check for duplicate spaces within 75m
            runDuplicateCheck(lat, lng, form);
          },
          err => {
            gpsBtn.disabled = false;
            gpsBtn.innerHTML = '⚠️ GPS Failed (Enter Manually)';
            console.warn('Geolocation failed:', err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const coordsContainer = latInput.closest('.form-row') || latInput.parentElement;
      coordsContainer.parentElement.insertBefore(gpsBtn, coordsContainer);
    }

    // (C) Debounced duplicate detection on manual coordinate entry
    let debounceTimer;
    const onCoordChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const lat = parseFloat(latInput?.value);
        const lng = parseFloat(lngInput?.value);
        if (!isNaN(lat) && !isNaN(lng)) {
          runDuplicateCheck(lat, lng, form);
        }
      }, 600);
    };

    latInput?.addEventListener('input', onCoordChange);
    lngInput?.addEventListener('input', onCoordChange);
  }

  // Duplicate Check Request
  async function runDuplicateCheck(lat, lng, form) {
    let alertBanner = document.getElementById('duplicateAlertBanner');
    if (!alertBanner) {
      alertBanner = document.createElement('div');
      alertBanner.id = 'duplicateAlertBanner';
      alertBanner.className = 'duplicate-alert-banner';
      alertBanner.style.display = 'none';
      form.insertBefore(alertBanner, form.firstChild);
    }

    try {
      const res = await fetch(`${API_BASE}/api/community/check-duplicates?lat=${lat}&lng=${lng}&radius=75`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.count > 0) {
        const nearest = data.duplicates[0];
        alertBanner.style.display = 'flex';
        alertBanner.innerHTML = `
          <div style="font-size:22px;">⚠️</div>
          <div>
            <strong>Potential Duplicate Space Detected!</strong><br>
            An existing report (<strong>${escapeHtml(nearest.title)}</strong>) is located only <strong>${nearest.distance_meters}m</strong> away.
            Please verify if this is the same location before submitting.
          </div>
        `;
      } else {
        alertBanner.style.display = 'none';
      }
    } catch (e) {
      console.warn('Duplicate check could not complete:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Citizen Verification & Action Hub (Space Detail Page)
  // ---------------------------------------------------------------------------
  let currentEnhancedSpaceId = null;

  async function enhanceSpaceDetailPage() {
    const detailSection = document.getElementById('view-space-detail');
    if (!detailSection || !detailSection.classList.contains('active')) return;

    // Get current space ID from App state or DOM
    const spaceId = window.App?.state?.selectedSpace?.id || 1;
    if (currentEnhancedSpaceId === spaceId && document.getElementById('communityVerificationCard')) {
      return;
    }
    currentEnhancedSpaceId = spaceId;

    // Remove any previously rendered community components
    document.getElementById('communityVerificationCard')?.remove();
    document.getElementById('communityActionHubCard')?.remove();

    const anchorContainer = detailSection.querySelector('.card.comments-wrap') || detailSection.lastElementChild;
    if (!anchorContainer) return;

    // (A) Citizen Verification Box
    const verifyCard = document.createElement('div');
    verifyCard.id = 'communityVerificationCard';
    verifyCard.className = 'verification-card';
    verifyCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="font-family:var(--font-title); font-size:17px; font-weight:800; color:var(--text-main); margin-bottom:4px;">
            🛡️ Citizen Verification & Integrity
          </h3>
          <p style="font-size:12.5px; color:var(--text-muted); margin:0;">
            Help the city verify site status. Have you walked past this space recently?
          </p>
        </div>
        <span id="verificationBadge" class="badge-tag" style="background:#f1f5f2; color:var(--text-muted);">
          Checking status...
        </span>
      </div>

      <div class="verification-actions">
        <button id="btnConfirmVacant" class="btn-verify-confirm">
          ✅ Confirm: Still Vacant & Neglected
        </button>
        <button id="btnFlagSpace" class="btn-verify-flag">
          🚩 Flag: Occupied / Inaccurate / Duplicate
        </button>
      </div>

      <div id="verificationStats" style="font-size:12px; color:var(--text-muted);">
        Loading community confirmations...
      </div>
    `;

    anchorContainer.parentElement.insertBefore(verifyCard, anchorContainer);

    // Load and update verification status
    const refreshVerifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/verifications`);
        if (!res.ok) return;
        const data = await res.json();

        const badge = verifyCard.querySelector('#verificationBadge');
        const stats = verifyCard.querySelector('#verificationStats');

        if (data.is_verified) {
          badge.style.background = '#dcfce7';
          badge.style.color = '#15803d';
          badge.innerHTML = '🌟 Community Verified (Authentic)';
        } else if (data.under_review) {
          badge.style.background = '#fee2e2';
          badge.style.color = '#b91c1c';
          badge.innerHTML = '⚠️ Under Moderator Review';
        } else {
          badge.style.background = '#fef3c7';
          badge.style.color = '#92400e';
          badge.innerHTML = '🔍 Verification Pending';
        }

        stats.innerHTML = `<strong>${data.confirmations}</strong> citizen confirmations · <strong>${data.flags}</strong> flags`;
      } catch (e) {
        console.warn('Could not load verifications', e);
      }
    };
    refreshVerifications();

    // Confirm button event
    verifyCard.querySelector('#btnConfirmVacant').onclick = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm' })
        });
        if (res.ok) {
          alert('Thank you! Your citizen verification has been recorded.');
          refreshVerifications();
        }
      } catch (e) {
        alert('Network error while recording verification.');
      }
    };

    // Flag button event
    verifyCard.querySelector('#btnFlagSpace').onclick = async () => {
      const reason = prompt('Please describe why this report should be flagged (e.g. no longer vacant, duplicate entry, already built):');
      if (reason && reason.trim()) {
        try {
          const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'flag', reason: reason.trim() })
          });
          if (res.ok) {
            alert('Thank you! This space has been flagged for municipal administrator review.');
            refreshVerifications();
          }
        } catch (e) {
          alert('Network error while flagging space.');
        }
      }
    };

    // (B) Crowdfunding & Volunteer Action Hub
    const actionCard = document.createElement('div');
    actionCard.id = 'communityActionHubCard';
    actionCard.className = 'action-hub-card';
    actionCard.innerHTML = `
      <div style="margin-bottom:14px;">
        <h3 style="font-family:var(--font-title); font-size:18px; font-weight:800; color:var(--text-main); margin-bottom:4px;">
          🚀 Take Direct Action on This Space
        </h3>
        <p style="font-size:12.5px; color:var(--text-muted); margin:0;">
          Close the loop from report to realization. Support transformation through funding or volunteer labor.
        </p>
      </div>

      <div class="action-tabs">
        <button class="action-tab-btn active" id="tabCrowdfundBtn">💰 Crowdfunding Campaign</button>
        <button class="action-tab-btn" id="tabVolunteerBtn">🤝 Volunteer for Cleanup & Build</button>
      </div>

      <!-- Tab 1: Crowdfunding Content -->
      <div id="tabCrowdfundContent">
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
          <span style="font-size:13px; font-weight:700; color:var(--text-main);" id="pledgeRaisedAmount">Loading pledges...</span>
          <span style="font-size:12px; color:var(--text-muted);">Target: ₹50,000 (Tactical Phase 1)</span>
        </div>
        <div class="funding-progress-track">
          <div class="funding-progress-fill" id="fundingProgressBar" style="width: 0%;"></div>
        </div>

        <form id="pledgeForm" style="display:grid; grid-template-columns: 1fr 1fr 100px auto; gap:10px; margin-top:14px; align-items:center;">
          <input type="text" name="backer_name" placeholder="Your Name" required style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
          <input type="email" name="email" placeholder="Your Email" required style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
          <input type="number" name="amount" placeholder="Amount (₹)" min="10" step="any" required style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
          <button type="submit" id="btnPledgeSubmit" class="btn-primary" style="padding:10px 18px; height:100%;">
            Pledge
          </button>
        </form>
        <div id="pledgeFeedback" style="font-size:12px; margin-top:8px; display:none;"></div>
      </div>

      <!-- Tab 2: Volunteer Content (Non-stalling submit) -->
      <div id="tabVolunteerContent" style="display:none;">
        <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">
          Join the local volunteer brigade for ground preparation, planting, painting, and maintenance workdays.
        </p>

        <form id="volunteerForm" style="display:flex; flex-direction:column; gap:10px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
            <input type="text" name="name" placeholder="Full Name *" required style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
            <input type="email" name="email" placeholder="Email Address *" required style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
            <input type="tel" name="phone" placeholder="Phone Number" style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
          </div>
          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
            <input type="text" name="skills" placeholder="Skills (e.g. Gardening, Painting, Carpentry, Organization)" style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
            <select name="availability" style="padding:9px 12px; border:1px solid var(--border-strong); border-radius:var(--radius-sm);">
              <option value="Weekend Mornings">Weekend Mornings</option>
              <option value="Weekday Evenings">Weekday Evenings</option>
              <option value="Flexible / As Needed">Flexible / As Needed</option>
            </select>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <button type="submit" id="btnVolunteerSubmit" class="btn-primary" style="padding:10px 22px;">
              Register as Volunteer
            </button>
            <span id="volunteerSummaryCount" style="font-size:12px; color:var(--text-muted);"></span>
          </div>
          <div id="volunteerFeedback" style="font-size:12.5px; display:none;"></div>
        </form>
      </div>
    `;

    anchorContainer.parentElement.insertBefore(actionCard, anchorContainer);

    // Tab Switchers
    const tabCrowdfundBtn = actionCard.querySelector('#tabCrowdfundBtn');
    const tabVolunteerBtn = actionCard.querySelector('#tabVolunteerBtn');
    const tabCrowdfundContent = actionCard.querySelector('#tabCrowdfundContent');
    const tabVolunteerContent = actionCard.querySelector('#tabVolunteerContent');

    tabCrowdfundBtn.onclick = () => {
      tabCrowdfundBtn.classList.add('active');
      tabVolunteerBtn.classList.remove('active');
      tabCrowdfundContent.style.display = 'block';
      tabVolunteerContent.style.display = 'none';
    };

    tabVolunteerBtn.onclick = () => {
      tabVolunteerBtn.classList.add('active');
      tabCrowdfundBtn.classList.remove('active');
      tabVolunteerContent.style.display = 'block';
      tabCrowdfundContent.style.display = 'none';
    };

    // Load Pledges
    const loadPledges = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/pledges`);
        if (!res.ok) return;
        const data = await res.json();
        const target = 50000;
        const total = data.total_pledged || 0;
        const pct = Math.min(100, Math.round((total / target) * 100));

        actionCard.querySelector('#pledgeRaisedAmount').textContent =
          `₹${total.toLocaleString()} raised from ${data.backer_count || 0} backer(s) (${pct}%)`;
        actionCard.querySelector('#fundingProgressBar').style.width = `${pct}%`;
      } catch (e) {
        console.warn('Could not load pledges', e);
      }
    };
    loadPledges();

    // Pledge Submit
    const pledgeForm = actionCard.querySelector('#pledgeForm');
    pledgeForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = pledgeForm.querySelector('#btnPledgeSubmit');
      const feedback = actionCard.querySelector('#pledgeFeedback');

      btn.disabled = true;
      btn.textContent = 'Pledging...';

      const payload = {
        backer_name: pledgeForm.backer_name.value.trim(),
        email: pledgeForm.email.value.trim(),
        amount: parseFloat(pledgeForm.amount.value)
      };

      try {
        const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/pledges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          pledgeForm.reset();
          feedback.style.display = 'block';
          feedback.style.color = '#15803d';
          feedback.textContent = '🎉 Thank you! Your pledge has been registered towards revitalization.';
          loadPledges();
        } else {
          const err = await res.json();
          feedback.style.display = 'block';
          feedback.style.color = '#b91c1c';
          feedback.textContent = 'Error: ' + (err.detail || 'Could not record pledge');
        }
      } catch (err) {
        feedback.style.display = 'block';
        feedback.style.color = '#b91c1c';
        feedback.textContent = 'Network error while recording pledge.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Pledge';
      }
    });

    // Load Volunteers Count
    const loadVolunteers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/volunteers`);
        if (!res.ok) return;
        const data = await res.json();
        actionCard.querySelector('#volunteerSummaryCount').textContent =
          `Join ${data.count || 0} registered neighbor(s) volunteering!`;
      } catch (e) {
        console.warn('Could not load volunteers', e);
      }
    };
    loadVolunteers();

    // Volunteer Submit (Guaranteed non-stalling)
    const volunteerForm = actionCard.querySelector('#volunteerForm');
    volunteerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = volunteerForm.querySelector('#btnVolunteerSubmit');
      const feedback = actionCard.querySelector('#volunteerFeedback');

      btn.disabled = true;
      btn.textContent = 'Registering...';
      feedback.style.display = 'none';

      const payload = {
        name: volunteerForm.name.value.trim(),
        email: volunteerForm.email.value.trim(),
        phone: volunteerForm.phone.value.trim() || null,
        skills: volunteerForm.skills.value.trim() || null,
        availability: volunteerForm.availability.value
      };

      try {
        const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/volunteers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          volunteerForm.reset();
          feedback.style.display = 'block';
          feedback.style.color = '#15803d';
          feedback.textContent = '🎉 You are successfully registered! The ward community organizer will contact you before workdays.';
          loadVolunteers();
        } else {
          const err = await res.json();
          feedback.style.display = 'block';
          feedback.style.color = '#b91c1c';
          feedback.textContent = 'Error: ' + (err.detail || 'Could not register volunteer');
        }
      } catch (err) {
        feedback.style.display = 'block';
        feedback.style.color = '#b91c1c';
        feedback.textContent = 'Network error. Please try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Register as Volunteer';
      }
    });
  }

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------------------------------------------------------------------------
  // 5. Lifecycle Initialization
  // ---------------------------------------------------------------------------
  function initializeCommunityExtension() {
    injectFloatingActionButton();
    enhanceRegistrationForm();
    enhanceSpaceDetailPage();

    // Watch for DOM view changes (SPA Navigation)
    const observer = new MutationObserver(() => {
      enhanceRegistrationForm();
      enhanceSpaceDetailPage();
    });

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCommunityExtension);
  } else {
    initializeCommunityExtension();
  }
})();
