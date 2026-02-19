'use client';

import ChartCard from '../ChartCard';

export function CohortHeatmap({ data }: { data: any[] }) {
  if (!data) return null;

  // Function to determine cell color intensity
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-emerald-500/80';
    if (pct >= 60) return 'bg-emerald-500/60';
    if (pct >= 45) return 'bg-emerald-500/40';
    if (pct >= 30) return 'bg-emerald-500/20';
    return 'bg-muted';
  };

  return (
    <ChartCard title="Cohort Retention" description="Retention by signup month">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px]">
           {/* Header */}
           <div className="flex mb-2">
               <div className="w-20 shrink-0 font-bold text-xs text-muted-foreground">Cohort</div>
               <div className="flex-1 flex justify-between pr-4">
                  {[0, 1, 2, 3, 4, 5].map(m => (
                      <div key={m} className="flex-1 text-center text-xs font-medium text-muted-foreground">M+{m}</div>
                  ))}
               </div>
           </div>

           {/* Rows */}
           <div className="space-y-2">
               {data.map((cohort: any, i: number) => (
                   <div key={i} className="flex items-center">
                       <div className="w-20 shrink-0 text-xs font-semibold text-foreground">{cohort.month}</div>
                       <div className="flex-1 flex gap-1 pr-4">
                           {cohort.retention.map((pct: number, j: number) => (
                               <div 
                                  key={j} 
                                  className={`flex-1 h-8 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${getColor(pct)}`}
                                  title={`Month ${j}: ${pct}% retained`}
                               >
                                   {pct}%
                               </div>
                           ))}
                           {/* Fill remaining slots */}
                           {Array.from({length: 6 - cohort.retention.length}).map((_, k) => (
                               <div key={`empty-${k}`} className="flex-1 h-8 bg-muted/20 rounded-md" />
                           ))}
                       </div>
                   </div>
               ))}
           </div>
        </div>
      </div>
    </ChartCard>
  );
}
