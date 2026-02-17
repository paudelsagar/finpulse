'use client';

import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export default function HighValueAlerts({ alerts }: { alerts: any[] }) {
  const header = (
    <div className="mb-6 shrink-0">
      <h3 className="text-lg font-semibold text-foreground">High-Value Alerts</h3>
      <p className="text-sm text-muted-foreground">Real-time large transaction monitor</p>
    </div>
  );

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
        {header}
        <div className="flex-1 w-full min-h-0 relative flex flex-col items-center justify-center text-muted-foreground opacity-50">
          <AlertTriangle size={32} className="mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">No Alerts Detected</p>
          <p className="text-[10px] mt-1">Network traffic within normal bounds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
      {header}
      <div className="flex-1 w-full min-h-0 relative space-y-4 overflow-y-auto pr-1 custom-scrollbar">
        {alerts.map((alert, i) => (
          <div 
            key={alert.transactionId} 
            className="group relative flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-all duration-300 overflow-hidden"
          >
            {/* Animated background pulse for the latest alert */}
            {i === 0 && (
              <div className="absolute inset-0 bg-orange-500/5 animate-pulse pointer-events-none" />
            )}
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                <div className="animate-bounce-subtle">
                   <TrendingUp size={20} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-foreground uppercase tracking-tight">Large Transfer</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-600 text-[8px] font-black uppercase">Alert</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                  {alert.sourceName} → {alert.targetName}
                </p>
              </div>
            </div>

            <div className="text-right relative z-10">
              <p className="text-sm font-black text-orange-600 tabular-nums">
                {formatCurrency(alert.amount)}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5 text-muted-foreground">
                <Clock size={10} />
                <span className="text-[9px] font-bold">
                  {new Date(alert.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
