export type MatchFormat = 'T20' | 'ODI' | 'Test' | 'Club';
export type MatchResult = 'Won' | 'Lost' | 'Draw' | 'No Result';
export type MatchScenario = 'Chasing' | 'Setting';
export type Dismissal =
  | 'Bowled'
  | 'Caught'
  | 'LBW'
  | 'Run Out'
  | 'Stumped'
  | 'Hit Wicket'
  | 'Not Out'
  | 'Retired';
export type Mindset = 'Confident' | 'Neutral' | 'Nervous';

export interface Innings {
  id: number;
  date: string;
  format: MatchFormat;
  opponent: string;
  venue: string;
  result: MatchResult;
  scoreAtEntry: number;
  wicketsAtEntry: number;
  scenario: MatchScenario;
  runsRequired: number | null;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: Dismissal;
  mindset: Mindset;
  mindsetNotes: string;
  createdAt: string;
}

export interface TechniqueAspect {
  score: number;
  feedback: string;
}

export interface Analysis {
  id: number;
  date: string;
  videoPath: string;
  shotType: string;
  overallScore: number;
  footMovement: TechniqueAspect;
  headPosition: TechniqueAspect;
  bodyAlignment: TechniqueAspect;
  batSwing: TechniqueAspect;
  followThrough: TechniqueAspect;
  keyframePath: string;
  createdAt: string;
}
