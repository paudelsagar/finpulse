'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

interface MCCDistributionProps {
  data: any[];
}

export default function MCCDistribution({ data }: MCCDistributionProps) {
  const chartData = data?.map(b => ({
    mcc: `#${b.key}`,
    count: b.doc_count
  })) || [];

  return (
    <ChartCard 
      title="MCC Taxonomy" 
      description="Merchant Category Code distribution"
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="mcc" 
            type="category" 
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
            content={({ active, payload }: any) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover border border-border p-2 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{payload[0].payload.mcc}</p>
                    <p className="text-xs font-bold text-primary">{payload[0].value} Transactions</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="count" 
            fill="#6366f1" 
            radius={[0, 4, 4, 0]}
            barSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
