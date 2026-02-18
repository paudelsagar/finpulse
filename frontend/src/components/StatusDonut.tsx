'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusDonutProps {
  data: any[];
}

export default function StatusDonut({ data }: StatusDonutProps) {
  const COLORS: Record<string, string> = {
    'SUCCESS': '#10b981',
    'FAILED': '#ef4444',
    'PENDING': '#f59e0b',
    'REVERSED': '#8b5cf6'
  };

  const chartData = data.map(bucket => ({
    name: bucket.key,
    value: bucket.doc_count
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const successRate = total > 0 
    ? ((chartData.find(d => d.name === 'SUCCESS')?.value || 0) / total * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Transaction Success</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Volume Distribution</p>
        </div>
        <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs font-bold text-emerald-500">{successRate}% Success</span>
        </div>
      </div>

      <div className="flex-1 min-h-[240px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground">{successRate}%</span>
          <span className="text-[10px] uppercase font-black text-muted-foreground">Reliability</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[item.name] }} />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.name}</span>
              <span className="text-xs font-mono font-bold text-foreground">{item.value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
