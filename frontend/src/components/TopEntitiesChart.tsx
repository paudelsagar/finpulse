'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-foreground font-semibold mb-1">{data.name}</p>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs flex justify-between gap-4">
            <span>Volume:</span>
            <span className={`font-mono font-bold ${mode === 'volume' ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatCurrency(data.volume)}
            </span>
          </p>
          <p className="text-muted-foreground text-xs flex justify-between gap-4">
            <span>Count:</span>
            <span className={`font-mono font-bold ${mode === 'count' ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatNumber(data.count)}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface TopEntitiesChartProps {
  volumeData: any[];
  countData: any[];
}

export default function TopEntitiesChart({ volumeData, countData }: TopEntitiesChartProps) {
  const [mode, setMode] = useState<'volume' | 'count'>('volume');

  const processedVolumeData = volumeData.map(bucket => ({
    name: bucket.key,
    volume: bucket.total_spent.value,
    count: bucket.doc_count,
    value: bucket.total_spent.value
  }));

  const processedCountData = countData.map(bucket => ({
    name: bucket.key,
    volume: bucket.total_spent.value,
    count: bucket.doc_count,
    value: bucket.doc_count
  }));

  const activeData = mode === 'volume' ? processedVolumeData : processedCountData;

  if (activeData.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top Entities</h3>
          <p className="text-sm text-muted-foreground">
            Highest {mode === 'volume' ? 'volume receivers' : 'transaction counts'}
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
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={activeData} 
            layout="vertical" 
            margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={80}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
