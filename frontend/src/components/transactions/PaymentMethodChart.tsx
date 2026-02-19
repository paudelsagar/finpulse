'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

export function PaymentMethodChart({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <ChartCard title="Payment Methods" description="Distribution by channel">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
             <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="var(--muted-foreground)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              width={100}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--foreground)' }}
                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
