'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function ChurnRateChart({ data }: { data: any[] }) {
  if (!data) return null;

  const formattedData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: d.value
  }));

  return (
    <ChartCard title="Churn Rate Trend" description="Monthly % of users leaving">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
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
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
              formatter={(val: any) => [`${val.toFixed(1)}%`, 'Churn Rate']}
            />
            <Bar 
                dataKey="value" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
