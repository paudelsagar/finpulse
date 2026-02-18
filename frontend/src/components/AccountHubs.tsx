'use client';

import { Building } from 'lucide-react';

interface AccountHubsProps {
  data: any[];
}

export default function AccountHubs({ data }: AccountHubsProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Account Hubs</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Top Active Endpoints</p>
        </div>
        <Building size={16} className="text-primary/50" />
      </div>

      <div className="flex-1 space-y-4">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.key} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-muted-foreground/30 w-4">#{index + 1}</span>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary transition-colors">{item.key}</span>
                <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-tighter">Bank Identifier</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-foreground uppercase">
                {item.doc_count.toLocaleString()} <span className="text-[8px] opacity-60">Hits</span>
              </span>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground opacity-50">
            <Building size={32} strokeWidth={1} className="mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">No Account Data</p>
          </div>
        )}
      </div>
    </div>
  );
}
