'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AmountDistributionProps {
  data: any[];
}

export default function AmountDistribution({ data }: AmountDistributionProps) {
  const chartData = data.map(bucket => ({
    name: bucket.key,
    count: bucket.doc_count
  }));

  const COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Amount Distribution</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Transaction Size Spectrum</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
