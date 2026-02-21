'use client';

import { formatNumber } from '@/lib/utils';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface UserData {
  id: string;
  tx_count: number;
}

interface UserSegmentChartProps {
  users: UserData[];
}

const SEGMENTS = [
  { name: 'Whale', min: 50, color: '#8b5cf6', description: '50+ txns' },
  { name: 'Heavy', min: 20, color: '#3b82f6', description: '20-49 txns' },
  { name: 'Medium', min: 5, color: '#10b981', description: '5-19 txns' },
  { name: 'Light', min: 0, color: '#6b7280', description: '1-4 txns' },
];

function segmentUsers(users: UserData[]) {
  const segments = SEGMENTS.map(s => ({ ...s, value: 0 }));

  users.forEach(u => {
    for (const seg of segments) {
      if (u.tx_count >= seg.min) {
        seg.value++;
        break;
      }
    }
  });

  return segments.filter(s => s.value > 0);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    const total = payload[0].payload._total || 1;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-sm font-bold text-foreground mb-1">{d.name}</p>
        <p className="text-xs text-muted-foreground">{formatNumber(d.value)} users ({((d.value / total) * 100).toFixed(1)}%)</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{d.description}</p>
      </div>
    );
  }
  return null;
};

export default function UserSegmentChart({ users }: UserSegmentChartProps) {
  const rawData = segmentUsers(users || []);
  const total = rawData.reduce((sum, s) => sum + s.value, 0);
  const data = rawData.map(d => ({ ...d, _total: total }));

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[400px] flex items-center justify-center text-muted-foreground text-sm">
        No user data available
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
      <div className="mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">User Segments</h3>
        <p className="text-sm text-muted-foreground">Distribution by activity level</p>
      </div>

      <div className="flex-1 min-h-0 flex items-center gap-4">
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="75%"
                dataKey="value"
                strokeWidth={2}
                stroke="var(--card)"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="shrink-0 space-y-2 pr-2">
          {SEGMENTS.map((seg) => {
            const match = data.find(d => d.name === seg.name);
            return (
              <div
                key={seg.name}
                className="flex items-center gap-2.5 px-2 py-1 rounded-md w-full text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <div>
                  <p className="text-xs font-bold text-foreground leading-none">{seg.name}</p>
                  <p className="text-[10px] text-muted-foreground">{seg.description}</p>
                </div>
                <span className="ml-auto text-xs font-mono font-bold text-muted-foreground">
                  {match ? formatNumber(match.value) : 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
