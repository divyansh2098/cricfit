import { desc, eq, sql } from 'drizzle-orm';
import { db } from './client';
import { innings, analyses, InningsInsert, AnalysisInsert } from './schema';

// ─── Innings ────────────────────────────────────────────────────────────────

export function insertInnings(data: Omit<InningsInsert, 'id'>) {
  return db.insert(innings).values(data).run();
}

export function getAllInnings() {
  return db.select().from(innings).orderBy(desc(innings.date)).all();
}

export function getInningsById(id: number) {
  return db.select().from(innings).where(eq(innings.id, id)).get();
}

export function deleteInnings(id: number) {
  return db.delete(innings).where(eq(innings.id, id)).run();
}

// ─── Career Stats ────────────────────────────────────────────────────────────

export function getCareerStats() {
  const rows = db.select().from(innings).all();
  if (rows.length === 0) return null;

  const totalInnings = rows.length;
  const totalRuns = rows.reduce((sum, r) => sum + r.runsScored, 0);
  const dismissals = rows.filter((r) => r.dismissal !== 'Not Out' && r.dismissal !== 'Retired');
  const average = dismissals.length > 0 ? totalRuns / dismissals.length : totalRuns;
  const highestScore = Math.max(...rows.map((r) => r.runsScored));
  const totalFours = rows.reduce((sum, r) => sum + r.fours, 0);
  const totalSixes = rows.reduce((sum, r) => sum + r.sixes, 0);

  return { totalInnings, totalRuns, average, highestScore, totalFours, totalSixes };
}

export function getLastNInnings(n: number) {
  return db.select().from(innings).orderBy(desc(innings.date)).limit(n).all();
}

export function getDismissalBreakdown() {
  return db
    .select({ dismissal: innings.dismissal, count: sql<number>`count(*)` })
    .from(innings)
    .groupBy(innings.dismissal)
    .all();
}

export function getMindsetPerformance() {
  return db
    .select({
      mindset: innings.mindset,
      avgRuns: sql<number>`avg(${innings.runsScored})`,
      count: sql<number>`count(*)`,
    })
    .from(innings)
    .groupBy(innings.mindset)
    .all();
}

export function getScenarioBreakdown() {
  return db
    .select({
      scenario: innings.scenario,
      avgRuns: sql<number>`avg(${innings.runsScored})`,
      count: sql<number>`count(*)`,
    })
    .from(innings)
    .groupBy(innings.scenario)
    .all();
}

export function getFormatBreakdown() {
  return db
    .select({
      format: innings.format,
      totalInnings: sql<number>`count(*)`,
      totalRuns: sql<number>`sum(${innings.runsScored})`,
      avgRuns: sql<number>`avg(${innings.runsScored})`,
      highestScore: sql<number>`max(${innings.runsScored})`,
    })
    .from(innings)
    .groupBy(innings.format)
    .all();
}

export function getInningsByFormat(format: string) {
  return db
    .select()
    .from(innings)
    .where(eq(innings.format, format as any))
    .orderBy(desc(innings.date))
    .all();
}

// ─── Analyses ────────────────────────────────────────────────────────────────

export function insertAnalysis(data: Omit<AnalysisInsert, 'id'>) {
  return db.insert(analyses).values(data).run();
}

export function getAllAnalyses() {
  return db.select().from(analyses).orderBy(desc(analyses.date)).all();
}

export function getAnalysisById(id: number) {
  return db.select().from(analyses).where(eq(analyses.id, id)).get();
}
