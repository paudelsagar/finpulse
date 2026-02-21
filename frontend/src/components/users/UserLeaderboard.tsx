'use client';

import { formatCompactCurrency, formatNumber } from '@/lib/utils';
import { Crown, Hash, TrendingUp } from 'lucide-react';

interface RankItem {
  id: string;
  name: string;
  value: number;
}

interface UserLeaderboardProps {
  rankings: {
    top_by_volume: RankItem[];
    top_by_count: RankItem[];
    top_by_revenue: RankItem[];
  };
  onUserClick?: (userId: string) => void;
}

const MEDAL_COLORS = ['text-amber-500', 'text-gray-400', 'text-orange-600'];

function RankList({ 
  title, 
  icon: Icon, 
  items, 
  formatValue, 
  color,
  onUserClick 
}: { 
  title: string; 
  icon: any; 
  items: RankItem[]; 
  formatValue: (v: number) => string; 
  color: string;
  onUserClick?: (userId: string) => void;
}) {
  if (!items || items.length === 0) return null;
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md bg-${color}-500/10`}>
          <Icon size={14} className={`text-${color}-500`} />
        </div>
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h4>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => onUserClick?.(item.id)}
            className="w-full flex items-center gap-3 group hover:bg-muted/40 rounded-lg px-2 py-1.5 transition-colors text-left"
          >
            <span className={`text-xs font-black w-5 text-center ${i < 3 ? MEDAL_COLORS[i] : 'text-muted-foreground/40'}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {item.name}
                </span>
                <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">
                  {formatValue(item.value)}
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${color}-500/60 rounded-full transition-all duration-500`}
                  style={{ width: `${(item.value / maxVal) * 100}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function UserLeaderboard({ rankings, onUserClick }: UserLeaderboardProps) {
  if (!rankings) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">User Leaderboard</h3>
        <p className="text-sm text-muted-foreground">Top performers across key metrics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <RankList
          title="By Volume"
          icon={TrendingUp}
          items={rankings.top_by_volume}
          formatValue={(v) => formatCompactCurrency(v)}
          color="blue"
          onUserClick={onUserClick}
        />
        <RankList
          title="By Count"
          icon={Hash}
          items={rankings.top_by_count}
          formatValue={(v) => formatNumber(v) + ' txns'}
          color="emerald"
          onUserClick={onUserClick}
        />
        <RankList
          title="By Revenue"
          icon={Crown}
          items={rankings.top_by_revenue}
          formatValue={(v) => formatCompactCurrency(v)}
          color="purple"
          onUserClick={onUserClick}
        />
      </div>
    </div>
  );
}
