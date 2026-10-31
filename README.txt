# ReCity Platform — AI-Powered Urban Space Revival
SEVA First Innovation Challenge 2026

## Overview
ReCity connects urban vacant space reporting, automated AI spatial generation, community voting, and citizen-led action.

## Quick Start
1. Install dependencies:
   pip install -r requirements.txt
2. Run backend:
   python -m uvicorn backend.main:app --reload --port 8000
3. Open in browser:
   http://127.0.0.1:8000 (or double-click run.bat on Windows)

## Key Features & New Additions
- Smart space reporting with automated AI-assisted multiple-future synthesis.
- Citizen Verification: Upvote ("Still Vacant?") or flag suspicious/inaccurate entries.
- Duplicate Detection: Distance-based Haversine check within 75 meters.
- Mobile-First PWA: Auto-detect GPS, direct rear-camera capture, and installable PWA with offline Service Worker.
- Action Loop: Crowdfunding pledges with goal progress bar and volunteer workday sign-ups.
- Responsive layout overrides ensuring smooth mobile rendering (<=900px) and high z-index floating reporting button.
