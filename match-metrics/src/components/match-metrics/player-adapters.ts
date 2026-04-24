import type { PlayerStats as UIPlayerStats } from '@/types/ui-player';
import type { Player } from '@/types/football';

const POSITION_ABBREV: Record<string, string> = {
  Forward: 'FW',
  Midfielder: 'MF',
  Defender: 'DF',
  Goalkeeper: 'GK',
};

export function abbrevPosition(position: string): string {
  if (['FW', 'MF', 'DF', 'GK'].includes(position)) return position;
  return POSITION_ABBREV[position] ?? position.slice(0, 2).toUpperCase();
}

export const adaptPlayer = (p: Player): UIPlayerStats => {
  const rounded = (num: number) => (!Number.isInteger(num) ? Number(num.toFixed(2)) : num);
  return {
    player: p.name,
    nation: p.nationality,
    pos: abbrevPosition(p.position),
    squad: p.team,
    comp: p.comp || '',
    age: p.age || 0,
    born: p.born || 0,
    'Matches Played': p.stats?.matches_played || 0,
    'Avg Mins per Match': p.stats?.matches_played
      ? Math.round((p.stats?.total_minutes || 0) / p.stats.matches_played)
      : 0,
    Goals: p.stats?.goals || 0,
    Assists: p.stats?.assists || 0,
    'Goals & Assists': p.stats?.goals_assists || 0,
    'Non Penalty Goals': p.stats?.non_penalty_goals || 0,
    'Penalty Kicks Made': p.stats?.penalty_kicks_made || 0,
    'Expected Goals': rounded(p.stats?.xg || 0),
    'Exp NPG': rounded(p.stats?.exp_npg || 0),
    'Progressive Carries': p.stats?.progressive_carries || 0,
    'Progressive Passes': p.stats?.progressive_passes || 0,
    'Progressive Passes p 90': p.stats?.progressive_passes && p.stats?.total_minutes
      ? rounded((p.stats.progressive_passes / p.stats.total_minutes) * 90)
      : 0,
    'Goals p 90': rounded(p.stats?.goals_per_90 || 0),
    'Assists p 90': rounded(p.stats?.assists_per_90 || 0),
    'Tackles attempted': p.stats?.tackles_attempted || 0,
    'Tackles Won': p.stats?.tackles_won || 0,
    '% Dribbles tackled': rounded(p.stats?.dribbles_tackled_pct || 0),
    'Shots blocked': p.stats?.shots_blocked || 0,
    'Passes blocked': p.stats?.passes_blocked || 0,
    Interceptions: p.stats?.interceptions || 0,
    Clearances: p.stats?.clearances || 0,
    'Errors made': p.stats?.errors_made || 0,
    'Goals Against': p.stats?.goals_against || 0,
    'Goals against p 90': rounded(p.stats?.goals_against_per_90 || 0),
    Saves: p.stats?.saves || 0,
    'Saves %': rounded(p.stats?.saves_pct || 0),
    'Clean Sheets': p.stats?.clean_sheets || 0,
    '% Clean sheets': rounded(p.stats?.clean_sheets_pct || 0),
    '% Penalty saves': rounded(p.stats?.penalty_saves_pct || 0),
    'Passes Completed': p.stats?.passes_completed || 0,
    'Passes Attempted': p.stats?.passes_attempted || 0,
    'Pass completion %': rounded(p.stats?.pass_completion_pct || 0),
    'Progressive passes distance': rounded(p.stats?.prog_passes_dist || 0),
    '% Short pass completed': rounded(p.stats?.short_pass_pct || 0),
    '% Medium passes completed': rounded(p.stats?.medium_pass_pct || 0),
    '% Long passes completed': rounded(p.stats?.long_pass_pct || 0),
    'Key passes': p.stats?.key_passes || 0,
    '1/3': p.stats?.passes_final_third || 0,
    'Passes into penalty area': p.stats?.passes_penalty_area || 0,
    touches_def_pen: p.stats?.touches_def_pen || 0,
    'Take ons attempted': p.stats?.take_ons_attempted || 0,
    '% Successful take-ons': rounded(p.stats?.take_ons_success_pct || 0),
    'Times tackled during take-on': p.stats?.take_ons_tackled || 0,
    carries_prgc: p.stats?.carries_prgc || 0,
    'carries final 3rd': p.stats?.carries_final_third || 0,
    'carries penalty area': p.stats?.carries_penalty_area || 0,
    'Possessions lost': p.stats?.possessions_lost || 0,
    'Goals Scored': p.stats?.goals_scored || 0,
    'Total Shots': p.stats?.total_shots || 0,
    '% Shots on target': rounded(p.stats?.shots_on_target_pct || 0),
    'Shots p 90': rounded(p.stats?.shots_per_90 || 0),
    'Goals per shot': rounded(p.stats?.goals_per_shot || 0),
    'Goals per shot on target': rounded(p.stats?.goals_per_shot_on_target || 0),
    '% Aerial Duels won': rounded(p.stats?.aerial_duels_won_pct || 0),
    'Shot creating actions p 90': rounded(p.stats?.sca_per_90 || 0),
    'Goal creating actions p 90': rounded(p.stats?.gca_per_90 || 0),
    'Crosses Stopped': p.stats?.crosses_stopped || 0,
    '90s': rounded((p.stats?.total_minutes || 0) / 90),
    'Minutes': p.stats?.total_minutes || 0,
    season: p.stats?.season || '',
  };
};

export const aggregateUIStats = (seasons: UIPlayerStats[]): UIPlayerStats => {
  if (seasons.length === 1) return seasons[0];
  const squads = Array.from(new Set(seasons.map((s) => s.squad))).join(', ');
  const result: Record<string, unknown> = { ...seasons[0], season: 'All Seasons', squad: squads };

  const avgKeys = [
    'Pass completion %',
    'Goals p 90',
    'Assists p 90',
    'Progressive Passes p 90',
    '% Dribbles tackled',
    'Saves %',
    '% Clean sheets',
    '% Penalty saves',
    '% Short pass completed',
    '% Medium passes completed',
    '% Long passes completed',
    '% Successful take-ons',
    '% Shots on target',
    'Goals per shot',
    'Goals per shot on target',
    '% Aerial Duels won',
    'Shot creating actions p 90',
    'Goal creating actions p 90',
    'Avg Mins per Match',
    'age',
    'born',
  ];

  Object.keys(seasons[0]).forEach((k) => {
    if (typeof seasons[0][k as keyof UIPlayerStats] === 'number') {
      const sum = seasons.reduce(
        (acc, curr) => acc + (Number((curr as unknown as Record<string, number>)[k]) || 0),
        0,
      );
      if (avgKeys.includes(k)) {
        result[k] = sum / seasons.length;
        if (['age', 'born', 'Avg Mins per Match'].includes(k)) {
          result[k] = Math.round(result[k] as number);
        } else {
          result[k] = Number((result[k] as number).toFixed(2));
        }
      } else {
        result[k] = sum;
        if (!Number.isInteger(result[k] as number)) {
          result[k] = Number((result[k] as number).toFixed(2));
        }
      }
    }
  });
  return result as unknown as UIPlayerStats;
};
