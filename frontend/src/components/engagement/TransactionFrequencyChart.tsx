'use client';

import { formatCompactNumber } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function TransactionFrequencyChart({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <ChartCard title="Transaction Frequency" description="Distribution of transactions per user">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="range" 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Bar 
                dataKey="count" 
                name="Users" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
