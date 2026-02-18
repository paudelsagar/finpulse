'use client';

import { formatCurrency } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface LiquidityPulseProps {
  data: any[];
}

export default function LiquidityPulse({ data }: LiquidityPulseProps) {
  const chartData = data.map(bucket => ({
    name: new Date(bucket.key).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    liquidity: bucket.liquidity?.value || 0
  }));

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Liquidity Pulse</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">System Retention Trend</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLiq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: 'var(--muted-foreground)' }}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              cursor={{ stroke: 'var(--muted)', strokeWidth: 1, opacity: 0.5 }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl min-w-[150px]">
                      <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">{payload[0].payload.name}</p>
                      <p className="text-sm font-mono font-bold text-foreground">
                        {formatCurrency(payload[0].value)}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase italic">Total System Float</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="liquidity" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorLiq)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
