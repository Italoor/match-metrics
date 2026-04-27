import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_PLAYERS } from './mock-data';
import { Player, PlayerStats } from '@/types/football';

/** Internal type to represent raw Supabase player row with relation */
type PlayerRow = Omit<Player, 'stats'> & { stats: PlayerStats | PlayerStats[] };



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
        
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      if (!data) break;
      
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

    if (allData.length === 0) return [];

    return allData.map((p: PlayerRow) => ({
      ...p,
      stats: Array.isArray(p.stats) ? (p.stats[0] || {}) : (p.stats || {}),
    })) as Player[];
  } catch (err) {
    console.error('Data service error:', err);
    throw err;
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


