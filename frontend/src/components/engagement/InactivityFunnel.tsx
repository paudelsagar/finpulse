'use client';

import { formatCompactNumber } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function InactivityFunnel({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <ChartCard title="Inactivity Funnel" description="User drop-off stages">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
             <XAxis 
              type="number"
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <YAxis 
              type="category"
              dataKey="stage" 
              stroke="var(--muted-foreground)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              width={80}
            />
             <Tooltip 
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
