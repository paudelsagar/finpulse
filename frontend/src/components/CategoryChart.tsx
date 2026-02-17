'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl min-w-[150px]">
        <p className="text-foreground font-semibold mb-1">{data.category}</p>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs flex justify-between gap-4">
            <span>Volume:</span>
            <span className={`font-mono ${mode === 'volume' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
              {formatCurrency(data.total_volume)}
            </span>
          </p>
          <p className="text-muted-foreground text-xs flex justify-between gap-4">
            <span>Count:</span>
            <span className={`font-mono ${mode === 'count' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
              {formatNumber(data.tx_count)}
            </span>
          </p>
          <p className="text-muted-foreground text-xs flex justify-between gap-4 border-t border-border/50 pt-1 mt-1">
            <span>Avg:</span>
            <span className="text-muted-foreground font-mono">{formatCurrency(data.avg_amount)}</span>
          </p>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground text-right border-t border-border pt-1">
           {new Date(data.window_end).toLocaleTimeString()}
        </div>
      </div>
    );
  }
  return null;
};

export default function CategoryChart({ data }: { data: any[] }) {
  const [mode, setMode] = useState<'volume' | 'count' | 'revenue'>('volume');

  const latestWindowData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // For portfolio context, we might have global data (no window_end) or windowed data
    const sorted = [...data].sort((a, b) => {
      if (!a.window_end || !b.window_end) return 0;
      return new Date(b.window_end).getTime() - new Date(a.window_end).getTime()
    });
    
    const latestTime = sorted[0]?.window_end;
    const filterData = latestTime ? sorted.filter(d => d.window_end === latestTime) : sorted;

    return filterData.map(d => ({
      ...d,
      value: (mode === 'volume' || mode === 'revenue') ? d.total_volume : d.tx_count
    }));
  }, [data, mode]);

  if (!latestWindowData || latestWindowData.length === 0) return null;

  const modeLabel = mode === 'volume' ? 'volume' : mode === 'count' ? 'transaction count' : 'revenue';

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Category Performance</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {modeLabel} by Business Category
          </p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setMode('volume')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'volume' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vol
          </button>
          <button
            onClick={() => setMode('count')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'count' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Count
          </button>
          <button
            onClick={() => setMode('revenue')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'revenue' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rev
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={latestWindowData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
            <XAxis type="number" hide={true} />
            <YAxis 
              dataKey="category" 
              type="category" 
              width={100}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: 'var(--accent)', opacity: 0.2 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {latestWindowData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
