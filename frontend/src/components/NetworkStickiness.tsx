'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface NetworkStickinessProps {
  data: any[];
}

export default function NetworkStickiness({ data }: NetworkStickinessProps) {
  // Group types into "In-Network" vs "Out-Network"
  const inNetworkTypes = ['P2P', 'SELF', 'TOPUP', 'WALLET_TRANSFER'];
  const outNetworkTypes = ['P2M', 'B2B', 'BILL_PAY', 'TAX', 'GOV'];

  let inNetVol = 0;
  let outNetVol = 0;

  data.forEach(b => {
    if (inNetworkTypes.includes(b.key)) {
      inNetVol += b.total_spent?.value || 0;
    } else {
      outNetVol += b.total_spent?.value || 0;
    }
  });

  const chartData = [
    { name: 'In-Network (Retention)', value: inNetVol, color: '#8b5cf6' },
    { name: 'Out-Network (Leakage)', value: outNetVol, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">Network Stickiness</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Capital Retention</p>
        </div>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
                      <p className="text-xs font-bold mb-1 uppercase tracking-tight" style={{ color: d.color }}>{d.name.split(' (')[0]}</p>
                      <p className="text-sm font-mono font-bold text-foreground">
                        {(d.percent * 100).toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
               verticalAlign="bottom" 
               height={36} 
               iconType="circle"
               formatter={(value: string) => <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
