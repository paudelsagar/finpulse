'use client';

import { formatCompactCurrency, formatNumber } from '@/lib/utils';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  count: number;
}

const CATEGORY_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#a855f7', '#22d3ee', '#84cc16', '#fb923c', '#f43f5e'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    const total = payload[0].payload._total || 1;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-sm font-bold text-foreground mb-1">{d.name}</p>
        <p className="text-xs font-mono text-muted-foreground">{formatCompactCurrency(d.value)}</p>
        <p className="text-[10px] text-muted-foreground">{formatNumber(d.count)} txns ({((d.value / total) * 100).toFixed(1)}%)</p>
      </div>
    );
  }
  return null;
};

export default function MerchantCategoryChart({ data }: { data: CategoryData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-[400px] flex items-center justify-center text-muted-foreground text-sm">
        No category data available
      </div>
    );
  }

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const chartData = data.map(d => ({ ...d, _total: totalValue }));

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
      <div className="mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">Category Breakdown</h3>
        <p className="text-sm text-muted-foreground">Revenue by merchant category</p>
      </div>

      <div className="flex-1 min-h-0 flex items-center gap-4">
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="75%"
                dataKey="value"
                strokeWidth={2}
                stroke="var(--card)"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="shrink-0 space-y-2 pr-2 max-h-full overflow-y-auto">
          {data.slice(0, 10).map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-2.5 px-2 py-1 rounded-md w-full text-left">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
              <div>
                <p className="text-xs font-bold text-foreground leading-none">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatNumber(cat.count)} txns</p>
              </div>
              <span className="ml-auto text-xs font-mono font-bold text-muted-foreground">
                {formatCompactCurrency(cat.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
