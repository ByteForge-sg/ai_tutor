# WHY — AI Mistake Coach
> *Students don't just need more questions. They need to understand WHY they keep getting questions wrong.*
> *Other platforms tell you what you got wrong. WHY helps you understand why you keep getting it wrong.*

An AI-powered JEE & NEET preparation platform engineered around a closed cognitive feedback loop:

```
QUESTION → ATTEMPT → FEEDBACK → MISTAKE → PATTERN → INTERVENTION → REATTEMPT → IMPROVEMENT
```

---

## 🚀 Single URL Architecture

The entire platform runs through a unified localhost link:

$$\mathbf{http://localhost:3000}$$

* **Frontend**: Next.js 16 (App Router + Turbopack), React 19, TypeScript, Vanilla Tailwind CSS, Lucide icons, Recharts.
* **Backend**: FastAPI, Python 3.13, SQLite with WAL (Write-Ahead Logging) mode, Uvicorn on port `8080`.
* **Zero-CORS Proxy**: Next.js automatically rewrites `/api/*` to `http://localhost:8080/*`, allowing end-to-end functionality through port 3000.

---

## 🎨 Visual Identity & UI (Synaptix Obsidian / Violet Cyberpunk)

- **Color Palette**: Deep obsidian canvas (`#07050E`), electric purple/violet gradients (`#7C3AED`, `#8B5CF6`, `#A855F7`), and neon cyan accents (`#06B6D4`).
- **Glassmorphism**: Glass-frosted cards with subtle borders (`rgba(255,255,255,0.08)`), glowing active pills, and backdrop blur.
- **Radial Speedometer Gauge**: AI Confidence Index with 38 radial tick segments, central score, and 4-tier colored metrics.
- **Sparkline KPI Cards**: 4 core metric cards with glowing SVG neon sparklines (Volume, Output, Precision, Models).
- **GitHub-Style Contribution Grid**: 6-month continuous activity matrix with glowing violet intensity tiers.

---

## 🔑 Key Features Implemented

1. **Google OAuth & Dedicated Login Screen (`/login`)**
   - 1-Click Google Sign-In with official Google branding.
   - 1-Click Instant Demo Profiles: **Aditya Sharma (JEE)** & **Ananya Patel (NEET)**.
   - Custom Gmail authentication with persistent session storage.

2. **The Signature "WHY YOU GOT THIS WRONG" Experience (`/practice`)**
   - For every incorrect answer, the platform triggers an immediate reasoning diagnosis.
   - Structured 9-category mistake taxonomy:
     - `CONCEPTUAL_MISUNDERSTANDING`
     - `FORMULA_RECALL`
     - `CALCULATION_ERROR`
     - `WRONG_APPROACH`
     - `MISREAD_QUESTION`
     - `DIAGRAM_INTERPRETATION`
     - `CARELESS_MISTAKE`
     - `TIME_PRESSURE`
     - `MEMORY_ERROR`
   - Validated JSON diagnosis payload containing Confidence %, Diagnosis, Concept Gap, Actionable Rule, and a 1-click **[Fix This Weakness]** CTA.

3. **Controlled Fullscreen Exam Environment (`/tests` & `/exam/[id]`)**
   - Simulates actual NTA / JEE CBT testing software.
   - Server-side deadline timer (refreshing does NOT reset exam time).
   - 4-state question palette (Unvisited, Answered, Marked, Answered + Marked).
   - Browser integrity tracking: tab switches, window blur, and fullscreen exits.
   - Strict Live Exam Mode: AI Coach strictly locked during active tests.

4. **"Fix This Weakness" — 5-Step Adaptive Intervention (`/weaknesses`)**
   - Step 1: Concept Refresher (theory & formula sheet).
   - Step 2: Worked Example (archetype step-by-step resolution).
   - Step 3: Similar Question (targeted transfer problem).
   - Step 4: Practice Set (2 consolidation questions).
   - Step 5: Challenge Question (higher difficulty test).
   - Real calculated **Before vs After accuracy** (e.g., 47.3% → 75.0%) saved to the student's profile.

5. **Official PYQs Catalog (`/pyqs`)**
   - Authentic JEE and NEET questions filtered by subject and examination year (2022–2024).

---

## 🏃 Quick Start Guide

### 1. Start Backend (Port 8080)
```bash
cd backend
source ../venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload --reload-dir app
```

### 2. Start Frontend (Port 3000)
```bash
cd frontend
npm run dev -- -p 3000
```

Open **http://localhost:3000** in your browser.
