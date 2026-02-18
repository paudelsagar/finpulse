'use client';

import { Hash } from 'lucide-react';

interface IntentCloudProps {
  data: any[];
}

export default function IntentCloud({ data }: IntentCloudProps) {
  // Filter out very short or numeric tokens if needed, though ES exclusion handles most
  const keywords = data.filter(b => b.key.length > 2).slice(0, 12);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Demand Signal</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Top Transaction Intents</p>
        </div>
        <Hash size={16} className="text-primary/50" />
      </div>

      <div className="flex-1 flex flex-wrap gap-2 content-start">
        {keywords.map((item, index) => {
          const fontSize = index === 0 ? 'text-sm' : index < 4 ? 'text-xs' : 'text-[10px]';
          const opacity = index === 0 ? 'opacity-100' : index < 4 ? 'opacity-80' : 'opacity-60';
          
          return (
            <div 
              key={item.key}
              className={`px-3 py-1.5 rounded-full border border-border bg-muted/30 flex items-center gap-2 hover:bg-muted/50 transition-colors group cursor-default ${opacity}`}
            >
              <span className={`${fontSize} font-bold text-foreground group-hover:text-primary transition-colors`}>
                {item.key}
              </span>
              <span className="text-[10px] font-black text-muted-foreground/50">
                {item.doc_count}
              </span>
            </div>
          );
        })}

        {keywords.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full h-32 text-muted-foreground opacity-30">
            <p className="text-xs font-bold uppercase tracking-widest">Awaiting Semantic Data</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground font-medium italic">
          Extracted from human-entered transaction remarks via semantic frequency analysis.
        </p>
      </div>
    </div>
  );
}
