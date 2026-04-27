/**
 * Unit tests for match-metrics player-adapters (pure mapping and aggregation).
 */
import { describe, it, expect } from 'vitest';
import { abbrevPosition, adaptPlayer, aggregateUIStats } from '../components/match-metrics/player-adapters';
import type { Player } from '../types/football';
import type { UIPlayerStats } from '../types/ui-player';

const minimalPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: '1',
  name: 'Test',
  team: 'Club',
  position: 'Forward',
  nationality: 'N',
  image_url: '',
  created_at: 't',
  stats: {
    player_id: '1',
    season: '2023/24',
    updated_at: 't',
    matches_played: 10,
    total_minutes: 900,
    goals: 5,
    assists: 2,
    goals_assists: 7,
    non_penalty_goals: 4,
    penalty_kicks_made: 1,
    xg: 4.333,
    exp_npg: 3.1,
    progressive_carries: 10,
    progressive_passes: 12,
    goals_per_90: 0.5,
    assists_per_90: 0.2,
    tackles_attempted: 3,
    tackles_won: 2,
    dribbles_tackled_pct: 50,
    shots_blocked: 0,
    passes_blocked: 0,
    interceptions: 1,
    clearances: 0,
    errors_made: 0,
    goals_against: 0,
    goals_against_per_90: 0,
    saves: 0,
    saves_pct: 0,
    clean_sheets: 0,
    clean_sheets_pct: 0,
    penalty_saves_pct: 0,
    passes_completed: 100,
    passes_attempted: 120,
    pass_completion_pct: 83.33,
    prog_passes_dist: 100.7,
    short_pass_pct: 90,
    medium_pass_pct: 80,
    long_pass_pct: 70,
    key_passes: 4,
    passes_final_third: 10,
    passes_penalty_area: 2,
    touches_def_pen: 1,
    take_ons_attempted: 5,
    take_ons_success_pct: 40,
    take_ons_tackled: 3,
    carries_prgc: 6,
    carries_final_third: 7,
    carries_penalty_area: 1,
    possessions_lost: 20,
    goals_scored: 5,
    total_shots: 30,
    shots_on_target_pct: 40,
    shots_per_90: 3,
    goals_per_shot: 0.17,
    goals_per_shot_on_target: 0.4,
    aerial_duels_won_pct: 55.555,
    sca_per_90: 2.2,
    gca_per_90: 0.3,
    crosses_stopped: 0,
  },
  ...overrides,
});

describe('abbrevPosition', () => {
  it('returns known abbreviations unchanged', () => {
    expect(abbrevPosition('FW')).toBe('FW');
    expect(abbrevPosition('GK')).toBe('GK');
  });

  it('maps full position names to abbreviations', () => {
    expect(abbrevPosition('Forward')).toBe('FW');
    expect(abbrevPosition('Midfielder')).toBe('MF');
  });

  it('falls back to the first two letters uppercased for unknown positions', () => {
    expect(abbrevPosition('Winger')).toBe('WI');
  });
});

describe('adaptPlayer', () => {
  it('rounds non-integer floating stat fields to two decimals', () => {
    const ui = adaptPlayer(minimalPlayer());
    expect(ui['Expected Goals']).toBe(4.33);
    expect(ui['Pass completion %']).toBe(83.33);
  });

  it('sets Avg Mins per Match to 0 when matches_played is 0', () => {
    const ui = adaptPlayer(
      minimalPlayer({
        stats: { ...minimalPlayer().stats, matches_played: 0, total_minutes: 999 },
      }),
    );
    expect(ui['Avg Mins per Match']).toBe(0);
  });

  it('uses safe numeric defaults when stats is missing', () => {
    const ui = adaptPlayer(minimalPlayer({ stats: undefined as unknown as Player['stats'] }));
    expect(ui.Goals).toBe(0);
    expect(ui['Matches Played']).toBe(0);
    expect(ui.season).toBe('');
  });

  it('uses empty string for comp when the player has no competition', () => {
    const ui = adaptPlayer(minimalPlayer({ comp: undefined }));
    expect(ui.comp).toBe('');
  });
});

describe('aggregateUIStats', () => {
  const row = (overrides: Partial<UIPlayerStats> = {}): UIPlayerStats =>
    ({
      player: 'P',
      nation: 'N',
      pos: 'FW',
      squad: 'S1',
      comp: 'C',
      age: 20,
      born: 2000,
      'Matches Played': 10,
      'Avg Mins per Match': 80,
      Goals: 5,
      Assists: 1,
      'Goals & Assists': 6,
      'Non Penalty Goals': 4,
      'Penalty Kicks Made': 1,
      'Expected Goals': 3,
      'Exp NPG': 2,
      'Progressive Carries': 1,
      'Progressive Passes': 2,
      'Goals p 90': 0.5,
      'Assists p 90': 0.1,
      'Tackles attempted': 1,
      'Tackles Won': 1,
      '% Dribbles tackled': 50,
      'Shots blocked': 0,
      'Passes blocked': 0,
      Interceptions: 0,
      Clearances: 0,
      'Errors made': 0,
      'Goals Against': 0,
      'Goals against p 90': 0,
      Saves: 0,
      'Saves %': 0,
      'Clean Sheets': 0,
      '% Clean sheets': 0,
      '% Penalty saves': 0,
      'Passes Completed': 0,
      'Passes Attempted': 0,
      'Pass completion %': 80,
      'Progressive passes distance': 0,
      '% Short pass completed': 0,
      '% Medium passes completed': 0,
      '% Long passes completed': 0,
      'Key passes': 2,
      '1/3': 0,
      'Passes into penalty area': 0,
      touches_def_pen: 0,
      'Take ons attempted': 0,
      '% Successful take-ons': 0,
      'Times tackled during take-on': 0,
      carries_prgc: 0,
      'carries final 3rd': 0,
      'carries penalty area': 0,
      'Possessions lost': 0,
      'Goals Scored': 5,
      'Total Shots': 10,
      '% Shots on target': 0,
      'Shots p 90': 0,
      'Goals per shot': 0,
      'Goals per shot on target': 0,
      '% Aerial Duels won': 0,
      'Shot creating actions p 90': 0,
      'Goal creating actions p 90': 0,
      'Crosses Stopped': 0,
      season: '2022/23',
      ...overrides,
    }) as UIPlayerStats;

  it('returns the sole row unchanged for a single-season input', () => {
    const one = row();
    expect(aggregateUIStats([one])).toBe(one);
  });

  it('sets season to All Seasons and joins distinct squads for multiple seasons', () => {
    const a = row({ squad: 'A', season: '2022/23', 'Pass completion %': 80, Goals: 4 });
    const b = row({ squad: 'B', season: '2023/24', 'Pass completion %': 90, Goals: 6 });
    const agg = aggregateUIStats([a, b]);
    expect(agg.season).toBe('All Seasons');
    expect(agg.squad).toBe('A, B');
    expect(agg.Goals).toBe(10);
    expect(agg['Pass completion %']).toBe(85);
  });

  it('rounds averaged percentage metrics to two decimals', () => {
    const a = row({ 'Pass completion %': 70 });
    const b = row({ 'Pass completion %': 73 });
    const agg = aggregateUIStats([a, b]);
    expect(agg['Pass completion %']).toBe(71.5);
  });

  it('rounds age, born, and Avg Mins per Match when averaging', () => {
    const a = row({ age: 20, born: 2000, 'Avg Mins per Match': 81 });
    const b = row({ age: 22, born: 2002, 'Avg Mins per Match': 83 });
    const agg = aggregateUIStats([a, b]);
    expect(agg.age).toBe(21);
    expect(agg.born).toBe(2001);
    expect(agg['Avg Mins per Match']).toBe(82);
  });
});
