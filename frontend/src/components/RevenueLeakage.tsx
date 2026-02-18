'use client';

import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface RevenueLeakageProps {
  reversalVolume: number;
  totalVolume: number;
}

export default function RevenueLeakage({ reversalVolume, totalVolume }: RevenueLeakageProps) {
  const leakageRate = totalVolume > 0 ? (reversalVolume / totalVolume) * 100 : 0;
  
  // Color logic: < 0.5% (Good/Green), < 2% (Warn/Orange), > 2% (Bad/Red)
  const statusColor = leakageRate < 0.5 ? "text-emerald-500" : leakageRate < 2.0 ? "text-orange-500" : "text-destructive";
  const bgStatus = leakageRate < 0.5 ? "bg-emerald-500/10" : leakageRate < 2.0 ? "bg-orange-500/10" : "bg-destructive/10";

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col justify-between relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full flex items-center justify-center opacity-20 ${bgStatus}`}>
        <AlertTriangle size={48} className={statusColor} />
      </div>

      <div>
        <h3 className="text-lg font-bold text-foreground">Revenue Leakage</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Reversal Impact</p>
      </div>

      <div className="mt-6 z-10">
        <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-black ${statusColor}`}>
                {leakageRate.toFixed(3)}%
            </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-medium">of total turnover reversed</p>
        
        <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                <span className="text-muted-foreground">Loss Value</span>
                <span className="text-foreground">{formatCurrency(reversalVolume)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
