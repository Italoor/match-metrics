'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import { Target, Filter, Activity, Target as ScatterIcon, AlertCircle, RefreshCcw } from 'lucide-react';
import type { UIPlayerStats } from '@/types/ui-player';
import { getPlayers } from '@/lib/data-service';
import { NUMERIC_METRICS } from './constants';
import { adaptPlayer, aggregateUIStats } from './player-adapters';
import { CustomTooltip } from './custom-tooltip';

type ScatterAnalysisProps = {
  availableComps: string[];
  availableSeasons: string[];
  fetchPlayersCached: (filters: Parameters<typeof getPlayers>[0]) => ReturnType<typeof getPlayers>;
};

export function ScatterAnalysis({ availableComps, availableSeasons, fetchPlayersCached }: ScatterAnalysisProps) {
  const [xAxis, setXAxis] = useState<keyof UIPlayerStats>('Expected Goals');
  const [yAxis, setYAxis] = useState<keyof UIPlayerStats>('Goals');

  const [seasonFilter, setSeasonFilter] = useState<string>('All');
  const [compFilter, setCompFilter] = useState<string>('All');
  const [posFilter, setPosFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [nationFilter, setNationFilter] = useState<string>('All');
  const [minMinutes, setMinMinutes] = useState<number>(0);
  const [minMatches, setMinMatches] = useState<number>(0);
  const [minAge, setMinAge] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(50);
  const [minXValue, setMinXValue] = useState<number | ''>('');
  const [minYValue, setMinYValue] = useState<number | ''>('');

  const [players, setPlayers] = useState<UIPlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScatterData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHasApplied(true);
      const result = await fetchPlayersCached({
        comp: compFilter,
        season: seasonFilter,
        pos: posFilter,
        team: teamFilter,
        nation: nationFilter,
        minMinutes,
        minMatches,
        minAge,
        maxAge,
      });
      const adapted = result.map(adaptPlayer);
      const teamsFromResult = new Set<string>();
      adapted.forEach((p) => {
        if (p.squad) p.squad.split(', ').forEach((t) => teamsFromResult.add(t));
      });
      const teamList = Array.from(teamsFromResult).sort();
      setTeamFilter((prev) => (prev !== 'All' && !teamList.includes(prev) ? 'All' : prev));
      setPlayers(adapted);
    } catch (err) {
      console.error('Failed to fetch scatter data:', err);
      setError('Failed to fetch data for the selected filters.');
    } finally {
      setIsLoading(false);
    }
  };

  const { availableTeams, availableNations } = useMemo(() => {
    const teams = new Set<string>();
    const nations = new Set<string>();
    players.forEach((p) => {
      if (p.squad) p.squad.split(', ').forEach((t) => teams.add(t));
      if (p.nation) nations.add(p.nation);
    });
    return {
      availableTeams: Array.from(teams).sort(),
      availableNations: Array.from(nations).sort(),
    };
  }, [players]);

  const filteredData = useMemo(() => {
    const filtered = players.filter((p) => {
      const xVal = typeof p[xAxis] === 'number' ? p[xAxis] : 0;
      const yVal = typeof p[yAxis] === 'number' ? p[yAxis] : 0;
      const matchesMinX = minXValue === '' || xVal >= Number(minXValue);
      const matchesMinY = minYValue === '' || yVal >= Number(minYValue);

      return matchesMinX && matchesMinY;
    });

    let result = filtered;
    if (seasonFilter === 'All') {
      const map = new Map<string, UIPlayerStats[]>();
      for (const p of filtered) {
        if (!map.has(p.player)) {
          map.set(p.player, []);
        }
        map.get(p.player)!.push(p);
      }
      result = Array.from(map.values()).map((seasons) => aggregateUIStats(seasons));
    }
    return result;
  }, [players, seasonFilter, xAxis, yAxis, minXValue, minYValue]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 space-y-6 lg:w-80">
        <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Target className="h-4 w-4" /> Attributes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">X-Axis Metric</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value as keyof UIPlayerStats)}
                >
                  {NUMERIC_METRICS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">X-Axis Minimum</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-transparent bg-slate-50 p-2 text-sm outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={minXValue}
                  onChange={(e) => setMinXValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Min ${String(xAxis)}`}
                />
              </div>
              <div className="my-2 h-px bg-slate-100" />
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Y-Axis Metric</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value as keyof UIPlayerStats)}
                >
                  {NUMERIC_METRICS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Y-Axis Minimum</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-transparent bg-slate-50 p-2 text-sm outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={minYValue}
                  onChange={(e) => setMinYValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Min ${String(yAxis)}`}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Filter className="h-4 w-4" /> Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Season</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
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
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Competition</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={compFilter}
                  onChange={(e) => setCompFilter(e.target.value)}
                >
                  <option value="All">All Competitions</option>
                  {availableComps.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Position</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                >
                  <option value="All">All Positions</option>
                  <option value="FW">Forwards</option>
                  <option value="MF">Midfielders</option>
                  <option value="DF">Defenders</option>
                  <option value="GK">Goalkeepers</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Team</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="All">All Teams</option>
                  {availableTeams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Nationality</label>
                <select
                  className="w-full cursor-pointer rounded-lg border-transparent bg-slate-50 p-2 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-slate-900"
                  value={nationFilter}
                  onChange={(e) => setNationFilter(e.target.value)}
                >
                  <option value="All">All Nationalities</option>
                  {availableNations.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Activity className="h-4 w-4" /> Thresholds
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Min Age</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-transparent bg-slate-50 p-2 text-sm outline-none transition-all focus:ring-2 focus:ring-slate-900"
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Max Age</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-transparent bg-slate-50 p-2 text-sm outline-none transition-all focus:ring-2 focus:ring-slate-900"
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Min Mins</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-transparent bg-slate-50 p-2 text-sm outline-none transition-all focus:ring-2 focus:ring-slate-900"
                    value={minMinutes}
                    onChange={(e) => setMinMinutes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Min Matches</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border-transparent bg-slate-50 p-2 text-sm outline-none transition-all focus:ring-2 focus:ring-slate-900"
                    value={minMatches}
                    onChange={(e) => setMinMatches(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchScatterData}
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Fetching Data...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex h-[700px] flex-col rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">{filteredData.length} Players Found</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            {error ? (
              <div className="max-w-md space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-red-900">Fetch Failed</h3>
                  <p className="text-sm font-medium text-red-600/80">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchScatterData}
                  className="mx-auto flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800"
                >
                  <RefreshCcw className="h-3 w-3" /> Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Fetching Dataset...</p>
              </div>
            ) : !hasApplied ? (
              <div className="max-w-md space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <ScatterIcon className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-slate-900">Ready for Analysis</h3>
                  <p className="text-sm font-medium text-slate-500">
                    Configure your metrics and filters on the left, then click{' '}
                    <span className="font-bold text-slate-900">Apply Filters</span> to generate your visual correlation
                    map.
                  </p>
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="font-bold text-slate-400">No players match the current criteria.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    dataKey={xAxis as string}
                    name={String(xAxis)}
                    unit=""
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    label={{
                      value: String(xAxis),
                      position: 'bottom',
                      offset: 0,
                      fill: '#64748b',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey={yAxis as string}
                    name={String(yAxis)}
                    unit=""
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    label={{
                      value: String(yAxis),
                      angle: -90,
                      position: 'left',
                      fill: '#64748b',
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  />
                  <ZAxis type="number" range={[100, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Players" data={filteredData} fill="#3b82f6">
                    {filteredData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pos === 'FW' ? '#f43f5e' : entry.pos === 'MF' ? '#3b82f6' : '#10b981'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
          {hasApplied && filteredData.length > 0 && (
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#f43f5e]" />
                <span className="text-xs text-slate-500">Forward</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#3b82f6]" />
                <span className="text-xs text-slate-500">Midfielder</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#10b981]" />
                <span className="text-xs text-slate-500">Defender</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
