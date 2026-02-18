'use client';

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ChannelReliabilityProps {
  data: any[];
}

export default function ChannelReliability({ data }: ChannelReliabilityProps) {
  const chartData = data.map(bucket => {
    const success = bucket.statuses.buckets.find((s: any) => s.key === 'SUCCESS')?.doc_count || 0;
    const failed = bucket.statuses.buckets.find((s: any) => s.key === 'FAILED')?.doc_count || 0;
    const total = bucket.doc_count;
    
    return {
      name: bucket.key,
      success_rate: total > 0 ? (success / total * 100).toFixed(1) : 0,
      Success: success,
      Failed: failed,
      total
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Channel Reliability</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Health per Source</p>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
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
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
            <Bar dataKey="Success" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar dataKey="Failed" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
