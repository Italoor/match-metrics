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
          { title: 'Goal Scoring Efficiency', metric: 'Goals per shot' as const },
          { title: 'Creative Output', metric: 'Key passes' as const },
          { title: 'Ball Progression', metric: 'Progressive Carries' as const },
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
