type CustomTooltipProps = {
  active?: boolean;
  payload?: { payload: { player: string; squad: string; '90s': number }; name?: string; value?: string | number }[];
};

export function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xl">
        <p className="font-bold text-slate-900">{data.player}</p>
        <p className="mb-2 text-xs text-slate-500">{data.squad}</p>
        <div className="mb-3 border-b border-slate-50 pb-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>90s Played</span>
            <span className="font-mono text-slate-900">{Math.floor(data['90s'])}</span>
          </div>
        </div>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <div key={i} className="flex justify-between gap-8 text-sm">
              <span className="text-slate-500">{p.name}:</span>
              <span className="font-mono font-bold">
                {p.name === '90s' && typeof p.value === 'number' ? Math.floor(p.value) : p.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
