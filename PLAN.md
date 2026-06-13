# CricFit — Execution Plan

**Version:** 0.2  
**Status:** In Progress  
**PRD Reference:** PRD.md

---

## Tech Stack Decisions

| Concern | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo (bare workflow) | Cross-platform; bare workflow needed for native modules |
| Language | TypeScript | Type safety across DB schema, inference output, navigation |
| Navigation | React Navigation v6 | Industry standard, well-supported with Expo |
| UI Library | NativeWind (Tailwind for RN) | Utility-first, fast to build, easy to maintain |
| Local DB | expo-sqlite + Drizzle ORM | Expo-native SQLite with type-safe query builder |
| Charts | Victory Native | Works well with RN, supports line/bar/pie/donut |
| TFLite | react-native-fast-tflite | Best-maintained TFLite bridge for RN, supports GPU delegate |
| Model | MoveNet Thunder (TFLite) | 17-keypoint pose detection, ~12MB, runs on-device |
| Frame extraction | expo-video-thumbnails | Replaced deprecated ffmpeg-kit-react-native |
| Video/Image picker | expo-image-picker | Gallery access, works on iOS + Android |
| Voice input | @react-native-voice/voice | STT for mindset notes field |

> **Note:** Downgraded from Expo 56 → Expo 54 for Expo Go compatibility during development.

---

## Folder Structure

```
cricfit/
├── app/                        # React Navigation screens
│   ├── index.tsx               # Mode selector (home)
│   ├── tracker/
│   │   ├── dashboard.tsx
│   │   ├── log-innings.tsx
│   │   └── history.tsx
│   └── analyzer/
│       ├── upload.tsx
│       ├── processing.tsx
│       └── result.tsx
├── src/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── client.ts           # DB init + drizzle instance
│   │   └── queries.ts          # All DB query functions
│   ├── ai/
│   │   ├── movenet.ts          # MoveNet inference wrapper
│   │   ├── keypoints.ts        # Keypoint types and helpers
│   │   ├── classifier.ts       # Rule-based shot classification
│   │   └── scorer.ts           # Technique aspect scoring
│   ├── components/             # Shared UI components
│   ├── hooks/                  # Custom hooks
│   └── types/                  # Shared TypeScript types
├── assets/
│   └── models/
│       └── movenet_thunder.tflite
├── PRD.md
└── PLAN.md
```

---

## Database Schema

### `innings` table
```
id              INTEGER PRIMARY KEY
date            TEXT (ISO date)
format          TEXT (T20 | ODI | Test | Club)
opponent        TEXT
venue           TEXT
result          TEXT (Won | Lost | Draw | No Result)
score_at_entry  INTEGER
wickets_at_entry INTEGER
scenario        TEXT (Chasing | Setting)
runs_required   INTEGER (nullable, only when chasing)
runs_scored     INTEGER
balls_faced     INTEGER
fours           INTEGER
sixes           INTEGER
strike_rate     REAL (computed on insert)
dismissal       TEXT (Bowled | Caught | LBW | Run Out | Stumped | Hit Wicket | Not Out | Retired)
mindset         TEXT (Confident | Neutral | Nervous)
mindset_notes   TEXT
created_at      TEXT
```

### `analyses` table
```
id              INTEGER PRIMARY KEY
date            TEXT
video_path      TEXT (local file URI)
shot_type       TEXT
overall_score   REAL
foot_movement_score     REAL
foot_movement_feedback  TEXT
head_position_score     REAL
head_position_feedback  TEXT
body_alignment_score    REAL
body_alignment_feedback TEXT
bat_swing_score         REAL
bat_swing_feedback      TEXT
follow_through_score    REAL
follow_through_feedback TEXT
keyframe_path   TEXT (local screenshot URI)
created_at      TEXT
```

---

## Phases

---

### Phase 0 — Project Setup
**Goal:** Bare Expo project running on both simulators with all dependencies installed.

**Tasks:**
- [x] 0.1 — Initialize Expo bare workflow project with TypeScript template
- [x] 0.2 — Install and configure NativeWind (Tailwind)
- [x] 0.3 — Install and configure React Navigation (stack + bottom tabs)
- [x] 0.4 — Install expo-sqlite and Drizzle ORM; run initial migration
- [x] 0.5 — Install react-native-fast-tflite; verify native build on iOS + Android
- [x] 0.6 — Install expo-video-thumbnails (replaced deprecated ffmpeg-kit-react-native)
- [x] 0.7 — Install expo-image-picker and @react-native-voice/voice
- [x] 0.8 — Install Victory Native for charts
- [x] 0.9 — Download MoveNet Thunder .tflite file and place in `assets/models/`
- [x] 0.10 — Set up basic app shell: home screen with two mode cards (Tracker / Analyzer)

**Deliverable:** App launches, home screen visible, no crashes, native modules linked.

---

### Phase 1 — Database Layer
**Goal:** Full type-safe DB layer with all queries needed by the app.

**Tasks:**
- [x] 1.1 — Define Drizzle schema for `innings` and `analyses` tables (`src/db/schema.ts`)
- [x] 1.2 — Tables created via `CREATE TABLE IF NOT EXISTS` in `src/db/client.ts` (runs on every startup, idempotent)
- [x] 1.3 — Write innings CRUD queries: `insertInnings`, `getAllInnings`, `getInningsById`, `deleteInnings`
- [x] 1.4 — Write stats aggregation queries: career totals, last N innings, dismissal counts, mindset averages, format breakdown
- [x] 1.5 — Write analysis CRUD queries: `insertAnalysis`, `getAllAnalyses`, `getAnalysisById`
- [ ] 1.6 — Unit-test all queries against a seeded in-memory DB

**Deliverable:** All DB queries working and tested with seed data.

---

### Phase 2 — Mode 1: Log Innings Screen
**Goal:** User can log a complete innings entry.

**Tasks:**
- [x] 2.1 — Built animated step-by-step form (9 steps, Typeform-style slide transitions)
- [x] 2.2 — Conditional "runs required" field only shows when scenario = Chasing
- [x] 2.3 — Strike rate auto-calculated live from runs + balls, displayed as user types
- [x] 2.4 — Voice-to-text integrated on mindset notes via @react-native-voice/voice
- [x] 2.5 — Per-step validation; Continue button disabled until step is valid
- [x] 2.6 — On submit: saves to DB, navigates to dashboard; haptic feedback on save

**Deliverable:** Full innings logging flow working end to end.

---

### Phase 3 — Mode 1: Innings History Screen
**Goal:** User can browse all logged innings.

**Tasks:**
- [ ] 3.1 — List view of all innings, sorted by date descending
- [ ] 3.2 — Each card shows: date, format, opponent, runs scored, dismissal, mindset badge
- [ ] 3.3 — Tap to open detail view (all fields read-only)
- [ ] 3.4 — Swipe-to-delete with confirmation dialog
- [ ] 3.5 — Filter by format (chip selector at top)

**Deliverable:** History screen with detail view and delete working.

---

### Phase 4 — Mode 1: Dashboard Screen
**Goal:** Visual summary of batting performance.

**Tasks:**
- [ ] 4.1 — Career overview cards: total innings, runs, average, highest score, 4s, 6s
- [ ] 4.2 — Form chart: bar chart of runs scored across last 10 innings
- [ ] 4.3 — Strike rate trend: line chart over last 10 innings
- [ ] 4.4 — Dismissal breakdown: donut chart with legend
- [ ] 4.5 — Mindset vs Performance: bar chart — avg runs by Confident/Neutral/Nervous
- [ ] 4.6 — Match situation breakdown: avg runs when chasing vs setting
- [ ] 4.7 — Format filter: filter all dashboard stats by format (All / T20 / ODI / Test / Club)
- [ ] 4.8 — Empty state UI for new users with zero innings logged

**Deliverable:** Full dashboard rendering correctly with seed data; empty state handled.

---

### Phase 5 — Mode 2: Video Upload & Frame Extraction
**Goal:** User picks a video, app extracts evenly spaced frames for inference.

**Tasks:**
- [ ] 5.1 — Upload screen: single button to pick video from gallery (expo-image-picker)
- [ ] 5.2 — Show video thumbnail preview + duration after selection
- [ ] 5.3 — On confirm: extract 30 evenly spaced frames using expo-video-thumbnails (one call per timestamp)
- [ ] 5.4 — Save frames as JPEGs to a temp directory
- [ ] 5.5 — Navigate to Processing screen, passing frame paths
- [ ] 5.6 — Handle edge cases: video too short (<1s), unsupported format, picker cancelled

**Deliverable:** Video selected → 30 frames extracted → visible in Processing screen.

---

### Phase 6 — Mode 2: MoveNet Inference Pipeline
**Goal:** Run MoveNet Thunder on each frame and collect keypoints.

**Tasks:**
- [ ] 6.1 — Load MoveNet Thunder model at app start using react-native-fast-tflite
- [ ] 6.2 — Write `runInference(imagePath): Keypoints` — preprocess image (resize to 256×256, normalize), run model, parse 17 keypoint output tensor
- [ ] 6.3 — Define `Keypoints` type: 17 points each with x, y, confidence score
- [ ] 6.4 — Write `extractKeyframeIndex(allKeypoints): number` — pick the frame with highest average keypoint confidence (peak shot position)
- [ ] 6.5 — Run inference on all 30 frames sequentially with a progress bar on the Processing screen
- [ ] 6.6 — Handle low-confidence frames (skip frames where avg confidence < 0.3)

**Deliverable:** Keypoints extracted for all frames, best frame identified.

---

### Phase 7 — Mode 2: Shot Classification (Rule-based)
**Goal:** Identify the shot type from keypoint geometry.

**Tasks:**
- [ ] 7.1 — Define keypoint indices constants (nose=0, left_shoulder=5, right_shoulder=6, left_hip=11, right_hip=12, left_knee=13, right_knee=14, left_ankle=15, right_ankle=16, left_wrist=9, right_wrist=10, left_elbow=7, right_elbow=8)
- [ ] 7.2 — Write geometry helpers: `computeAngle(p1, p2, p3)`, `footPosition()` (front/back foot), `wristHeight()`, `bodyLean()`
- [ ] 7.3 — Write classification rules for each shot (using keyframe keypoints):

  | Shot | Key signals |
  |---|---|
  | Cover Drive | Front foot forward, wrists high, body leaning forward-off |
  | Straight Drive | Front foot forward, wrists high, body upright |
  | On Drive | Front foot forward, wrists high, body leaning forward-on |
  | Off Drive | Front foot forward, wrists at mid height, open face |
  | Pull Shot | Back foot, wrists above shoulder, body leaning back-on |
  | Hook Shot | Back foot, wrists above head height, body rotated |
  | Cut Shot | Back foot, lateral weight shift off side, wrists level |
  | Sweep Shot | Front knee bent deep, wrists low, body horizontal |
  | Reverse Sweep | Front knee bent deep, wrists low, opposite orientation |
  | Flick / Glance | Front foot, wrists flicking through on side |
  | Front Foot Defensive | Front foot, low wrists, minimal follow-through |
  | Back Foot Defensive | Back foot, low wrists, minimal follow-through |
  | Loft / Slog | Any foot, wrists very high, large rotation |

- [ ] 7.4 — Return top shot with confidence percentage; fallback to "Unknown" if no rule fires confidently

**Deliverable:** Shot type label returned for any valid keyframe.

---

### Phase 8 — Mode 2: Technique Scoring
**Goal:** Score each technique aspect 0–10 with text feedback.

**Tasks:**
- [ ] 8.1 — **Foot Movement scorer:** measure stride length and weight transfer from ankle/hip keypoints; score based on appropriate trigger step for identified shot
- [ ] 8.2 — **Head Position scorer:** measure head (nose) stability across all frames vs keyframe; penalize large lateral drift; score 0–10
- [ ] 8.3 — **Body Alignment scorer:** shoulder-to-hip angle on keyframe; expected alignment varies by shot type
- [ ] 8.4 — **Bat Swing Plane scorer:** wrist trajectory arc across frames; straight line = high score, across-the-line arc = lower score
- [ ] 8.5 — **Follow-Through scorer:** wrist height and arm extension on post-keyframe frames; incomplete follow-through = low score
- [ ] 8.6 — Define feedback strings for each score band (0–3: poor, 4–6: needs work, 7–8: good, 9–10: excellent) per aspect
- [ ] 8.7 — Compute overall score as weighted average (equal weights for now)

**Deliverable:** All 5 aspect scores + feedback strings generated from keypoints.

---

### Phase 9 — Mode 2: Results Screen & Persistence
**Goal:** Display analysis results and save to DB.

**Tasks:**
- [ ] 9.1 — Results screen layout:
  - Header: shot type label + overall score (large, prominent)
  - Keyframe screenshot (cropped from extracted frames)
  - Per-aspect score cards (icon + score bar + feedback text)
- [ ] 9.2 — Save analysis result to `analyses` table on screen mount
- [ ] 9.3 — Analysis history list under Mode 2 (date, shot type, overall score)
- [ ] 9.4 — Tap history item to re-open result screen (read from DB)
- [ ] 9.5 — Share button: export keyframe + score summary as an image (react-native-view-shot)

**Deliverable:** Full analysis flow end-to-end: upload → process → results → saved to history.

---

### Phase 10 — Polish & Integration
**Goal:** App feels complete and production-quality.

**Tasks:**
- [ ] 10.1 — App icon and splash screen
- [ ] 10.2 — Dark/light mode support via NativeWind
- [ ] 10.3 — Loading states and skeleton screens across all data-heavy screens
- [ ] 10.4 — Error boundaries and user-facing error messages
- [ ] 10.5 — Haptic feedback on key interactions (save, delete, score reveal)
- [ ] 10.6 — Onboarding screen for first launch (explain two modes)
- [ ] 10.7 — End-to-end smoke test on physical iOS and Android device

**Deliverable:** App ready for internal distribution.

---

## Implementation Order Summary

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
                                              ↓
                              Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
                                                                           ↓
                                                                      Phase 10
```

Mode 1 (Phases 2–4) and Mode 2 setup (Phase 5) can begin in parallel after Phase 1 is done.

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| MoveNet accuracy on cricket videos (side-on angle, bat occludes wrists) | Tune confidence thresholds; fallback to "shot undetected" rather than wrong label |
| expo-video-thumbnails vs full ffmpeg (replaced deprecated ffmpeg-kit) | Accepts one-frame-per-call limitation; fine for post-recording analysis |
| @react-native-voice/voice has inconsistent Android STT behavior | Fall back to keyboard input gracefully if STT fails |
| Rule-based classification is approximate | Communicate this clearly in UI ("Best match: Cover Drive"); keep MobileNetV3 TODO visible |
