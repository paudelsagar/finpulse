'use client';

import { ArrowRightLeft, Building2, User } from 'lucide-react';

interface NetworkConnectivityProps {
  data: any[];
}

export default function NetworkConnectivity({ data }: NetworkConnectivityProps) {
  // We'll use the 'by_type' aggregation for this
  const chartData = data.map(bucket => ({
    name: bucket.key,
    value: bucket.doc_count,
    volume: bucket.total_spent.value
  })).sort((a, b) => b.value - a.value);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'P2P': return { label: 'Peer to Peer', flow: 'User → User' };
      case 'P2M': return { label: 'Payment', flow: 'User → Merchant' };
      case 'M2P': return { label: 'Payout', flow: 'Merchant → User' };
      case 'B2B': return { label: 'Business', flow: 'Merchant → Merchant' };
      case 'SELF': return { label: 'Internal', flow: 'Own Account' };
      default: return { label: type, flow: 'Mixed' };
    }
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Network Topology</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Transaction Archetypes</p>
        </div>
        <ArrowRightLeft size={16} className="text-primary/50" />
      </div>

      <div className="flex-1 space-y-4 overflow-auto custom-scrollbar pr-2">
        {chartData.map((item) => {
          const info = getTypeLabel(item.name);
          return (
            <div key={item.name} className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{info.label}</span>
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{item.value.toLocaleString()} TXs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border shadow-sm">
                   <User size={10} className="text-muted-foreground" />
                   <span className="text-[9px] font-bold uppercase tracking-tight text-foreground/70">
                     {item.name === 'B2B' || item.name === 'M2P' ? 'Entity' : 'User'}
                   </span>
                </div>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/40 to-muted-foreground/20 relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border shadow-sm">
                   <Building2 size={10} className="text-muted-foreground" />
                   <span className="text-[9px] font-bold uppercase tracking-tight text-foreground/70">
                     {item.name === 'P2M' || item.name === 'B2B' ? 'Entity' : 'User'}
                   </span>
                </div>
              </div>
              <p className="mt-2 text-[9px] text-muted-foreground font-medium italic">
                {info.flow} interaction model
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
