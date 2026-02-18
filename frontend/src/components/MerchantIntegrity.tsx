'use client';

import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';

interface MerchantIntegrityProps {
  data: any[];
}

export default function MerchantIntegrity({ data }: MerchantIntegrityProps) {
  const chartData = data.map(bucket => {
    const totalTx = bucket.doc_count;
    const successTx = bucket.success_count.doc_count;
    const volume = bucket.total_volume.value;
    const successRate = totalTx > 0 ? (successTx / totalTx) * 100 : 0;

    return {
      name: bucket.key,
      x: totalTx,
      y: parseFloat(successRate.toFixed(1)),
      z: volume,
      avg: volume / totalTx
    };
  }).filter(d => d.x > 5); // Filter noise

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Integrity Matrix</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Merchant Performance</p>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Transactions" 
              unit=" tx" 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Success Rate" 
              unit="%" 
              domain={[80, 100]} 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Volume" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl min-w-[150px]">
                      <p className="text-sm font-bold mb-2 uppercase tracking-tight">{d.name}</p>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Success Rate:</span> <span className={d.y < 95 ? "text-destructive font-bold" : "text-emerald-500 font-bold"}>{d.y}%</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Volume:</span> <span className="font-mono text-foreground">{formatCurrency(d.z)}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Count:</span> <span className="font-mono">{d.x}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Merchants" data={chartData} fill="var(--primary)" fillOpacity={0.6} stroke="var(--primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
