'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Activity, ArrowRightLeft, BarChart3, Table as TableIcon, Target as ScatterIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PlayerStats as UIPlayerStats } from '@/types/ui-player';
import { MOCK_PLAYERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { getPlayers, getLeagues, getSeasons } from '@/lib/data-service';
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
  const [playersData, setPlayersData] = useState<UIPlayerStats[]>(() => MOCK_PLAYERS.map(adaptPlayer));
  const [selectedPlayer1, setSelectedPlayer1] = useState<UIPlayerStats | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<UIPlayerStats | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof UIPlayerStats>('Goals');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof UIPlayerStats) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  useEffect(() => {
    async function loadData() {
      const [backendPlayers, comps, seasonsList] = await Promise.all([
        getPlayers({ season: seasonFilter, comp: compFilter, pos: posFilter }),
        getLeagues(),
        getSeasons(),
      ]);
      if (backendPlayers && backendPlayers.length > 0) {
        const adapted = backendPlayers.map(adaptPlayer);
        setPlayersData(adapted);
        setSelectedPlayer1(adapted[0] || null);
        setSelectedPlayer2(adapted[1] || null);
      }
      setAvailableComps(comps);
      setAvailableSeasons(seasonsList);
    }
    loadData();
  }, [seasonFilter, compFilter, posFilter]);

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
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-48 rounded-lg border-none bg-slate-100 py-1.5 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
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
              <ScatterAnalysis availableComps={availableComps} availableSeasons={availableSeasons} />
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

          {activeTab === 'rankings' && <RankingsTab explorerFilteredUnsorted={explorerFilteredUnsorted} />}
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
