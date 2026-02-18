'use client';

import { formatCurrency } from '@/lib/utils';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

interface MCCHotZonesProps {
  data: any[];
}

export default function MCCHotZones({ data }: MCCHotZonesProps) {
  const chartData = data.map(bucket => ({
    subject: bucket.key,
    A: bucket.avg_amount?.value || 0,
    fullMark: 15000, // Arbitrary scaling
    volume: bucket.total_volume?.value || 0
  })).slice(0, 6); // Top 6 for radar clarity

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">Sector Hot Zones</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Avg Tx Size by MCC</p>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar
              name="Avg Amount"
              dataKey="A"
              stroke="#eab308"
              strokeWidth={2}
              fill="#eab308"
              fillOpacity={0.4}
            />
            <Tooltip 
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
                      <p className="text-xs font-bold mb-1 uppercase tracking-tight">{d.subject}</p>
                      <p className="text-sm font-mono text-emerald-500 font-bold">
                        {formatCurrency(d.A)}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-1">Avg Ticket Size</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
