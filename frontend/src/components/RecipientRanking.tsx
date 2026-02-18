'use client';

import { Users } from 'lucide-react';

interface RecipientRankingProps {
  data: any[];
}

export default function RecipientRanking({ data }: RecipientRankingProps) {
  const rankings = data.filter(d => d.key !== 'Merchant/System' && d.key !== 'null').slice(0, 5);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Recipient Hubs</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Top P2P Targets</p>
        </div>
        <Users size={16} className="text-primary/50" />
      </div>

      <div className="flex-1 space-y-4">
        {rankings.map((item, index) => (
          <div key={item.key} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-muted-foreground/30 w-4">#{index + 1}</span>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary transition-colors">{item.key}</span>
                <div className="w-24 h-1 bg-muted rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-primary/40 rounded-full" 
                    style={{ width: `${(item.doc_count / rankings[0].doc_count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted/30 px-2 py-0.5 rounded">
              {item.doc_count.toLocaleString()} <span className="text-[8px] opacity-60">TXS</span>
            </span>
          </div>
        ))}

        {rankings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground opacity-50">
            <Users size={32} strokeWidth={1} className="mb-2" />
            <p className="text-xs font-bold uppercase tracking-widest">No P2P Data</p>
          </div>
        )}
      </div>
    </div>
  );
}
