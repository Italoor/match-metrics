'use client';

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import type { UIPlayerStats } from '@/types/ui-player';
import { getPlayers } from '@/lib/data-service';
import { adaptPlayer, aggregateUIStats } from './player-adapters';

const RANKING_METRICS = [
  { title: 'Goals per 90', metric: 'Goals p 90' as const },
  { title: 'Assists per 90', metric: 'Assists p 90' as const },
  { title: 'Successful Take-Ons %', metric: '% Successful take-ons' as const },
  { title: 'Shot-Creating Actions', metric: 'Shot creating actions p 90' as const },
  { title: 'Goal-Creating Actions', metric: 'Goal creating actions p 90' as const },
  { title: 'Progressive Passes per 90', metric: 'Progressive Passes p 90' as const },
  { title: 'Aerial Duel Win %', metric: '% Aerial Duels won' as const },
  { title: 'Dribbles Tackled %', metric: '% Dribbles tackled' as const },
  { title: 'Pass Completion %', metric: 'Pass completion %' as const },
] as const;

const TOP_N = 5;
const MIN_MINUTES = 1040;

type RankingsTabProps = {
  availableSeasons: string[];
  availableComps: string[];
  fetchPlayersCached: (filters: Parameters<typeof getPlayers>[0]) => ReturnType<typeof getPlayers>;
};

export function RankingsTab({ availableSeasons, availableComps, fetchPlayersCached }: RankingsTabProps) {
  const [seasonFilter, setSeasonFilter] = useState<string>('All');
  const [compFilter, setCompFilter] = useState<string>('All');
  const [posFilter, setPosFilter] = useState<string>('All');
  const [rawPlayers, setRawPlayers] = useState<UIPlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const backendPlayers = await fetchPlayersCached({
          season: seasonFilter,
          minMinutes: MIN_MINUTES,
        });
        if (!cancelled) {
          setRawPlayers(backendPlayers.map(adaptPlayer));
        }
      } catch (err) {
        console.error('Failed to load rankings:', err);
        if (!cancelled) {
          setError('Failed to load rankings data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [seasonFilter, fetchPlayersCached]);

  // Filter once — shared across all ranking cards
  const eligiblePlayers = useMemo(() => {
    let filtered = rawPlayers;

    if (compFilter !== 'All') {
      filtered = filtered.filter((p) => p.comp === compFilter);
    }
    if (posFilter !== 'All') {
      filtered = filtered.filter((p) => p.pos === posFilter);
    }

    if (seasonFilter === 'All') {
      const map = new Map<string, UIPlayerStats[]>();
      for (const p of filtered) {
        if (!map.has(p.player)) map.set(p.player, []);
        map.get(p.player)!.push(p);
      }
      filtered = Array.from(map.values()).map((seasons) => aggregateUIStats(seasons));
    }

    // Apply minutes threshold once (already pushed to backend, but
    // needed for client-side "All Seasons" aggregation path)
    return filtered.filter((p) => (p.Minutes || 0) >= MIN_MINUTES);
  }, [rawPlayers, compFilter, posFilter, seasonFilter]);

  // Pre-compute the top-5 list for every metric in one pass
  const rankingsByMetric = useMemo(() => {
    const result = new Map<string, UIPlayerStats[]>();

    for (const { metric } of RANKING_METRICS) {
      const sorted = eligiblePlayers
        .slice()                                         // shallow copy, no spread
        .sort(
          (a, b) =>
            Number(b[metric as keyof UIPlayerStats] ?? 0) -
            Number(a[metric as keyof UIPlayerStats] ?? 0),
        )
        .slice(0, TOP_N);
      result.set(metric, sorted);
    }

    return result;
  }, [eligiblePlayers]);

  // Wrap filter changes in startTransition so the UI stays responsive
  const handleCompChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => startTransition(() => setCompFilter(e.target.value)),
    [],
  );
  const handlePosChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => startTransition(() => setPosFilter(e.target.value)),
    [],
  );

  return (
    <motion.div
      key="rankings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Top Performers</h2>
          <p className="text-sm text-slate-500">
            Rankings for players with a minimum of 1,040 minutes played (approx. 11.5 matches).
          </p>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          <div className="relative">
            <select
              className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
            >
              <option value="All">All Seasons</option>
              {availableSeasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
              value={compFilter}
              onChange={handleCompChange}
            >
              <option value="All">All Leagues</option>
              {availableComps.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
              value={posFilter}
              onChange={handlePosChange}
            >
              <option value="All">All Positions</option>
              <option value="FW">Forwards</option>
              <option value="MF">Midfielders</option>
              <option value="DF">Defenders</option>
              <option value="GK">Goalkeepers</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/50 p-12 text-center">
          <AlertCircle className="mb-4 h-8 w-8 text-red-600" />
          <h3 className="mb-2 text-lg font-black text-red-900">Rankings Unavailable</h3>
          <p className="mb-4 text-sm font-medium text-red-700/80">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-8 lg:grid-cols-3 transition-opacity duration-200 ${isPending ? 'opacity-60' : ''}`}>
          {RANKING_METRICS.map((rank) => {
            const topPlayers = rankingsByMetric.get(rank.metric) ?? [];
            return (
              <div key={rank.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-400">{rank.title}</h3>
                <div className="space-y-4">
                  {topPlayers.map((p, i) => (
                    <div
                      key={`${p.player}|${p.season}|${rank.metric}`}
                      className="group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-4 text-xs font-black text-slate-300">{i + 1}</span>
                        <div>
                          <p className="text-sm font-bold transition-colors group-hover:text-blue-600">{p.player}</p>
                          <p className="text-[10px] font-bold uppercase text-slate-400">{p.squad}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {String(p[rank.metric as keyof UIPlayerStats])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
