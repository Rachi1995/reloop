# ReLoop — Smart Reusable Container Return System (PRD)

## Original Problem Statement
Food service (campus canteens, corporate cafeterias, cloud kitchens, food courts) generates
massive single-use packaging waste. Reusable container adoption is low due to the absence of a
structured, automated, incentive-driven return mechanism. ReLoop is a full-stack hardware+software
platform: RFID-tagged reusable containers + a smart IoT return kiosk (RFID + weight verification) +
a cloud platform with refundable deposits, digital wallet, cleaning/recirculation workflow, and
sustainability analytics. Closed loop: REUSE → RETURN → REFUND → CLEAN → REUSE.
Submitted to YESIST12 2026. Aligns with SDG 11, 12, 13.

## Architecture
- **Backend**: FastAPI (single `server.py`), MongoDB (Motor), JWT (PyJWT) + bcrypt auth, Bearer-token based.
  All routes under `/api`. Collections: users, containers, container_transactions, return_verifications,
  cleaning_records, wallet_transactions, settings.
- **Frontend**: React 19 + React Router 7, Tailwind + shadcn/ui, Recharts, framer-motion, sonner toasts.
  Dark emerald "organic fintech" theme (Outfit + Plus Jakarta Sans fonts). AuthContext with localStorage token.
- **IoT Kiosk**: fully simulated in-app (`/kiosk`) per spec — /api/rfid/scan + /api/weight/verify simulate MFRC522 + HX711.

## User Personas
1. **Student** — orders meals in reusable containers, returns them at kiosk, gets ₹30 deposit refunded to wallet.
2. **Canteen Staff** — issues containers, processes returns, manages washing/cleaning queue.
3. **Admin** — manages containers/users, configures deposit & weight tolerance, views analytics.

## Core Requirements (static)
- RFID container lifecycle: Available → Issued → Washing → Ready → Available (+ Lost/Damaged).
- Refundable deposit (default ₹30) held on issue, auto-refunded on verified return.
- Dual verification: RFID identity + load-cell weight within tolerance.
- Cleaning/sanitization workflow and recirculation.
- Sustainability analytics: return rate, disposables avoided, waste/CO₂ avoided, cost saved.

## Implemented (2026-06)
- ✅ JWT auth (register/login/me/logout/refresh), 3 roles, RBAC, seeded demo accounts.
- ✅ Public landing page (hero, circular loop, stats, features, SDG, CTA).
- ✅ Student portal: dashboard, my container, wallet, transactions, return history, profile.
- ✅ Canteen/Admin portal: dashboard (charts), issue, return, containers (CRUD + filters),
  students, transactions, cleaning queue, analytics, settings.
- ✅ Interactive IoT kiosk simulator with full animated return flow + refund.
- ✅ Seeded demo data: 12 containers, 5 students, historical + active transactions, washing queue.
- ✅ Tested: 21/21 backend tests pass; frontend flows verified.

## Backlog / Remaining (prioritized)
- P1: Real payment gateway (UPI/Stripe) for wallet top-up/withdrawal (currently internal wallet only).
- P1: Brute-force lockout on login (playbook feature not yet added).
- P2: Per-student RFID student-ID tap at kiosk (currently container-selection based).
- P2: Multi-location / multi-canteen support and aggregated analytics.
- P2: Weekly/monthly ESG report export (PDF/CSV).
- P3: Split server.py into routers; add container edit UI.

## Demo Accounts
- Admin: admin@reloop.io / Admin@123
- Staff: staff@reloop.io / Staff@123
- Student: arjun@campus.edu / Student@123 (also priya@, rahul@campus.edu)
