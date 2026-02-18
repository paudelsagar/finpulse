'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface CurrencyMixProps {
  data: any[];
}

export default function CurrencyMix({ data }: CurrencyMixProps) {
  const COLORS: Record<string, string> = {
    'USD': '#3b82f6',
    'NPR': '#ef4444',
  };

  const chartData = data.filter(b => b.key !== 'null').map(bucket => ({
    name: bucket.key,
    value: bucket.doc_count
  }));

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Currency Mix</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Volume Distribution</p>
        </div>
      </div>

      <div className="flex-1 min-h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-around mt-4 pt-4 border-t border-border/50">
        {chartData.map((item) => (
          <div key={item.name} className="flex flex-col items-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase">{item.name}</span>
            <span className="text-sm font-bold text-foreground">{(item.value / chartData.reduce((a,b)=>a+b.value, 0) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
