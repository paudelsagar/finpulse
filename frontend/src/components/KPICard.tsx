import { formatRichCurrency, formatRichNumber } from '@/lib/utils';
import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'percent';
  trend?: { 
      value: string; 
      label?: string; 
      direction: 'up' | 'down' | 'neutral' 
  };
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'indigo' | 'orange' | 'amber' | 'rose' | 'cyan' | 'purple';
}

export function KPICard({ 
  title, 
  value, 
  format = 'number', 
  trend, 
  icon: Icon, 
  color 
}: KPICardProps) {

  // Map color names to Tailwind configurations
  const colorMap = {
    blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/10', hover: 'group-hover:bg-blue-500/10', icon: 'text-blue-500/30', text: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', hover: 'group-hover:bg-emerald-500/10', icon: 'text-emerald-500/30', text: 'text-emerald-500' },
    indigo: { bg: 'bg-indigo-500/5', border: 'border-indigo-500/10', hover: 'group-hover:bg-indigo-500/10', icon: 'text-indigo-500/30', text: 'text-indigo-500' },
    orange: { bg: 'bg-orange-500/5', border: 'border-orange-500/10', hover: 'group-hover:bg-orange-500/10', icon: 'text-orange-500/30', text: 'text-orange-500' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/10', hover: 'group-hover:bg-amber-500/10', icon: 'text-amber-500/30', text: 'text-amber-500' },
    rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/10', hover: 'group-hover:bg-rose-500/10', icon: 'text-rose-500/30', text: 'text-rose-500' },
    cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/10', hover: 'group-hover:bg-cyan-500/10', icon: 'text-cyan-500/30', text: 'text-cyan-500' },
    purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/10', hover: 'group-hover:bg-purple-500/10', icon: 'text-purple-500/30', text: 'text-purple-500' },
  };

  const theme = colorMap[color];
  const parts = format === 'currency' 
    ? formatRichCurrency(value, 'USD', 0) 
    : format === 'percent' 
        ? [{ value: value.toFixed(1), unit: '%' }]
        : formatRichNumber(value);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute -right-2 -top-2 w-20 h-20 ${theme.bg} rounded-full flex items-center justify-center border ${theme.border} ${theme.hover} transition-colors`}>
        <Icon size={32} className={theme.icon} />
      </div>
      
      <div className="relative z-10">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
        
        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
          {parts.map((part, i) => {
            const sizeClass = [
              "text-3xl font-bold text-foreground",
              "text-base font-semibold text-muted-foreground",
              "text-xs font-medium text-muted-foreground/60",
              "text-[10px] font-medium text-muted-foreground/40"
            ][Math.min(i, 3)];
            
            return (
              <span key={i} className={sizeClass}>
                {part.value}<span className="text-[10px] ml-0.5 opacity-70 font-bold uppercase">{part.unit}</span>
              </span>
            );
          })}
        </div>
        
        {trend && (
           <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold uppercase ${
               trend.direction === 'up' ? 'text-emerald-500' : 
               trend.direction === 'down' ? 'text-rose-500' : 'text-muted-foreground'
           }`}>
               {trend.direction === 'up' && <TrendingUp size={12} />}
               {trend.direction === 'down' && <TrendingDown size={12} />}
               {trend.direction === 'neutral' && <Minus size={12} />}
               <span>{trend.value} {trend.label}</span>
           </div>
        )}
      </div>
    </div>
  );
}
