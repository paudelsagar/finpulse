'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChannelChartProps {
  data: any[];
}

export default function ChannelChart({ data }: ChannelChartProps) {
  const chartData = data.map(bucket => ({
    name: bucket.key,
    count: bucket.doc_count
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Channel Usage</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Initiation Source</p>
        </div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Bar 
              dataKey="count" 
              fill="#3b82f6" 
              radius={[0, 4, 4, 0]} 
              barSize={20}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
