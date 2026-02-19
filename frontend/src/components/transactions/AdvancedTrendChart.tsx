'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

type MetricType = 'volume' | 'count';
type DimensionType = 'overall' | 'flow' | 'status' | 'channel' | 'type' | 'method';

const DIMENSIONS: { value: DimensionType; label: string }[] = [
  { value: 'overall', label: 'Overall Trend' },
  { value: 'flow', label: 'Flow (Credit vs Debit)' },
  { value: 'status', label: 'Transaction Status' },
  { value: 'channel', label: 'Channel Mix' },
  { value: 'type', label: 'Transaction Type' },
  { value: 'method', label: 'Payment Method' },
];

const COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  violet: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  indigo: '#6366f1',
};

export function AdvancedTrendChart({ data }: { data: any[] }) {
  const [metric, setMetric] = useState<MetricType>('volume');
  const [dimension, setDimension] = useState<DimensionType>('overall');

  if (!data) return null;

  const getSeries = () => {
    const suffix = metric === 'volume' ? '_volume' : '_count';
    
    switch (dimension) {
      case 'flow':
        return [
          { key: `credit${suffix}`, name: 'Credit', color: COLORS.emerald },
          { key: `debit${suffix}`, name: 'Debit', color: COLORS.red }
        ];
      case 'status':
        return [
          { key: `success${suffix}`, name: 'Success', color: COLORS.emerald },
          { key: `pending${suffix}`, name: 'Pending', color: COLORS.amber },
          { key: `failed${suffix}`, name: 'Failed', color: COLORS.red }
        ];
      case 'channel':
        return [
          { key: `online${suffix}`, name: 'Online', color: COLORS.blue },
          { key: `instore${suffix}`, name: 'In-Store', color: COLORS.emerald },
          { key: `mobile${suffix}`, name: 'Mobile', color: COLORS.amber }
        ];
      case 'type':
        return [
          { key: `payment${suffix}`, name: 'Payment', color: COLORS.blue },
          { key: `transfer${suffix}`, name: 'Transfer', color: COLORS.violet },
          { key: `refund${suffix}`, name: 'Refund', color: COLORS.pink }
        ];
      case 'method':
        return [
            { key: `card${suffix}`, name: 'Card', color: COLORS.pink },
            { key: `wallet${suffix}`, name: 'Wallet', color: COLORS.blue },
            { key: `bank${suffix}`, name: 'Bank', color: COLORS.cyan }
        ];
      case 'overall':
      default:
        return [
          { key: metric, name: `Total ${metric === 'volume' ? 'Volume' : 'Count'}`, color: COLORS.blue }
        ];
    }
  };

  const series = getSeries();
  const isOverall = dimension === 'overall';

  // Choose chart type based on dimension: Overall -> Area, Others -> Line
  const ChartComponent = isOverall ? AreaChart : LineChart;

  return (
    <ChartCard 
      title="Advanced Trend Analysis" 
      description="Analyze trends by flow, status, channel and more"
      className="h-[450px]"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-end gap-2 mb-4 shrink-0">
           <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border/50">
              <button 
                onClick={() => setMetric('volume')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'volume' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Volume
              </button>
              <button 
                onClick={() => setMetric('count')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${metric === 'count' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Count
              </button>
           </div>
           <Select value={dimension} onValueChange={(val: any) => setDimension(val)}>
             <SelectTrigger className="h-8 w-[180px] text-xs">
               <SelectValue placeholder="Select dimension">
                    {DIMENSIONS.find(d => d.value === dimension)?.label}
               </SelectValue>
             </SelectTrigger>
             <SelectContent>
               {DIMENSIONS.map(d => (
                 <SelectItem key={d.value} value={d.value} className="text-xs">
                   {d.label}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric' })}
                stroke="var(--muted-foreground)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="var(--muted-foreground)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => metric === 'volume' ? `₹${formatCompactNumber(val)}` : formatCompactNumber(val)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(value: any, name: any) => [
                    metric === 'volume' ? formatCurrency(value) : value.toLocaleString(), 
                    name
                ]}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {isOverall ? (
                 <Area 
                   type="monotone" 
                   dataKey={series[0].key} 
                   name={series[0].name} 
                   stroke={series[0].color} 
                   fill="url(#colorOverall)" 
                   strokeWidth={2}
                 />
              ) : (
                series.map(s => (
                  <Line 
                    key={s.key}
                    type="monotone" 
                    dataKey={s.key} 
                    name={s.name} 
                    stroke={s.color} 
                    strokeWidth={2} 
                    dot={false} 
                  />
                ))
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartCard>
  );
}
