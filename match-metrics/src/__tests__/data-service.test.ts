/**
 * Unit tests for src/lib/data-service.ts
 * Focus: computeCareerStats (pure function) and mock fallback paths.
 */
import { describe, it, expect, vi } from 'vitest';
import { computeCareerStats } from '../lib/data-service';
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

describe('computeCareerStats', () => {
  describe('edge cases', () => {
    it('returns an empty object for an empty seasons array', () => {
      const result = computeCareerStats([]);
      expect(result).toEqual({});
    });

    it('returns the single season stats unchanged', () => {
      const player = makePlayer();
      const result = computeCareerStats([player]);
      expect(result).toEqual(player.stats);
    });

    it('returns empty object when all seasons have empty stats', () => {
      const players = [
        makePlayer({ stats: {} as PlayerStats }),
        makePlayer({ stats: {} as PlayerStats }),
      ];
      const result = computeCareerStats(players);
      expect(result).toEqual({});
    });

    it('skips seasons with empty stats when mixing valid and empty', () => {
      const valid = makePlayer({}, { goals: 10 });
      const empty = makePlayer({ stats: {} as PlayerStats });
      const result = computeCareerStats([valid, empty]);
      // Only 1 valid season → returns it directly
      expect(result.goals).toBe(10);
    });
  });

  describe('counting stat summation', () => {
    it('sums goals across two seasons', () => {
      const s1 = makePlayer({ id: 'p1' }, { goals: 20, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { goals: 15, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.goals).toBe(35);
    });

    it('sums assists across two seasons', () => {
      const s1 = makePlayer({ id: 'p1' }, { assists: 8, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { assists: 12, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.assists).toBe(20);
    });

    it('sums matches_played across three seasons', () => {
      const seasons = [
        makePlayer({ id: 'p1' }, { matches_played: 38, player_id: 'p1', season: '2021/22' }),
        makePlayer({ id: 'p2' }, { matches_played: 35, player_id: 'p1', season: '2022/23' }),
        makePlayer({ id: 'p3' }, { matches_played: 30, player_id: 'p1', season: '2023/24' }),
      ];
      const result = computeCareerStats(seasons);
      expect(result.matches_played).toBe(103);
    });

    it('handles zero values in counting stats without NaN', () => {
      const s1 = makePlayer({ id: 'p1' }, { goals: 0, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { goals: 0, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.goals).toBe(0);
      expect(Number.isNaN(result.goals)).toBe(false);
    });
  });

  describe('rate stat weighted averaging', () => {
    it('averages goals_per_90 across two seasons with equal weight', () => {
      const s1 = makePlayer({ id: 'p1' }, { goals_per_90: 20.0, matches_played: 38, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { goals_per_90: 10.0, matches_played: 38, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.goals_per_90).toBeCloseTo(15.0);
    });

    it('averages pass_completion_pct across two seasons with unequal weight', () => {
      // s1: 10 matches @ 80% = 800
      // s2: 30 matches @ 90% = 2700
      // total: 3500 / 40 = 87.5%
      const s1 = makePlayer({ id: 'p1' }, { pass_completion_pct: 80.0, matches_played: 10, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { pass_completion_pct: 90.0, matches_played: 30, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.pass_completion_pct).toBeCloseTo(87.5);
    });

    it('falls back to simple average if all matches_played are zero', () => {
      const s1 = makePlayer({ id: 'p1' }, { goals_per_90: 20.0, matches_played: 0, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { goals_per_90: 10.0, matches_played: 0, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.goals_per_90).toBeCloseTo(15.0);
    });

    it('produces no NaN for rate stats when values are 0', () => {
      const s1 = makePlayer({ id: 'p1' }, { goals_per_90: 0, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { goals_per_90: 0, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(Number.isNaN(result.goals_per_90)).toBe(false);
    });

    it('weights sca_per_90 by matches_played across two seasons', () => {
      const s1 = makePlayer({ id: 'p1' }, { sca_per_90: 4.0, matches_played: 10, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { sca_per_90: 2.0, matches_played: 30, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.sca_per_90).toBeCloseTo((4 * 10 + 2 * 30) / 40);
    });
  });

  describe('additional counting stats and missing numerics', () => {
    it('sums total_minutes across two seasons', () => {
      const s1 = makePlayer({ id: 'p1' }, { total_minutes: 2000, player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { total_minutes: 1500, player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.total_minutes).toBe(3500);
    });

    it('treats missing stat fields as zero when aggregating two seasons', () => {
      const s1 = makePlayer({ id: 'p1' }, { player_id: 'p1', season: '2022/23', goals: 5 });
      const s2 = makePlayer({ id: 'p2' }, { player_id: 'p1', season: '2023/24', goals: 0 });
      Reflect.deleteProperty(s2.stats, 'goals');
      const result = computeCareerStats([s1, s2]);
      expect(result.goals).toBe(5);
    });
  });

  describe('career label', () => {
    it('generates correct career label for 2 seasons', () => {
      const s1 = makePlayer({ id: 'p1' }, { player_id: 'p1', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { player_id: 'p1', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.season).toBe('Career (2 seasons)');
    });

    it('generates correct career label for 7 seasons', () => {
      const seasons = Array.from({ length: 7 }, (_, i) =>
        makePlayer({ id: String(i) }, { player_id: 'p1', season: `201${i}/1${i + 1}` }),
      );
      const result = computeCareerStats(seasons);
      expect(result.season).toBe('Career (7 seasons)');
    });

    it('preserves player_id from first valid season', () => {
      const s1 = makePlayer({ id: 'p1' }, { player_id: 'original-id', season: '2022/23' });
      const s2 = makePlayer({ id: 'p2' }, { player_id: 'other-id', season: '2023/24' });
      const result = computeCareerStats([s1, s2]);
      expect(result.player_id).toBe('original-id');
    });
  });
});

// ─── Mock Fallback (searchPlayers / MOCK_PLAYERS) ─────────────

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

  it('searchUniquePlayers filters mock players by name substring (case-insensitive)', async () => {
    const { searchUniquePlayers } = await import('../lib/data-service');
    const results = await searchUniquePlayers('haa'); // matches "Haaland"
    expect(results.some(p => p.name.toLowerCase().includes('haa'))).toBe(true);
  });

  it('searchUniquePlayers returns empty array for queries under 2 chars', async () => {
    const { searchUniquePlayers } = await import('../lib/data-service');
    const results = await searchUniquePlayers('h');
    expect(results).toEqual([]);
  });

  it('searchUniquePlayers returns empty array for empty string', async () => {
    const { searchUniquePlayers } = await import('../lib/data-service');
    const results = await searchUniquePlayers('');
    expect(results).toEqual([]);
  });

  it('searchAllSeasonsByQuery returns mock players matching name or team', async () => {
    const { searchAllSeasonsByQuery } = await import('../lib/data-service');
    const byTeam = await searchAllSeasonsByQuery('real');
    expect(byTeam.length).toBeGreaterThan(0);
    const byName = await searchAllSeasonsByQuery('mb');
    expect(byName.length).toBeGreaterThan(0);
    expect(await searchAllSeasonsByQuery('x')).toEqual([]);
  });

  it('searchUniquePlayers returns empty array when query length exceeds 50', async () => {
    const { searchUniquePlayers } = await import('../lib/data-service');
    const q = 'a'.repeat(51);
    expect(await searchUniquePlayers(q)).toEqual([]);
  });

  it('searchAllSeasonsByQuery returns empty array when query length exceeds 50', async () => {
    const { searchAllSeasonsByQuery } = await import('../lib/data-service');
    const q = 'b'.repeat(51);
    expect(await searchAllSeasonsByQuery(q)).toEqual([]);
  });

  it('getPlayerSeasons returns empty array for empty player name', async () => {
    const { getPlayerSeasons } = await import('../lib/data-service');
    expect(await getPlayerSeasons('')).toEqual([]);
  });

  it('getPlayerSeasons returns empty array when no mock player matches', async () => {
    const { getPlayerSeasons } = await import('../lib/data-service');
    expect(await getPlayerSeasons('Nobody McNonexistent')).toEqual([]);
  });

  it('getPlayerSeasons matches mock players case-insensitively by name', async () => {
    const { getPlayerSeasons } = await import('../lib/data-service');
    const { MOCK_PLAYERS: mock } = await import('../lib/mock-data');
    const name = mock[0].name;
    const result = await getPlayerSeasons(name.toUpperCase());
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(p => p.name.toLowerCase() === name.toLowerCase())).toBe(true);
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
