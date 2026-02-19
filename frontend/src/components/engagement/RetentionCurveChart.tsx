'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function RetentionCurveChart({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <ChartCard title="User Retention Curve" description="% of users active after N days">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="day" 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(d) => `Day ${d}`}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--foreground)' }}
              formatter={(val: any) => [`${val}%`, 'Retained']}
              labelFormatter={(d) => `Day ${d}`}
            />
            <Line 
                type="monotone" 
                dataKey="wau_pct" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
            />
            <ReferenceLine y={20} stroke="var(--destructive)" strokeDasharray="3 3" label={{ value: 'Danger Zone', position: 'insideTopRight', fill: 'var(--destructive)', fontSize: 10 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
