import { formatCurrency } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
           {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Volume</span>
            <span className="text-blue-400 font-bold tabular-nums">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-1.5">
              <span className="text-xs text-muted-foreground">Interactions</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                {payload[1].value}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function VolumeChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <ChartCard 
      title="Network Throughput" 
      description="Volume vs interaction frequency"
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis 
            dataKey="key_as_string" 
            tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
            minTickGap={50}
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            yAxisId="left"
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value, 'USD', 0)}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            content={({ payload }: any) => (
              <div className="flex justify-end gap-6 mb-4">
                {payload.map((entry: any, index: number) => (
                  <div key={`item-${index}`} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          />
          <Area 
            yAxisId="left"
            name="Volume"
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorVolume)" 
            animationDuration={1000}
          />
          <Area 
            yAxisId="right"
            name="Interactions"
            type="monotone" 
            dataKey="count" 
            stroke="#10b981" 
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="5 5"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
