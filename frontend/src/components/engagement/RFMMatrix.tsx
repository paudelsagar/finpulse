'use client';

import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function RFMMatrix({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <ChartCard title="RFM Matrix" description="Recency vs Frequency vs Monetary Value">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              type="number" 
              dataKey="r" 
              name="Recency" 
              unit="d" 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Recency (Score)', position: 'insideBottom', offset: -10, fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <YAxis 
              type="number" 
              dataKey="f" 
              name="Frequency" 
              unit="" 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Frequency (Score)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: 'var(--muted-foreground)' }}
            />
            <ZAxis type="number" dataKey="m" range={[10, 300]} name="Monetary" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Scatter name="Users" data={data} fill="#8884d8">
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.m > 4 ? '#10b981' : entry.m > 2 ? '#3b82f6' : '#ef4444'} />
                ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
