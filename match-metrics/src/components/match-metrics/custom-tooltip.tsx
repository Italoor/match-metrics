type CustomTooltipProps = {
  active?: boolean;
  payload?: { payload: { player: string; squad: string }; name?: string; value?: string | number }[];
};

export function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xl">
        <p className="font-bold text-slate-900">{data.player}</p>
        <p className="mb-2 text-xs text-slate-500">{data.squad}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <div key={i} className="flex justify-between gap-8 text-sm">
              <span className="text-slate-500">{p.name}:</span>
              <span className="font-mono font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
