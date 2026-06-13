import { int, real, text, sqliteTable } from 'drizzle-orm/sqlite-core';

export const innings = sqliteTable('innings', {
  id: int('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  format: text('format', { enum: ['T20', 'ODI', 'Test', 'Club'] }).notNull(),
  opponent: text('opponent').notNull(),
  venue: text('venue').notNull(),
  result: text('result', { enum: ['Won', 'Lost', 'Draw', 'No Result'] }).notNull(),
  scoreAtEntry: int('score_at_entry').notNull(),
  wicketsAtEntry: int('wickets_at_entry').notNull(),
  scenario: text('scenario', { enum: ['Chasing', 'Setting'] }).notNull(),
  runsRequired: int('runs_required'),
  runsScored: int('runs_scored').notNull(),
  ballsFaced: int('balls_faced').notNull(),
  fours: int('fours').notNull().default(0),
  sixes: int('sixes').notNull().default(0),
  strikeRate: real('strike_rate').notNull(),
  dismissal: text('dismissal', {
    enum: ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Not Out', 'Retired'],
  }).notNull(),
  mindset: text('mindset', { enum: ['Confident', 'Neutral', 'Nervous'] }).notNull(),
  mindsetNotes: text('mindset_notes').notNull().default(''),
  createdAt: text('created_at').notNull(),
});

export const analyses = sqliteTable('analyses', {
  id: int('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  videoPath: text('video_path').notNull(),
  shotType: text('shot_type').notNull(),
  overallScore: real('overall_score').notNull(),
  footMovementScore: real('foot_movement_score').notNull(),
  footMovementFeedback: text('foot_movement_feedback').notNull(),
  headPositionScore: real('head_position_score').notNull(),
  headPositionFeedback: text('head_position_feedback').notNull(),
  bodyAlignmentScore: real('body_alignment_score').notNull(),
  bodyAlignmentFeedback: text('body_alignment_feedback').notNull(),
  batSwingScore: real('bat_swing_score').notNull(),
  batSwingFeedback: text('bat_swing_feedback').notNull(),
  followThroughScore: real('follow_through_score').notNull(),
  followThroughFeedback: text('follow_through_feedback').notNull(),
  keyframePath: text('keyframe_path').notNull(),
  createdAt: text('created_at').notNull(),
});

export type InningsInsert = typeof innings.$inferInsert;
export type InningsSelect = typeof innings.$inferSelect;
export type AnalysisInsert = typeof analyses.$inferInsert;
export type AnalysisSelect = typeof analyses.$inferSelect;
