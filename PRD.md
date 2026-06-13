# Coach App — Product Requirements Document

**Version:** 0.1  
**Status:** Draft  
**Last Updated:** 2026-06-10

---

## Overview

Coach App is a local-only mobile application for cricket players to track their batting performance over time and analyze their shot technique using on-device AI. No data leaves the device — no cloud storage, no backend.

---

## Platform

- **Framework:** React Native + Expo (bare workflow / custom dev build — required for on-device ML)
- **Targets:** iOS and Android
- **Storage:** Local device only (SQLite via expo-sqlite or equivalent)

---

## Mode 1 — Performance Tracker

### Purpose
Allow a batsman to log every innings they play and view dashboards summarizing their performance over time.

### Match Entry

**Match Context**
- Match format: T20, ODI, Test, Club/Tape-ball
- Opponent name (free text)
- Venue (free text)
- Match result: Won / Lost / Draw / No Result

**Match Situation at Entry (when the batsman walked in)**
- Team score at the time (e.g. 45)
- Wickets down at the time (e.g. 2 wickets)
- Match scenario: Chasing / Setting
- If chasing: runs required at the time of walking in

**Batting Stats**
- Runs scored
- Balls faced
- Fours hit
- Sixes hit
- Strike rate (auto-calculated)
- How dismissed: Bowled / Caught / LBW / Run Out / Stumped / Hit Wicket / Not Out / Retired

**Mindset at Entry**
- Mood rating: Confident / Neutral / Nervous (single select)
- Additional notes: free text input with voice-to-text support

### Dashboards & Stats

- **Career overview:** Total innings, total runs, batting average, highest score, total fours, total sixes
- **Form tracker:** Runs scored across last N innings (line/bar chart)
- **Dismissal breakdown:** Pie/donut chart of how dismissed
- **Strike rate trend:** Over time
- **Mindset vs Performance:** Correlation view — average runs by mindset rating (Confident / Neutral / Nervous)
- **Match situation breakdown:** Average runs when chasing vs setting, average runs by wickets-down when walked in
- **Format breakdown:** Stats filtered/grouped by match format

---

## Mode 2 — AI Shot Analyzer

### Purpose
Allow the user to upload a batting video from their gallery. The app analyzes the video on-device, identifies the shot played, and scores the technique across fixed aspects.

### Input
- Video file selected from device gallery
- Batting only (bowling analysis is out of scope for now)

### On-Device AI Stack
- **Framework:** TensorFlow Lite (via `react-native-fast-tflite`)
- **Model:** MoveNet Thunder (~12MB) — detects 17 body keypoints per frame
- **Inference:** Post-recording, not real-time
- **Shot classification:** Rule-based logic on top of keypoint data

> **Future TODO:** Train a custom classification layer on top of MobileNetV3 for improved shot identification accuracy. This is a separate workstream requiring labelled cricket shot video data.

### Shot Identification
Identify the following shots from keypoint geometry and bat/body angles:
- Cover Drive
- Straight Drive
- On Drive
- Off Drive
- Pull Shot
- Hook Shot
- Cut Shot
- Sweep Shot
- Reverse Sweep
- Flick / Glance
- Defensive (Front foot / Back foot)
- Loft / Slog

### Technique Scoring
Each analysis returns a score (0–10) and specific text feedback for each of the following aspects:

| Aspect | What is measured |
|---|---|
| **Foot Movement** | Front/back foot trigger step, weight transfer |
| **Head Position** | Still and level vs falling over or lifting |
| **Body Alignment** | Open vs closed stance, shoulder position |
| **Bat Swing Plane** | Straight vs across the line |
| **Follow-Through** | Completeness and direction of follow-through |

### Output
- Detected shot type (label)
- Overall technique score (0–10, average of all aspects)
- Per-aspect scores (0–10 each)
- Per-aspect text feedback (e.g. "Head falling to the off side — focus on keeping chin level")
- Key frame screenshot from the video showing peak shot position

---

## Navigation Structure

```
App
├── Mode 1 — Performance Tracker
│   ├── Dashboard (home)
│   ├── Log Innings (form)
│   └── Innings History (list + detail view)
└── Mode 2 — Shot Analyzer
    ├── Upload Video
    ├── Analysis in Progress
    └── Analysis Result
```

---

## Out of Scope (v1)

- Bowling and fielding stats
- Cloud sync or backup
- Multi-user / team management
- Live camera feed analysis (gallery upload only)
- Real-time shot detection
- Social / sharing features
- Coaching notes from a human coach

---

## Future Considerations (post v1)

- Train MobileNetV3 classification layer for shot identification
- Live camera feed analysis
- Bowling action analysis
- Fielding stats
- Export to PDF / CSV
- iCloud / Google Drive optional backup
