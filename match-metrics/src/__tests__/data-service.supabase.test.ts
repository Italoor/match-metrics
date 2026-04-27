/**
 * Unit tests for data-service Supabase branches (isSupabaseConfigured === true).
 * Uses a chainable PostgREST-style mock; keep isolated from data-service.test.ts
 * which mocks Supabase off.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type QueryResult = { data: unknown; error: unknown };

const ctx = vi.hoisted(() => {
  const playersQueue: QueryResult[] = [];

  function makeChain(getResult: () => QueryResult) {
    const chain: Record<string, unknown> = {};
    const link = () => chain;
    for (const m of ['select', 'filter', 'limit', 'eq', 'ilike', 'gte', 'lte', 'order', 'range']) {
      chain[m] = vi.fn(link);
    }
    chain.then = (onFulfilled: (v: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(getResult()).then(onFulfilled, onRejected);
    chain.catch = (onRejected: (e: unknown) => unknown) => Promise.resolve(getResult()).catch(onRejected);
    return chain;
  }

  const api = {
    playersQueue,
    leaguesResult: { data: null, error: null } as QueryResult,
    seasonsResult: { data: null, error: null } as QueryResult,
    throwFrom: false,

    reset() {
      playersQueue.length = 0;
      api.leaguesResult = { data: null, error: null };
      api.seasonsResult = { data: null, error: null };
      api.throwFrom = false;
    },

    enqueuePlayers(result: QueryResult) {
      playersQueue.push(result);
    },

    dequeuePlayers(): QueryResult {
      const next = playersQueue.shift();
      if (!next) return { data: [], error: null };
      return next;
    },

    from(table: string) {
      if (api.throwFrom) throw new Error('network');
      if (table === 'players') {
        return makeChain(() => api.dequeuePlayers());
      }
      if (table === 'leagues_cache') {
        return makeChain(() => api.leaguesResult);
      }
      if (table === 'seasons_cache') {
        return makeChain(() => api.seasonsResult);
      }
      return makeChain(() => ({ data: null, error: { message: 'unknown table' } }));
    },
  };

  return api;
});

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: { from: (t: string) => ctx.from(t) },
}));

describe('data-service with Supabase configured', () => {
  beforeEach(() => {
    ctx.reset();
    vi.resetModules();
  });



  describe('searchAllSeasonsByQuery', () => {
    it('returns empty array when Supabase returns an error', async () => {
      ctx.enqueuePlayers({ data: null, error: { message: 'fail' } });
      const { searchAllSeasonsByQuery } = await import('../lib/data-service');
      expect(await searchAllSeasonsByQuery('ab')).toEqual([]);
    });

    it('maps stats array to the first stats row', async () => {
      const row = {
        id: '1',
        name: 'X',
        team: 'T',
        position: 'Forward',
        nationality: 'N',
        image_url: '',
        stats: [
          { season: '2023/24', goals: 9, player_id: '1' },
          { season: '2022/23', goals: 3, player_id: '1' },
        ],
      };
      ctx.enqueuePlayers({ data: [row], error: null });
      const { searchAllSeasonsByQuery } = await import('../lib/data-service');
      const result = await searchAllSeasonsByQuery('Xy');
      expect(result).toHaveLength(1);
      expect(result[0].stats.season).toBe('2023/24');
      expect(result[0].stats.goals).toBe(9);
    });
  });



  describe('getPlayers', () => {
    it('returns mapped players when a single page is shorter than the step size', async () => {
      const row = {
        id: '1',
        name: 'A',
        team: 'T',
        position: 'Forward',
        nationality: 'N',
        image_url: '',
        stats: [{ season: '2023/24', goals: 2, player_id: '1' }],
      };
      ctx.enqueuePlayers({ data: [row], error: null });
      const { getPlayers } = await import('../lib/data-service');
      const result = await getPlayers({});
      expect(result).toHaveLength(1);
      expect(result[0].stats.goals).toBe(2);
    });

    it('falls back to mock players when the first query errors', async () => {
      const { MOCK_PLAYERS } = await import('../lib/mock-data');
      ctx.enqueuePlayers({ data: null, error: { message: 'fail' } });
      const { getPlayers: getPlayersFn } = await import('../lib/data-service');
      const result = await getPlayersFn({});
      expect(result.length).toBe(MOCK_PLAYERS.length);
      expect(result.map(p => p.id).sort()).toEqual(MOCK_PLAYERS.map(p => p.id).sort());
    });

    it('paginates until a page returns fewer than step rows', async () => {
      const page1 = Array.from({ length: 1000 }, (_, i) => ({
        id: `a-${i}`,
        name: `P${i}`,
        team: 'T',
        position: 'Forward',
        nationality: 'N',
        image_url: '',
        stats: [{ season: '2023/24', goals: 0, player_id: `a-${i}` }],
      }));
      const page2 = [{ id: 'b', name: 'Last', team: 'T', position: 'Forward', nationality: 'N', image_url: '', stats: [{ season: '2023/24', goals: 1, player_id: 'b' }] }];
      ctx.enqueuePlayers({ data: page1, error: null });
      ctx.enqueuePlayers({ data: page2, error: null });
      const { getPlayers } = await import('../lib/data-service');
      const result = await getPlayers({});
      expect(result.length).toBe(1001);
      expect(result.some(p => p.id === 'b')).toBe(true);
    });
  });

  describe('getLeagues', () => {
    it('maps and sorts league names from leagues_cache', async () => {
      ctx.leaguesResult = { data: [{ comp: 'Beta' }, { comp: 'Alpha' }], error: null };
      const { getLeagues } = await import('../lib/data-service');
      expect(await getLeagues()).toEqual(['Alpha', 'Beta']);
    });

    it('returns empty array when Supabase returns an error', async () => {
      ctx.leaguesResult = { data: null, error: { message: 'x' } };
      const { getLeagues } = await import('../lib/data-service');
      expect(await getLeagues()).toEqual([]);
    });

    it('returns empty array when from() throws', async () => {
      ctx.throwFrom = true;
      const { getLeagues } = await import('../lib/data-service');
      expect(await getLeagues()).toEqual([]);
    });
  });

  describe('getSeasons', () => {
    it('maps and sorts seasons descending', async () => {
      ctx.seasonsResult = { data: [{ season: '2021/22' }, { season: '2023/24' }], error: null };
      const { getSeasons } = await import('../lib/data-service');
      expect(await getSeasons()).toEqual(['2023/24', '2021/22']);
    });

    it('returns empty array when Supabase returns an error', async () => {
      ctx.seasonsResult = { data: null, error: { message: 'x' } };
      const { getSeasons } = await import('../lib/data-service');
      expect(await getSeasons()).toEqual([]);
    });

    it('returns empty array when from() throws', async () => {
      ctx.throwFrom = true;
      const { getSeasons } = await import('../lib/data-service');
      expect(await getSeasons()).toEqual([]);
    });
  });
});
