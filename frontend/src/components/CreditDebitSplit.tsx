'use client';

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface CreditDebitSplitProps {
  data: any[];
}

export default function CreditDebitSplit({ data }: CreditDebitSplitProps) {
  const chartData = data.map(bucket => ({
    name: new Date(bucket.key).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Credits: bucket.flows.buckets.credits.volume?.value || 0,
    Debits: bucket.flows.buckets.debits.volume?.value || 0
  }));

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Cash Flow Mix</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Credit vs Debit Velocity</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
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
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
            <Bar dataKey="Credits" fill="#10b981" radius={[4, 4, 0, 0]} barSize={15} />
            <Bar dataKey="Debits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
