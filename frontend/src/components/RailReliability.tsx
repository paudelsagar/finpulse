'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface RailReliabilityProps {
  data: any[];
}

export default function RailReliability({ data }: RailReliabilityProps) {
  const chartData = data.map(bucket => {
    const success = bucket.success_count.doc_count;
    const failed = bucket.failed_count.doc_count;
    const total = bucket.doc_count;
    const rate = total > 0 ? (success / total * 100) : 0;

    return {
      name: bucket.key,
      rate: parseFloat(rate.toFixed(1)),
      success,
      failed,
      total
    };
  }).sort((a, b) => b.rate - a.rate);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Rail Reliability</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Protocol Success Rate</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 30 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl min-w-[150px]">
                      <p className="text-sm font-bold mb-2 uppercase tracking-tight">{d.name}</p>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground flex justify-between uppercase">
                          <span>Success:</span> <span className="text-emerald-500 font-bold">{d.rate}%</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground flex justify-between uppercase">
                          <span>Volume:</span> <span className="font-mono">{d.total} TXs</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground flex justify-between uppercase">
                          <span>Failed:</span> <span className="text-destructive">{d.failed}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.rate > 90 ? '#10b981' : entry.rate > 70 ? '#f59e0b' : '#ef4444'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
