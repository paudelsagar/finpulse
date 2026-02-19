'use client';

import { formatCompactNumber } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function UserActivityChart({ data }: { data: any }) {
  if (!data) return null;

  // Merge datasets by date for Recharts
  const mergedData = data.dau.map((d: any, i: number) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    dau: d.value,
    wau: data.wau[i]?.value || 0,
    mau: data.mau[i]?.value || 0,
  }));

  return (
    <ChartCard title="Active Users (DAU/WAU/MAU)" description="User engagement trends over last 30 days">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
               <linearGradient id="colorWau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatCompactNumber}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            <Area 
              type="monotone" 
              dataKey="mau" 
              name="MAU" 
              stroke="#8b5cf6" 
              fill="transparent" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Area 
              type="monotone" 
              dataKey="wau" 
              name="WAU" 
              stroke="#3b82f6" 
              fill="url(#colorWau)" 
              strokeWidth={2} 
            />
            <Area 
              type="monotone" 
              dataKey="dau" 
              name="DAU" 
              stroke="#10b981" 
              fill="url(#colorDau)" 
              strokeWidth={2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
