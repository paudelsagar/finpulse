'use client';

import { formatCurrency } from '@/lib/utils';
import { Coffee, Plane, ShoppingBag, Ticket, Zap } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  Retail: ShoppingBag,
  Travel: Plane,
  Dining: Coffee,
  Utilities: Zap,
  Entmt: Ticket
};

const CATEGORY_COLORS: Record<string, string> = {
  Retail: 'text-blue-500 bg-blue-500/10',
  Travel: 'text-emerald-500 bg-emerald-500/10',
  Dining: 'text-amber-500 bg-amber-500/10',
  Utilities: 'text-cyan-500 bg-cyan-500/10',
  Entmt: 'text-purple-500 bg-purple-500/10'
};

export function CategoryPerformanceList({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full">
      <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">Top Categories</h3>
      <div className="space-y-4">
        {data.map((item: any, i: number) => {
          const Icon = CATEGORY_ICONS[item.category] || ShoppingBag;
          const colorClass = CATEGORY_COLORS[item.category] || 'text-gray-500 bg-gray-500/10';
          
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium">{item.category}</div>
                  <div className="text-xs text-muted-foreground">{item.count} txns</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">{formatCurrency(item.volume)}</div>
                <div className="text-xs text-emerald-500 font-medium">+12%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
