'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DAUMomentumProps {
  data: any[];
}

export default function DAUMomentum({ data }: DAUMomentumProps) {
  const chartData = data.map(bucket => ({
    time: new Date(bucket.key).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    users: bucket.active_users?.value || 0
  }));

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">DAU Momentum</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Active User Trend</p>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 9, fontWeight: 700, fill: 'var(--muted-foreground)' }}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ stroke: 'var(--muted)', strokeWidth: 1, opacity: 0.5 }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
                      <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">{payload[0].payload.time}</p>
                      <p className="text-sm font-mono font-bold text-foreground">
                        {payload[0].value} <span className="text-[10px] font-normal text-muted-foreground">Active Users</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorUsers)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
