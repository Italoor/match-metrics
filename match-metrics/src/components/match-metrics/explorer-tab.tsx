'use client';

import { ChevronDown, Download, Search } from 'lucide-react';
import { motion } from 'motion/react';
import type { UIPlayerStats } from '@/types/ui-player';

type ExplorerTabProps = {
  seasonFilter: string;
  setSeasonFilter: (v: string) => void;
  compFilter: string;
  setCompFilter: (v: string) => void;
  posFilter: string;
  setPosFilter: (v: string) => void;
  pageSize: number;
  setPageSize: (v: number) => void;
  availableSeasons: string[];
  availableComps: string[];
  filteredPlayers: UIPlayerStats[];
  sortColumn: keyof UIPlayerStats;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: keyof UIPlayerStats) => void;
  exportExplorerCsv: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
};

export function ExplorerTab({
  seasonFilter,
  setSeasonFilter,
  compFilter,
  setCompFilter,
  posFilter,
  setPosFilter,
  pageSize,
  setPageSize,
  availableSeasons,
  availableComps,
  filteredPlayers,
  sortColumn,
  sortDirection,
  handleSort,
  exportExplorerCsv,
  searchTerm,
  setSearchTerm,
}: ExplorerTabProps) {
  return (
    <motion.div
      key="explorer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="mb-2 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Data Explorer</h2>
          <p className="text-sm text-slate-500">Browse and filter detailed player statistics across the league.</p>
        </div>
        <div className="flex w-full items-end gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
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
              onChange={(e) => setCompFilter(e.target.value)}
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
              onChange={(e) => setPosFilter(e.target.value)}
            >
              <option value="All">All Positions</option>
              <option value="FW">Forwards</option>
              <option value="MF">Midfielders</option>
              <option value="DF">Defenders</option>
              <option value="GK">Goalkeepers</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 Players</option>
              <option value={20}>20 Players</option>
              <option value={50}>50 Players</option>
              <option value={100}>100 Players</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-bold shadow-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 md:w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={exportExplorerCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th
                  className="w-[25%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  onClick={() => handleSort('player')}
                >
                  <div className="flex items-center gap-1">
                    <span>Player</span>
                    <span className={sortColumn === 'player' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[25%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  onClick={() => handleSort('squad')}
                >
                  <div className="flex items-center gap-1">
                    <span>Squad</span>
                    <span className={sortColumn === 'squad' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Matches Played"
                  onClick={() => handleSort('Matches Played')}
                >
                  <div className="flex items-center gap-1">
                    <span>MP</span>
                    <span className={sortColumn === 'Matches Played' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Goals"
                  onClick={() => handleSort('Goals')}
                >
                  <div className="flex items-center gap-1">
                    <span>Gls</span>
                    <span className={sortColumn === 'Goals' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Assists"
                  onClick={() => handleSort('Assists')}
                >
                  <div className="flex items-center gap-1">
                    <span>Ast</span>
                    <span className={sortColumn === 'Assists' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Expected Goals"
                  onClick={() => handleSort('Expected Goals')}
                >
                  <div className="flex items-center gap-1">
                    <span>xG</span>
                    <span className={sortColumn === 'Expected Goals' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Progressive Passes"
                  onClick={() => handleSort('Progressive Passes')}
                >
                  <div className="flex items-center gap-1">
                    <span>PrgP</span>
                    <span className={sortColumn === 'Progressive Passes' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Progressive Carries"
                  onClick={() => handleSort('Progressive Carries')}
                >
                  <div className="flex items-center gap-1">
                    <span>PrgC</span>
                    <span className={sortColumn === 'Progressive Carries' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[5%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Tackles Won"
                  onClick={() => handleSort('Tackles Won')}
                >
                  <div className="flex items-center gap-1">
                    <span>TklW</span>
                    <span className={sortColumn === 'Tackles Won' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th
                  className="w-[15%] cursor-pointer whitespace-nowrap p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700"
                  title="Pass Completion Percentage"
                  onClick={() => handleSort('Pass completion %')}
                >
                  <div className="flex items-center gap-1">
                    <span>Pass%</span>
                    <span className={sortColumn === 'Pass completion %' ? '' : 'invisible'}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlayers.slice(0, pageSize).map((player) => (
                <tr
                  key={`${player.player}|${player.season}|${player.squad}`}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-400">
                        {player.player[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{player.player}</div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          {player.nation} • {player.pos}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">{player.squad}</td>
                  <td className="p-4 font-mono text-sm text-slate-500">{player['Matches Played']}</td>
                  <td className="p-4 font-mono font-bold text-blue-600">{player.Goals}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600">{player.Assists}</td>
                  <td className="p-4 font-mono text-slate-600">{player['Expected Goals']}</td>
                  <td className="p-4 font-mono text-slate-600">{player['Progressive Passes']}</td>
                  <td className="p-4 font-mono text-slate-600">{player['Progressive Carries']}</td>
                  <td className="p-4 font-mono text-slate-600">{player['Tackles Won']}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{player['Pass completion %']}%</span>
                      <div className="h-1.5 w-16 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${player['Pass completion %']}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
