'use client';

import { useMemo } from 'react';
import ChartCard from './ChartCard';

export default function HourlyHeatmap({ data }: { data: any[] }) {
  const hourlyData = useMemo(() => {
    const hours = Array(24).fill(0);
    let max = 1;
    
    data.forEach(bucket => {
      const h = parseInt(bucket.key);
      if (!isNaN(h) && h >= 0 && h < 24) {
        hours[h] = bucket.doc_count;
        if (bucket.doc_count > max) max = bucket.doc_count;
      }
    });
    
    return { hours, max };
  }, [data]);

  const { hours, max } = hourlyData;

  const getOpacity = (val: number) => {
    if (val === 0) return 0.05;
    return 0.1 + (val / max) * 0.9;
  };

  return (
    <ChartCard 
      title="Hourly Activity" 
      description="Transaction density by hour (04-23)"
      className="h-[300px]"
    >
      <div className="flex flex-col h-full pb-4">
        <div className="grid grid-cols-6 gap-2 flex-1 mt-2">
          {hours.map((val, i) => (
            <div 
              key={i} 
              className="relative group flex flex-col items-center justify-center rounded-md border border-border/50"
              style={{ 
                backgroundColor: `rgba(59, 130, 246, ${getOpacity(val)})` 
              }}
            >
              <span className="text-[10px] font-mono font-medium text-foreground/70">{i.toString().padStart(2, '0')}h</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-background/80 flex items-center justify-center transition-opacity rounded-md">
                <span className="text-[10px] font-bold">{val} tx</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:59</span>
        </div>
      </div>
    </ChartCard>
  );
}
