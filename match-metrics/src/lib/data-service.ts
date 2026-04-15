import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_PLAYERS } from './mock-data';
import { Player, PlayerStats } from '@/types/football';

/** Internal type to represent raw Supabase player row with relation */
type PlayerRow = Omit<Player, 'stats'> & { stats: PlayerStats | PlayerStats[] };

/** Row shape returned by player search select (partial columns, no `created_at`) */
type PlayerSearchRow = {
  name: string;
  stats: Pick<PlayerStats, 'season'> | Pick<PlayerStats, 'season'>[];
};

type PlayerQueryFilters = {
  comp?: string;
  season?: string;
  pos?: string;
  team?: string;
  nation?: string;
  minMinutes?: number;
  minMatches?: number;
  minAge?: number;
  maxAge?: number;
};

function seasonFromJoinedStats(row: {
  stats?: Pick<PlayerStats, 'season'> | Pick<PlayerStats, 'season'>[] | PlayerStats | PlayerStats[];
}): string | undefined {
  const { stats } = row;
  if (!stats) return undefined;
  if (Array.isArray(stats)) return stats[0]?.season;
  return stats.season;
}

/**
 * Helper to build an accent-insensitive regex for Supabase imatch
 */
function buildSearchRegex(query: string): string {
  const map: Record<string, string> = {
    a: '[aáàâãäåæAÁÀÂÃÄÅÆ]',
    e: '[eéèêëEÉÈÊË]',
    i: '[iíìîïIÍÌÎÏ]',
    o: '[oóòôõöøOÓÒÔÕÖØ]',
    u: '[uúùûüUÚÙÛÜ]',
    c: '[cçCÇ]',
    n: '[nñNÑ]',
    s: '[sšSŠ]',
    z: '[zžZŽ]',
    y: '[yýÿYÝŸ]'
  };
  let regexStr = '';
  for (const char of query) {
    const key = char.toLowerCase();
    if (map[key]) {
      regexStr += map[key];
    } else {
      regexStr += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return `.*${regexStr}.*`;
}

function mockPlayersMatchingSearch(query: string): Player[] {
  const q = query.toLowerCase();
  return MOCK_PLAYERS.filter(
    p =>
      p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
  );
}

/**
 * Search unique players by name (deduplicated, returns latest season entry).
 * Returns up to 20 unique matches.
 */
export const searchUniquePlayers = async (query: string): Promise<Player[]> => {
  if (!query || query.length < 2 || query.length > 50) return [];

  if (!isSupabaseConfigured()) {
    return mockPlayersMatchingSearch(query);
  }

  try {
    // Fetch all matches, then deduplicate client-side (picking the latest season)
    const { data, error } = await supabase
      .from('players')
      .select('id, name, team, position, nationality, comp, age, born, image_url, stats:player_stats!inner(season)')
      .filter('name', 'imatch', buildSearchRegex(query))
      .limit(100);

    if (error || !data) return [];

    const rows = data as PlayerSearchRow[];

    // Sort by season descending so the latest club appears first
    rows.sort((a, b) => {
      const sA = seasonFromJoinedStats(a);
      const sB = seasonFromJoinedStats(b);
      return (sB || '').localeCompare(sA || '');
    });

    // Deduplicate by player name — keep the first occurrence for display
    const seen = new Map<string, PlayerSearchRow>();
    for (const p of rows) {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, p);
      }
    }

    const uniquePlayers = Array.from(seen.values()).slice(0, 20);

    return uniquePlayers.map(p => ({
      ...p,
      stats: {} as PlayerStats,
    })) as Player[];
  } catch (e) {
    console.error('Error in searchUniquePlayers:', e);
    return [];
  }
};

/**
 * Fetch all season entries for a given player name.
 * Returns an array of Player objects, one per season, sorted newest first.
 */
export const getPlayerSeasons = async (playerName: string): Promise<Player[]> => {
  if (!isSupabaseConfigured()) {
    return MOCK_PLAYERS.filter(p =>
      p.name.toLowerCase() === playerName.toLowerCase()
    );
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        stats:player_stats!inner(*)
      `)
      .eq('name', playerName);

    if (error || !data || data.length === 0) return [];

    // Sort by season descending
    data.sort((a: PlayerRow, b: PlayerRow) => {
      const sA = seasonFromJoinedStats(a);
      const sB = seasonFromJoinedStats(b);
      return (sB || '').localeCompare(sA || '');
    });

    return data.map((p: PlayerRow) => ({
      ...p,
      stats: Array.isArray(p.stats) ? (p.stats[0] || {}) : (p.stats || {}),
    })) as Player[];
  } catch (e) {
    console.error('Error in getPlayerSeasons:', e);
    return [];
  }
};

/**
 * Compute career (aggregate) stats from multiple season entries.
 * Sums counting stats, averages rate stats.
 */
export const computeCareerStats = (seasons: Player[]): PlayerStats => {
  if (!seasons.length) return {} as PlayerStats;
  if (seasons.length === 1) return seasons[0].stats;

  const validSeasons = seasons.filter(s => s.stats && Object.keys(s.stats).length > 0);
  if (!validSeasons.length) return {} as PlayerStats;

  const n = validSeasons.length;

  // Counting stats: sum (const tuple so indexed writes type-check)
  const sumKeys = [
    'matches_played', 'goals', 'assists', 'goals_assists', 'xg', 'exp_npg',
    'non_penalty_goals', 'penalty_kicks_made', 'progressive_carries',
    'progressive_passes', 'tackles_attempted', 'tackles_won',
    'shots_blocked', 'passes_blocked', 'interceptions', 'clearances',
    'errors_made', 'goals_against', 'saves', 'clean_sheets',
    'passes_completed', 'passes_attempted', 'key_passes',
    'passes_final_third', 'passes_penalty_area', 'touches_def_pen',
    'take_ons_attempted', 'take_ons_tackled', 'carries_prgc',
    'carries_final_third', 'carries_penalty_area', 'possessions_lost',
    'goals_scored', 'total_shots', 'crosses_stopped', 'total_minutes',
  ] as const satisfies readonly (keyof PlayerStats)[];

  // Rate stats: average
  const avgKeys = [
    'goals_per_90', 'assists_per_90',
    'dribbles_tackled_pct', 'goals_against_per_90', 'saves_pct',
    'clean_sheets_pct', 'penalty_saves_pct', 'pass_completion_pct',
    'prog_passes_dist', 'short_pass_pct', 'medium_pass_pct', 'long_pass_pct',
    'take_ons_success_pct', 'shots_on_target_pct', 'shots_per_90',
    'goals_per_shot', 'goals_per_shot_on_target', 'aerial_duels_won_pct',
    'sca_per_90', 'gca_per_90',
  ] as const satisfies readonly (keyof PlayerStats)[];

  const result: Partial<PlayerStats> = {
    player_id: validSeasons[0].stats.player_id,
    season: `Career (${n} seasons)`,
  };

  // 1. Counting stats: absolute sum
  for (const key of sumKeys) {
    result[key] = validSeasons.reduce(
      (sum, s) => sum + (Number(s.stats[key]) || 0),
      0
    );
  }

  // 2. Rate stats: weighted average based on matches_played
  const totalMatches = validSeasons.reduce((sum, s) => sum + (Number(s.stats.matches_played) || 0), 0);

  for (const key of avgKeys) {
    if (totalMatches > 0) {
      const weightedSum = validSeasons.reduce((sum, s) => {
        const value = Number(s.stats[key]) || 0;
        const weight = Number(s.stats.matches_played) || 0;
        return sum + (value * weight);
      }, 0);
      result[key] = weightedSum / totalMatches;
    } else {
      // Fallback to simple average if no matches played
      const total = validSeasons.reduce((sum, s) => sum + (Number(s.stats[key]) || 0), 0);
      result[key] = total / n;
    }
  }

  return result as PlayerStats;
};

// ---- Legacy exports for backward compatibility ----

export const getPlayers = async (
  filters: PlayerQueryFilters = {}
): Promise<Player[]> => {
  if (!isSupabaseConfigured()) return MOCK_PLAYERS;
  try {
    let allData: PlayerRow[] = [];
    let from = 0;
    const step = 1000;
    
    while (true) {
      let query = supabase
        .from('players')
        .select('*, stats:player_stats!inner(*)')
        .order('name', { ascending: true })
        .range(from, from + step - 1);
        
      if (filters.comp && filters.comp !== 'All') {
        query = query.eq('comp', filters.comp);
      }
      if (filters.season && filters.season !== 'All') {
        query = query.eq('stats.season', filters.season);
      }
      if (filters.pos && filters.pos !== 'All') {
        query = query.eq('position', filters.pos);
      }
      if (filters.team && filters.team !== 'All') {
        query = query.ilike('team', `%${filters.team}%`);
      }
      if (filters.nation && filters.nation !== 'All') {
        query = query.eq('nationality', filters.nation);
      }
      if (typeof filters.minMinutes === 'number' && filters.minMinutes > 0) {
        query = query.gte('stats.total_minutes', filters.minMinutes);
      }
      if (typeof filters.minMatches === 'number' && filters.minMatches > 0) {
        query = query.gte('stats.matches_played', filters.minMatches);
      }
      if (typeof filters.minAge === 'number' && filters.minAge > 0) {
        query = query.gte('age', filters.minAge);
      }
      if (typeof filters.maxAge === 'number' && filters.maxAge < 50) {
        query = query.lte('age', filters.maxAge);
      }

      const { data, error } = await query;
        
      if (error || !data) {
        break;
      }
      
      allData = allData.concat(data);
      if (data.length < step) {
        break; // Reached the end
      }
      from += step;
      // Safety limit exactly as original intent, but scaled up a bit if needed.
      if (allData.length >= 25000) {
        break;
      }
    }

    if (allData.length === 0) return MOCK_PLAYERS;

    return allData.map((p: PlayerRow) => ({
      ...p,
      stats: Array.isArray(p.stats) ? (p.stats[0] || {}) : (p.stats || {}),
    })) as Player[];
  } catch {
    return MOCK_PLAYERS;
  }
};

export const searchAllSeasonsByQuery = async (query: string): Promise<Player[]> => {
  if (!query || query.length < 2 || query.length > 50) return [];

  if (!isSupabaseConfigured()) {
    return mockPlayersMatchingSearch(query).map(p => ({
      ...p,
      stats: Array.isArray(p.stats) ? (p.stats[0] || {}) : (p.stats || {}),
    })) as Player[];
  }

  try {
    const { data, error } = await supabase
      .from('players')
      .select('*, stats:player_stats(*)')
      .filter('name', 'imatch', buildSearchRegex(query))
      .limit(200);

    if (error || !data) return [];
    
    return data.map((p: PlayerRow) => ({
      ...p,
      stats: Array.isArray(p.stats) ? (p.stats[0] || {}) : (p.stats || {}),
    })) as Player[];
  } catch {
    return [];
  }
};

export const getLeagues = async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) {
    const leagues = MOCK_PLAYERS.map(p => p.comp).filter(Boolean) as string[];
    return Array.from(new Set(leagues)).sort();
  }
  try {
    const { data, error } = await supabase.from('leagues_cache').select('comp');
    if (error || !data) return [];
    return data.map(d => d.comp).sort();
  } catch {
    return [];
  }
};

export const getSeasons = async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) {
    const seasons = MOCK_PLAYERS.map(p => Array.isArray(p.stats) ? p.stats[0]?.season : p.stats?.season).filter(Boolean) as string[];
    return Array.from(new Set(seasons)).sort((a, b) => b.localeCompare(a));
  }
  try {
    const { data, error } = await supabase.from('seasons_cache').select('season');
    if (error || !data) return [];
    return data.map(d => d.season).sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
};

export const searchPlayers = searchUniquePlayers;
