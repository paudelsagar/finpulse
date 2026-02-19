'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function VolumeTrendChart({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <ChartCard title="Transaction Volume & Count" description="Dual-axis view of value vs volume">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
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
              yAxisId="left"
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `₹${formatNumber(val)}`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
              formatter={(value: any, name: any) => [
                  name === 'Volume' ? formatCurrency(value) : value, 
                  name
              ]}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar yAxisId="left" dataKey="volume" name="Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="count" name="Count" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
