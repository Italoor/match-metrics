/**
 * Unit tests for src/lib/data-service.ts
 * Focus: Data fetching and mock fallback paths.
 */
import { describe, it, expect, vi } from 'vitest';
import { Player, PlayerStats } from '../types/football';

// ─── Helpers ─────────────────────────────────────────────────

const makeStats = (overrides: Partial<PlayerStats> = {}): PlayerStats => ({
  player_id: 'p1',
  season: '2023/24',
  updated_at: '2024-01-01T00:00:00Z',
  matches_played: 38,
  total_minutes: 3230,
  goals: 20,
  assists: 10,
  goals_assists: 30,
  non_penalty_goals: 18,
  penalty_kicks_made: 2,
  xg: 18.5,
  exp_npg: 16.0,
  progressive_carries: 100,
  progressive_passes: 80,
  goals_per_90: 0.53,
  assists_per_90: 0.26,
  tackles_attempted: 20,
  tackles_won: 14,
  dribbles_tackled_pct: 70,
  shots_blocked: 5,
  passes_blocked: 3,
  interceptions: 12,
  clearances: 8,
  errors_made: 2,
  goals_against: 0,
  goals_against_per_90: 0,
  saves: 0,
  saves_pct: 0,
  clean_sheets: 0,
  clean_sheets_pct: 0,
  penalty_saves_pct: 0,
  passes_completed: 1200,
  passes_attempted: 1500,
  pass_completion_pct: 80.0,
  prog_passes_dist: 5000,
  short_pass_pct: 90,
  medium_pass_pct: 75,
  long_pass_pct: 55,
  key_passes: 60,
  passes_final_third: 200,
  passes_penalty_area: 50,
  touches_def_pen: 10,
  take_ons_attempted: 80,
  take_ons_success_pct: 62.5,
  take_ons_tackled: 30,
  carries_prgc: 90,
  carries_final_third: 150,
  carries_penalty_area: 40,
  possessions_lost: 100,
  goals_scored: 20,
  total_shots: 120,
  shots_on_target_pct: 45.0,
  shots_per_90: 3.16,
  goals_per_shot: 0.17,
  goals_per_shot_on_target: 0.37,
  aerial_duels_won_pct: 55.0,
  sca_per_90: 4.2,
  gca_per_90: 0.8,
  crosses_stopped: 0,
  ...overrides,
});

const makePlayer = (overrides: Partial<Player> = {}, statsOverrides: Partial<PlayerStats> = {}): Player => ({
  id: 'p1',
  name: 'Test Player',
  team: 'Test FC',
  position: 'Forward',
  nationality: 'Brazil',
  image_url: '',
  created_at: '2024-01-01T00:00:00Z',
  stats: makeStats(statsOverrides),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────



// ─── Mock Fallback (MOCK_PLAYERS) ─────────────

// Use a stable top-level mock so module registry stays intact for other files.
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => false),
  supabase: {},
}));

describe('mock data fallback (no Supabase)', () => {
  it('MOCK_PLAYERS contains at least one player', async () => {
    const { MOCK_PLAYERS } = await import('../lib/mock-data');
    expect(MOCK_PLAYERS.length).toBeGreaterThan(0);
  });

  it('each mock player has required fields', async () => {
    const { MOCK_PLAYERS } = await import('../lib/mock-data');
    for (const p of MOCK_PLAYERS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.team).toBeTruthy();
      expect(p.position).toBeTruthy();
      expect(p.stats).toBeDefined();
    }
  });



  it('searchAllSeasonsByQuery returns mock players matching name or team', async () => {
    const { searchAllSeasonsByQuery } = await import('../lib/data-service');
    const byTeam = await searchAllSeasonsByQuery('real');
    expect(byTeam.length).toBeGreaterThan(0);
    const byName = await searchAllSeasonsByQuery('mb');
    expect(byName.length).toBeGreaterThan(0);
    expect(await searchAllSeasonsByQuery('x')).toEqual([]);
  });



  it('searchAllSeasonsByQuery returns empty array when query length exceeds 50', async () => {
    const { searchAllSeasonsByQuery } = await import('../lib/data-service');
    const q = 'b'.repeat(51);
    expect(await searchAllSeasonsByQuery(q)).toEqual([]);
  });



  it('getPlayers resolves to full MOCK_PLAYERS when Supabase is not configured', async () => {
    const { getPlayers } = await import('../lib/data-service');
    const { MOCK_PLAYERS: expected } = await import('../lib/mock-data');
    const all = await getPlayers({ season: 'All', comp: 'All', pos: 'All' });
    expect(all.length).toBe(expected.length);
    expect(all.map(p => p.id).sort()).toEqual(expected.map(p => p.id).sort());
  });

  it('getLeagues returns sorted unique competitions from mock data', async () => {
    const { getLeagues } = await import('../lib/data-service');
    const { MOCK_PLAYERS } = await import('../lib/mock-data');
    const leagues = await getLeagues();
    const expected = Array.from(new Set(MOCK_PLAYERS.map(p => p.comp).filter(Boolean) as string[])).sort();
    expect(leagues).toEqual(expected);
    expect(leagues.length).toBeGreaterThan(0);
  });

  it('getSeasons returns unique seasons sorted descending', async () => {
    const { getSeasons } = await import('../lib/data-service');
    const { MOCK_PLAYERS } = await import('../lib/mock-data');
    const seasons = await getSeasons();
    const raw = MOCK_PLAYERS.map(p =>
      Array.isArray(p.stats) ? p.stats[0]?.season : p.stats?.season,
    ).filter(Boolean) as string[];
    const expected = Array.from(new Set(raw)).sort((a, b) => b.localeCompare(a));
    expect(seasons).toEqual(expected);
  });
});
