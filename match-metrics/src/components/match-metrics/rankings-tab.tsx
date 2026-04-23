'use client';

import { motion } from 'motion/react';
import type { PlayerStats as UIPlayerStats } from '@/types/ui-player';

type RankingsTabProps = {
  explorerFilteredUnsorted: UIPlayerStats[];
};

export function RankingsTab({ explorerFilteredUnsorted }: RankingsTabProps) {
  return (
    <motion.div
      key="rankings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {[
          { title: 'Goals per 90', metric: 'Goals p 90' as const },
          { title: 'Assists per 90', metric: 'Assists p 90' as const },
          { title: 'Successful Take-Ons %', metric: '% Successful take-ons' as const },
          { title: 'Shot-Creating Actions', metric: 'Shot creating actions p 90' as const },
          { title: 'Goal-Creating Actions', metric: 'Goal creating actions p 90' as const },
          { title: 'Progressive Passes', metric: 'Progressive Passes' as const },
          { title: 'Aerial Duel Win %', metric: '% Aerial Duels won' as const },
          { title: 'Dribbles Tackled %', metric: '% Dribbles tackled' as const },
          { title: 'Pass Completion %', metric: 'Pass completion %' as const },
        ].map((rank) => (
          <div key={rank.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-400">{rank.title}</h3>
            <div className="space-y-4">
              {[...explorerFilteredUnsorted]
                .sort(
                  (a, b) =>
                    Number(b[rank.metric as keyof UIPlayerStats]) - Number(a[rank.metric as keyof UIPlayerStats]),
                )
                .slice(0, 5)
                .map((p, i) => (
                  <div key={`${p.player}|${p.season}|${rank.metric}`} className="group flex items-center justify-between">
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
        ))}
      </div>
    </motion.div>
  );
}
