'use client';

import { formatCompactCurrency } from '@/lib/utils';
import { RefreshCcw, TrendingDown } from 'lucide-react';
import ChartCard from './ChartCard';

interface CorrectionTrackerProps {
  data: {
    doc_count: number;
    total_reversals: { value: number };
  };
}

export default function CorrectionTracker({ data }: CorrectionTrackerProps) {
  const count = data?.doc_count || 0;
  const volume = data?.total_reversals?.value || 0;

  return (
    <ChartCard 
      title="Reversal Intelligence" 
      description="Refunding & correction tracking"
      className="h-full"
    >
      <div className="flex flex-col justify-between h-full py-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-sm shrink-0">
            <RefreshCcw size={24} className={count > 0 ? "animate-spin-slow" : ""} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reversal Volume</p>
            <h3 className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {formatCompactCurrency(volume)}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-orange-500 text-[10px] font-bold uppercase">
              <TrendingDown size={12} />
              <span>{count} Corrections Logged</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between items-end border-b border-border/50 pb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Adjustment Rate</span>
            <span className="text-xs font-mono font-bold text-foreground">
               {count > 0 ? "Active" : "Stable"}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground/60 italic">
            Monitoring linked transaction chains for refunds, voids, and reversals across all channels.
          </p>
        </div>
      </div>
    </ChartCard>
  );
}
