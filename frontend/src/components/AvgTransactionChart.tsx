'use client';

import { formatCurrency } from '@/lib/utils';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-muted-foreground text-xs mb-1">{new Date(label).toLocaleTimeString()}</p>
        <p className="text-primary font-bold text-lg">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">Avg Transaction Size</p>
      </div>
    );
  }
  return null;
};

export default function AvgTransactionChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <ChartCard 
      title="Avg Ticket Size" 
      description="Transaction value trend"
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="key" 
            hide 
          />
          <YAxis 
            hide 
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--muted)', strokeWidth: 1, opacity: 0.5 }} />
          <Line 
            type="monotone" 
            dataKey="avg" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
