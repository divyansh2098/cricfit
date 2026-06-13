import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = SQLite.openDatabaseSync('cricfit.db');
export const db = drizzle(sqlite, { schema });

const CREATE_INNINGS = `
  CREATE TABLE IF NOT EXISTS innings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    format TEXT NOT NULL,
    opponent TEXT NOT NULL,
    venue TEXT NOT NULL,
    result TEXT NOT NULL,
    score_at_entry INTEGER NOT NULL,
    wickets_at_entry INTEGER NOT NULL,
    scenario TEXT NOT NULL,
    runs_required INTEGER,
    runs_scored INTEGER NOT NULL,
    balls_faced INTEGER NOT NULL,
    fours INTEGER NOT NULL DEFAULT 0,
    sixes INTEGER NOT NULL DEFAULT 0,
    strike_rate REAL NOT NULL,
    dismissal TEXT NOT NULL,
    mindset TEXT NOT NULL,
    mindset_notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )
`;

const CREATE_ANALYSES = `
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    video_path TEXT NOT NULL,
    shot_type TEXT NOT NULL,
    overall_score REAL NOT NULL,
    foot_movement_score REAL NOT NULL,
    foot_movement_feedback TEXT NOT NULL,
    head_position_score REAL NOT NULL,
    head_position_feedback TEXT NOT NULL,
    body_alignment_score REAL NOT NULL,
    body_alignment_feedback TEXT NOT NULL,
    bat_swing_score REAL NOT NULL,
    bat_swing_feedback TEXT NOT NULL,
    follow_through_score REAL NOT NULL,
    follow_through_feedback TEXT NOT NULL,
    keyframe_path TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

export function initDatabase() {
  sqlite.execSync(CREATE_INNINGS);
  sqlite.execSync(CREATE_ANALYSES);
}
