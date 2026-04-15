export interface PlayerStats {
  player_id: string;
  matches_played: number;
  total_minutes: number;
  goals: number;
  assists: number;
  goals_assists: number;
  non_penalty_goals: number;
  penalty_kicks_made: number;
  xg: number;
  exp_npg: number;
  progressive_carries: number;
  progressive_passes: number;
  goals_per_90: number;
  assists_per_90: number;
  tackles_attempted: number;
  tackles_won: number;
  dribbles_tackled_pct: number;
  shots_blocked: number;
  passes_blocked: number;
  interceptions: number;
  clearances: number;
  errors_made: number;
  goals_against: number;
  goals_against_per_90: number;
  saves: number;
  saves_pct: number;
  clean_sheets: number;
  clean_sheets_pct: number;
  penalty_saves_pct: number;
  passes_completed: number;
  passes_attempted: number;
  pass_completion_pct: number;
  prog_passes_dist: number;
  short_pass_pct: number;
  medium_pass_pct: number;
  long_pass_pct: number;
  key_passes: number;
  passes_final_third: number;
  passes_penalty_area: number;
  touches_def_pen: number;
  take_ons_attempted: number;
  take_ons_success_pct: number;
  take_ons_tackled: number;
  carries_prgc: number;
  carries_final_third: number;
  carries_penalty_area: number;
  possessions_lost: number;
  goals_scored: number;
  total_shots: number;
  shots_on_target_pct: number;
  shots_per_90: number;
  goals_per_shot: number;
  goals_per_shot_on_target: number;
  aerial_duels_won_pct: number;
  sca_per_90: number;
  gca_per_90: number;
  crosses_stopped: number;
  season: string;
  updated_at: string;
}

export interface Player {
  id: string;
  rk?: number;
  name: string;
  team: string;
  position: string;
  nationality: string;
  comp?: string;
  age?: number;
  born?: number;
  image_url: string;
  created_at: string;
  stats: PlayerStats;
}

export interface ComparisonResult {
  statName: keyof PlayerStats;
  playerAValue: number;
  playerBValue: number;
  difference: number;
  percentageDiff: number;
}
