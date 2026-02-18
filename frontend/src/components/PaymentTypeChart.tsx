import { formatCurrency, formatNumber } from '@/lib/utils';
import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, mode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl min-w-[180px]">
        <p className="text-foreground font-semibold mb-2">{data.name}</p>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground flex justify-between gap-4">
            <span>Volume:</span>
            <span className={`font-mono font-bold ${mode === 'volume' ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatCurrency(data.volume)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground flex justify-between gap-4">
            <span>Transactions:</span>
            <span className={`font-mono font-bold ${mode === 'count' ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatNumber(data.count)}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function PaymentTypeChart({ data }: { data: any[] }) {
  const [mode, setMode] = useState<'volume' | 'count'>('count');

  const getLabel = (key: string) => {
    switch(key) {
      case 'P2P': return 'Peer-to-Peer';
      case 'P2M': return 'Merchant Payment';
      case 'M2P': return 'Refund/Payout';
      case 'B2B': return 'Business-to-Business';
      case 'SELF': return 'Self Transfer';
      default: return key;
    }
  };

  const chartData = data.map(bucket => ({
    name: getLabel(bucket.key),
    volume: bucket.total_spent.value,
    count: bucket.doc_count,
    value: mode === 'volume' ? bucket.total_spent.value : bucket.doc_count
  }));

  if (chartData.length === 0) return null;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--muted-foreground)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Distribution</h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'volume' ? 'Volume ($) share' : 'Transaction (#) share'}
          </p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setMode('volume')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'volume' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vol
          </button>
          <button
            onClick={() => setMode('count')}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all ${
              mode === 'count' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Count
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              labelLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
              label={renderCustomizedLabel}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip mode={mode} />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              formatter={(value) => <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
