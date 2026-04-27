'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Activity, ArrowRightLeft, BarChart3, Table as TableIcon, Target as ScatterIcon, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UIPlayerStats } from '@/types/ui-player';
import { MOCK_PLAYERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { getPlayers, getLeagues, getSeasons } from '@/lib/data-service';
import { isSupabaseConfigured } from '@/lib/supabase';
import { adaptPlayer, aggregateUIStats } from './player-adapters';
import type { TabType } from './types';
import { ExplorerTab } from './explorer-tab';
import { ScatterAnalysis } from './scatter-analysis';
import { ComparisonTab } from './comparison-tab';
import { RankingsTab } from './rankings-tab';

export function MatchMetricsDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('explorer');
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState<string>('All');
  const [compFilter, setCompFilter] = useState<string>('All');
  const [seasonFilter, setSeasonFilter] = useState<string>('2023-2024');
  const [pageSize, setPageSize] = useState<number>(50);
  const [availableComps, setAvailableComps] = useState<string[]>([]);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [playersData, setPlayersData] = useState<UIPlayerStats[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<UIPlayerStats | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<UIPlayerStats | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof UIPlayerStats>('Goals');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const handleSort = (column: keyof UIPlayerStats) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const playersCache = useRef(new Map<string, ReturnType<typeof getPlayers>>());

  const fetchPlayersCached = useCallback((filters: Parameters<typeof getPlayers>[0]) => {
    const f = filters ?? {};
    const key = JSON.stringify(f, Object.keys(f).sort());
    if (playersCache.current.has(key)) {
      return playersCache.current.get(key)!;
    }
    const req = getPlayers(f);
    playersCache.current.set(key, req);
    req.catch(() => playersCache.current.delete(key));
    return req;
  }, []);

  useEffect(() => {
    async function loadStaticData() {
      try {
        const [comps, seasonsList] = await Promise.all([
          getLeagues(),
          getSeasons(),
        ]);
        if (comps.length > 0) setAvailableComps(comps);
        if (seasonsList.length > 0) setAvailableSeasons(seasonsList);
      } catch (err) {
        console.error('Failed to load initial metadata:', err);
        // Fallback to mock data for filters if real data fails
        const mockLeagues = Array.from(new Set(MOCK_PLAYERS.map(p => p.comp))).filter(Boolean) as string[];
        setAvailableComps(mockLeagues);
        setAvailableSeasons(['2023-2024']);
      }
    }
    loadStaticData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPlayersData() {
      try {
        setIsLoading(true);
        const backendPlayers = await fetchPlayersCached({ season: seasonFilter });
        if (cancelled) return;

        if (backendPlayers && backendPlayers.length > 0) {
          const adapted = backendPlayers.map(adaptPlayer);
          setPlayersData(adapted);
          setSelectedPlayer1(adapted[0] || null);
          setSelectedPlayer2(adapted[1] || null);
          
          // If we got players but Supabase isn't configured, we are using mock data
          setIsUsingMockData(!isSupabaseConfigured());
        } else {
          setPlayersData([]);
          setIsUsingMockData(false);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load players:', err);
        if (!cancelled) {
          setPlayersData(MOCK_PLAYERS.map(adaptPlayer));
          setIsUsingMockData(true);
          setError('Offline: Using demo statistics');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    loadPlayersData();
    return () => { cancelled = true; };
  }, [seasonFilter, fetchPlayersCached]);

  const explorerFilteredUnsorted = useMemo(() => {
    const filtered = playersData.filter((p) => {
      const matchesSearch =
        p.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.squad.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPos = posFilter === 'All' || p.pos === posFilter;
      const matchesComp = compFilter === 'All' || p.comp === compFilter;
      const matchesSeason = seasonFilter === 'All' || p.season === seasonFilter;
      return matchesSearch && matchesPos && matchesComp && matchesSeason;
    });

    if (seasonFilter === 'All') {
      const map = new Map<string, UIPlayerStats[]>();
      for (const p of filtered) {
        if (!map.has(p.player)) {
          map.set(p.player, []);
        }
        map.get(p.player)!.push(p);
      }
      return Array.from(map.values()).map((seasons) => aggregateUIStats(seasons));
    }

    return filtered;
  }, [searchTerm, posFilter, compFilter, seasonFilter, playersData]);

  const filteredPlayers = useMemo(() => {
    return [...explorerFilteredUnsorted].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const aNum = (aVal as number) ?? 0;
      const bNum = (bVal as number) ?? 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [explorerFilteredUnsorted, sortColumn, sortDirection]);

  const exportExplorerCsv = () => {
    const rows = filteredPlayers.slice(0, pageSize);
    const headers = [
      'Player',
      'Nation',
      'Pos',
      'Squad',
      'Comp',
      'Season',
      'MP',
      'Goals',
      'Assists',
      'xG',
      'PrgP',
      'PrgC',
      'TklW',
      'Pass%',
    ] as const;
    const lines = [
      headers.join(','),
      ...rows.map((p) =>
        [
          JSON.stringify(p.player),
          JSON.stringify(p.nation),
          JSON.stringify(p.pos),
          JSON.stringify(p.squad),
          JSON.stringify(p.comp),
          JSON.stringify(p.season),
          p['Matches Played'],
          p.Goals,
          p.Assists,
          p['Expected Goals'],
          p['Progressive Passes'],
          p['Progressive Carries'],
          p['Tackles Won'],
          p['Pass completion %'],
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'match-metrics-explorer.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-slate-900 p-1.5">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-black uppercase tracking-tighter">Match Metrics</span>
              </div>
              <div className="hidden gap-1 md:flex">
                {[
                  { id: 'explorer' as const, label: 'Data Explorer', icon: TableIcon },
                  { id: 'scatter' as const, label: 'Scatter Analysis', icon: ScatterIcon },
                  { id: 'comparison' as const, label: 'Comparison', icon: ArrowRightLeft },
                  { id: 'rankings' as const, label: 'Rankings', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {error && !isUsingMockData ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/50 p-12 text-center"
            >
              <div className="mb-4 rounded-2xl bg-red-100 p-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mb-2 text-xl font-black text-red-900">Something went wrong</h2>
              <p className="mb-8 max-w-md font-medium text-red-700/80">
                {error}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-red-300 active:scale-95"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </button>
            </motion.div>
          ) : isLoading && playersData.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[400px] flex-col items-center justify-center"
            >
              <div className="relative mb-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                <Activity className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-slate-900" />
              </div>
              <p className="font-bold uppercase tracking-widest text-slate-400">Loading Analytics...</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {isUsingMockData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-6 py-4 shadow-sm shadow-amber-100/50">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-100 p-2">
                        {isLoading ? (
                          <RefreshCcw className="h-4 w-4 animate-spin text-amber-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-900">
                          {isLoading ? 'Reconnecting to Server...' : 'Connection Failed'}
                        </p>
                        <p className="text-xs font-medium text-amber-700/80">
                          {isLoading 
                            ? 'Attempting to fetch live statistics from the database...'
                            : 'Showing demo statistics as the server is currently unreachable.'}
                        </p>
                      </div>
                    </div>
                    <button
                      disabled={isLoading}
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-900 shadow-sm transition-all hover:bg-amber-100 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-900 border-t-transparent" />
                          Retrying...
                        </>
                      ) : (
                        'Retry Connection'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'explorer' && (
                <ExplorerTab
                  seasonFilter={seasonFilter}
                  setSeasonFilter={setSeasonFilter}
                  compFilter={compFilter}
                  setCompFilter={setCompFilter}
                  posFilter={posFilter}
                  setPosFilter={setPosFilter}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  availableSeasons={availableSeasons}
                  availableComps={availableComps}
                  filteredPlayers={filteredPlayers}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  handleSort={handleSort}
                  exportExplorerCsv={exportExplorerCsv}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              )}

              {activeTab === 'scatter' && (
                <motion.div
                  key="scatter"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Scatter Analysis</h2>
                    <p className="text-sm text-slate-500">
                      Correlate any two metrics to find outliers and performance clusters.
                    </p>
                  </div>
                  <ScatterAnalysis
                    availableComps={availableComps}
                    availableSeasons={availableSeasons}
                    fetchPlayersCached={fetchPlayersCached}
                  />
                </motion.div>
              )}

              {activeTab === 'comparison' && (
                <ComparisonTab
                  selectedPlayer1={selectedPlayer1}
                  selectedPlayer2={selectedPlayer2}
                  onSelectPlayer1={setSelectedPlayer1}
                  onSelectPlayer2={setSelectedPlayer2}
                />
              )}

              {activeTab === 'rankings' && (
                <RankingsTab
                  availableSeasons={availableSeasons}
                  availableComps={availableComps}
                  fetchPlayersCached={fetchPlayersCached}
                />
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mx-auto mt-20 max-w-7xl border-t border-slate-200 px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-900 p-1">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-tighter">Match Metrics</span>
          </div>
          <p className="text-xs font-medium text-slate-400">
            © 2026 Match Metrics Analytics. All data provided for educational purposes.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
              Twitter
            </a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
              API Docs
            </a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
