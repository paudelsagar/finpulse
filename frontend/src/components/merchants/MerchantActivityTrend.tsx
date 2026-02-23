'use client';

import ChartCard from '@/components/ChartCard';
import { formatCompactCurrency, formatNumber } from '@/lib/utils';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrendDataPoint {
  time: string;
  amount: number;
  count: number;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">
          {new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="space-y-1">
          <p className="text-xs flex justify-between gap-4">
            <span className="text-muted-foreground">Volume:</span>
            <span className={`font-mono font-bold ${mode === 'volume' ? 'text-blue-500' : 'text-muted-foreground'}`}>
              {formatCompactCurrency(payload[0]?.value || 0)}
            </span>
          </p>
          <p className="text-xs flex justify-between gap-4">
            <span className="text-muted-foreground">Txns:</span>
            <span className={`font-mono font-bold ${mode === 'count' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {formatNumber(payload[1]?.value || payload[0]?.payload?.count || 0)}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function MerchantActivityTrend({ data }: { data: TrendDataPoint[] }) {
  const [mode, setMode] = useState<'volume' | 'count'>('volume');

  if (!data || data.length === 0) {
    return (
      <ChartCard title="Merchant Activity Trend">
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          No activity data available
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      className="h-full"
      title="Merchant Activity Trend"
      description="Transaction volume and count over time"
      actions={
        <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/50">
          <button
            onClick={() => setMode('volume')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'volume'
                ? 'bg-background text-blue-500 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setMode('count')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'count'
                ? 'bg-background text-emerald-500 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Count
          </button>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="merchantVolumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="merchantCountGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleString([], { month: 'short', day: 'numeric' });
            }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickFormatter={(v) => mode === 'volume' ? formatCompactCurrency(v) : formatNumber(v)}
            width={60}
          />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          {mode === 'volume' ? (
            <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#merchantVolumeGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
          ) : (
            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#merchantCountGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
