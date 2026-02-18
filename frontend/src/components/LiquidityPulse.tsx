'use client';

import { formatRichCurrency } from '@/lib/utils';
import { Activity, Droplets } from 'lucide-react';

interface LiquidityPulseProps {
  total: number;
}

export default function LiquidityPulse({ total }: LiquidityPulseProps) {
  return (
    <div className="p-6 relative overflow-hidden group h-full">
      <div className="absolute -right-2 -top-2 w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
        <Droplets size={32} className="text-emerald-500/30" />
      </div>
      
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total System Liquidity</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
            {formatRichCurrency(total, 'USD', 0).map((part, i) => {
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
          <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase">
            <Activity size={12} className="animate-pulse" />
            <span>Aggregate Capital Base</span>
          </div>
        </div>
      </div>
    </div>
  );
}
