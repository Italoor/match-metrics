'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PlayerStats as UIPlayerStats } from '@/types/ui-player';
import { cn } from '@/lib/utils';
import { searchAllSeasonsByQuery } from '@/lib/data-service';
import { adaptPlayer, aggregateUIStats } from './player-adapters';
import type { GroupedPlayer } from './types';

type PlayerSearchProps = {
  label: string;
  selectedPlayer: UIPlayerStats | null;
  onSelect: (p: UIPlayerStats | null) => void;
};

export function PlayerSearch({ label, selectedPlayer, onSelect }: PlayerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<GroupedPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedPlayer(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setFilteredGroups([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const backendPlayers = await searchAllSeasonsByQuery(query);
        const adapted = backendPlayers.map(adaptPlayer);

        const map = new Map<string, GroupedPlayer>();
        for (const p of adapted) {
          if (!map.has(p.player)) {
            map.set(p.player, { playerName: p.player, squads: [p.squad], seasons: [] });
          } else {
            const entry = map.get(p.player)!;
            if (!entry.squads.includes(p.squad)) {
              entry.squads.push(p.squad);
            }
          }
          map.get(p.player)!.seasons.push(p);
        }

        const groups = Array.from(map.values());
        groups.forEach((g) => {
          g.seasons.sort((a, b) => (b.season || '').localeCompare(a.season || ''));
        });

        setFilteredGroups(groups);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative space-y-4" ref={containerRef}>
      <label className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</label>
      <div
        className="flex w-full cursor-text items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm outline-none transition-all focus-within:ring-2 focus-within:ring-slate-900"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="text"
          className="w-full flex-1 bg-transparent text-lg font-black text-slate-900 outline-none placeholder:text-slate-300"
          placeholder={
            selectedPlayer
              ? `${selectedPlayer.player} (${selectedPlayer.season || 'All-time'})`
              : 'Search player by name or team...'
          }
          value={isOpen ? query : selectedPlayer ? `${selectedPlayer.player} (${selectedPlayer.season || 'All-time'})` : ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {selectedPlayer && !isOpen && (
          <div className="hidden max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 sm:block">
            {selectedPlayer.squad}
          </div>
        )}
        <ChevronDown
          className={cn('h-5 w-5 cursor-pointer text-slate-400 transition-transform', isOpen && 'rotate-180')}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            {query.length < 2 ? (
              <div className="p-4 text-center text-sm font-bold text-slate-500">Start typing to search...</div>
            ) : isSearching ? (
              <div className="p-4 text-center text-sm font-bold text-slate-500">Searching...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-sm font-bold text-slate-500">{`No players found for "${query}".`}</div>
            ) : (
              <div className="py-2">
                {filteredGroups.map((g, i) => {
                  const isExpanded = expandedPlayer === g.playerName;
                  const isAnySelected = selectedPlayer?.player === g.playerName;

                  return (
                    <div key={`${g.playerName}-${i}`} className="relative border-b border-slate-50 last:border-0">
                      <button
                        className={cn(
                          'flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50',
                          isAnySelected && !isExpanded && 'bg-slate-50',
                          isExpanded && 'bg-slate-100',
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          if (g.seasons.length === 1) {
                            onSelect(g.seasons[0]);
                            setIsOpen(false);
                            setQuery('');
                            setExpandedPlayer(null);
                          } else {
                            setExpandedPlayer(isExpanded ? null : g.playerName);
                          }
                        }}
                      >
                        <div>
                          <div className={cn('font-bold', isAnySelected ? 'text-blue-600' : 'text-slate-900')}>
                            {g.playerName}
                          </div>
                          <div className="text-xs font-bold text-slate-400">
                            {g.squads.join(', ')} •{' '}
                            {g.seasons.length > 1 ? `${g.seasons.length} seasons` : g.seasons[0].season}
                          </div>
                        </div>
                        {g.seasons.length > 1 && (
                          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                        )}
                        {g.seasons.length === 1 && isAnySelected && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 shadow-sm shadow-blue-200" />
                        )}
                      </button>

                      {isExpanded && g.seasons.length > 1 && (
                        <div className="border-t border-slate-100 bg-slate-50 py-1 pl-4 shadow-inner">
                          <button
                            className="group flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-slate-100"
                            onClick={(e) => {
                              e.preventDefault();
                              onSelect(aggregateUIStats(g.seasons));
                              setIsOpen(false);
                              setQuery('');
                              setExpandedPlayer(null);
                            }}
                          >
                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">
                              All Seasons (Aggregate)
                            </span>
                            {selectedPlayer?.player === g.playerName && selectedPlayer?.season === 'All Seasons' && (
                              <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                            )}
                          </button>

                          {g.seasons.map((p, idx) => {
                            const isThisSeasonSelected =
                              selectedPlayer?.player === p.player && selectedPlayer?.season === p.season;
                            return (
                              <button
                                key={`${p.season}-${idx}`}
                                className="group flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-slate-100"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onSelect(p);
                                  setIsOpen(false);
                                  setQuery('');
                                  setExpandedPlayer(null);
                                }}
                              >
                                <div>
                                  <div
                                    className={cn(
                                      'text-sm font-bold',
                                      isThisSeasonSelected ? 'text-blue-600' : 'text-slate-700 group-hover:text-slate-900',
                                    )}
                                  >
                                    {p.season || 'Unknown Season'}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400">{p.squad}</div>
                                </div>
                                {isThisSeasonSelected && <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-600" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
