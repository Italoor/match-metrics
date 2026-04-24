'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { motion } from 'motion/react';
import type { PlayerStats as UIPlayerStats } from '@/types/ui-player';
import { PlayerSearch } from './player-search';

type ComparisonTabProps = {
  selectedPlayer1: UIPlayerStats | null;
  selectedPlayer2: UIPlayerStats | null;
  onSelectPlayer1: (p: UIPlayerStats | null) => void;
  onSelectPlayer2: (p: UIPlayerStats | null) => void;
};

export function ComparisonTab({
  selectedPlayer1,
  selectedPlayer2,
  onSelectPlayer1,
  onSelectPlayer2,
}: ComparisonTabProps) {
  return (
    <motion.div
      key="comparison"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <PlayerSearch label="Primary Player" selectedPlayer={selectedPlayer1} onSelect={onSelectPlayer1} />
        <PlayerSearch label="Comparison Player" selectedPlayer={selectedPlayer2} onSelect={onSelectPlayer2} />
      </div>

      {selectedPlayer1 && selectedPlayer2 && (
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <h3 className="text-xl font-black uppercase tracking-tighter">Metric Comparison</h3>
              <div className="space-y-6">
                {(['Goals', 'Assists', 'Expected Goals', 'Key passes', 'Progressive Passes'] as const).map((metric) => {
                  const val1 = selectedPlayer1[metric];
                  const val2 = selectedPlayer2[metric];
                  const max = Math.max(val1, val2, 1);
                  return (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>{metric}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 flex-1 items-center overflow-hidden rounded-lg bg-slate-50 px-1">
                          <div
                            className="h-6 rounded-md bg-slate-900 transition-all duration-500"
                            style={{ width: `${(val1 / max) * 100}%` }}
                          />
                          <span className="ml-2 text-xs font-bold">{val1}</span>
                        </div>
                        <div className="flex h-8 flex-1 flex-row-reverse items-center overflow-hidden rounded-lg bg-slate-50 px-1">
                          <div
                            className="h-6 rounded-md bg-blue-500 transition-all duration-500"
                            style={{ width: `${(val2 / max) * 100}%` }}
                          />
                          <span className="mr-2 text-xs font-bold">{val2}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-[2rem] bg-slate-50 p-8">
              <h3 className="mb-8 text-center text-xl font-black uppercase tracking-tighter">Role Overlap</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={[
                      {
                        subject: 'Attacking',
                        A: selectedPlayer1.Goals * 2,
                        B: selectedPlayer2.Goals * 2,
                      },
                      {
                        subject: 'Passing',
                        A: selectedPlayer1['Pass completion %'],
                        B: selectedPlayer2['Pass completion %'],
                      },
                      {
                        subject: 'Defense',
                        A: selectedPlayer1['Tackles Won'] * 2,
                        B: selectedPlayer2['Tackles Won'] * 2,
                      },
                      {
                        subject: 'Creativity',
                        A: selectedPlayer1['Key passes'],
                        B: selectedPlayer2['Key passes'],
                      },
                      {
                        subject: 'Progressive',
                        A: selectedPlayer1['Progressive Passes'] / 2,
                        B: selectedPlayer2['Progressive Passes'] / 2,
                      },
                    ]}
                  >
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Radar
                      name={selectedPlayer1.player}
                      dataKey="A"
                      stroke="#0f172a"
                      fill="#0f172a"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name={selectedPlayer2.player}
                      dataKey="B"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
