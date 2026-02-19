'use client';

import { formatCurrency, formatNumber } from '@/lib/utils';
import { useState } from 'react';

interface ActivityItem {
  date: string; // ISO string or formatted date-time
  count: number;
  volume: number;
}

interface ActivityHeatmapProps {
  data: ActivityItem[];
  timeRange: string;
}

// Strategy Inteface
interface HeatmapConfig {
    title: string;
    sub: string;
    rows: { label: string, filter: (d: Date) => boolean }[];
    cols: { label: string, key: number }[];
    getDataPoint: (itemDate: Date, rowIdx: number, colKey: number) => boolean;
}

export function ActivityHeatmap({ data, timeRange }: ActivityHeatmapProps) {
  const [metric, setMetric] = useState<'count' | 'volume'>('count');
  const [hoveredCell, setHoveredCell] = useState<{ rowLabel: string; colLabel: string; val: number } | null>(null);

  // Define Strategies
  const strategies: Record<string, () => any> = {
      '15m': () => {
          // 12 Rows (5s Buckets), 15 Cols (Minutes)
          const minutesConfig = Array.from({length: 15}).map((_, i) => ({ label: `-${15-i}m`, offset: 15-i-1 }));
          
          return {
              title: 'Real-time Intensity (15m)',
              sub: 'Vertical: Seconds (5s buckets) | Horizontal: Minutes',
              cols: minutesConfig.map(m => ({ label: m.label, key: m.offset })),
              colCount: 15,
              grid: [], // processed below
              process: () => {
                   const now = new Date();
                   const buckets = 12; // 60s / 5s
                   const bucketSize = 5;

                   // Optimize: Create a Map for O(1) lookup
                   // Key: "HH:MM:SS"
                   const dataMap = new Map<string, ActivityItem>();
                   data.forEach(d => {
                       const t = new Date(d.date);
                       const key = `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;
                       dataMap.set(key, d);
                   });

                   const grid = Array.from({length: buckets}).map((_, bIdx) => {
                       const startSec = bIdx * bucketSize;
                       const endSec = startSec + bucketSize - 1;
                       const label = `${startSec}-${endSec}s`;

                       const cells = minutesConfig.map(m => {
                           const targetMinute = new Date(now.getTime() - m.offset * 60000);
                           const targetH = targetMinute.getHours();
                           const targetM = targetMinute.getMinutes();

                           let sum = 0;
                           for (let s = startSec; s <= endSec; s++) {
                               const key = `${targetH}:${targetM}:${s}`;
                               const item = dataMap.get(key);
                               if (item) {
                                   sum += (metric === 'count' ? item.count : item.volume);
                               }
                           }
                           
                           return { val: sum };
                       });
                       return { label, cells };
                   });
                   return grid;
              }
          };
      },
      '7d': () => {
          // 7 Rows (Days), 24 Cols (Hours)
          const uniqueDays = Array.from(new Set(data.map(d => new Date(d.date).toLocaleDateString()))).slice(-7);
          
          // Optimize: Map Key "DateString:Hour"
          const dataMap = new Map<string, ActivityItem>();
          data.forEach(d => {
             const t = new Date(d.date);
             const key = `${t.toLocaleDateString()}:${t.getHours()}`; // "1/15/2026:14"
             dataMap.set(key, d); 
          });

          return {
              title: 'Weekly Activity',
              sub: '7-day heat map by hour',
              cols: [0, 6, 12, 18, 23].map(h => ({ label: `${h}:00`, key: h })), // Sparse labels for axis
              colCount: 24, // Total slots
              grid: uniqueDays.map(dayKey => {
                  const dayDate = new Date(dayKey); 
                  // If dayKey invalid, fallback.
                  // Assume uniqueDays are valid locale strings.

                  return {
                      label: new Date(dayKey).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                      cells: Array.from({length: 24}).map((_, h) => {
                          const key = `${dayKey}:${h}`;
                          const found = dataMap.get(key);
                          return { val: found ? (metric === 'count' ? found.count : found.volume) : 0 };
                      })
                  };
              })
          };
      },
      '24h': () => {
           // 24 Rows (Hours), 60 Cols (Minutes)
           // Rows: 0h ago, 1h ago ... 23h ago
           const hoursConfig = Array.from({length: 24}).map((_, i) => ({ label: `-${i}h`, offset: i }));

           return {
               title: '24h Intensity',
               sub: 'Vertical: Hours | Horizontal: Minutes',
               cols: [0, 15, 30, 45, 59].map(m => ({ label: `${m}m`, key: m })),
               colCount: 60,
               grid: [], // processed below
               process: () => {
                   const now = new Date();

                   // Optimize: Map Key "Month:Day:Hour:Minute"
                   // Use full precision to distinguish 10:00 today vs 10:00 yesterday?
                   // data is limited to last 24h, so collisions are minimal/impossible if "Day" is included.
                   const dataMap = new Map<string, ActivityItem>();
                   data.forEach(d => {
                       const t = new Date(d.date);
                       const key = `${t.getDate()}:${t.getHours()}:${t.getMinutes()}`;
                       dataMap.set(key, d);
                   });

                   const grid = hoursConfig.map(h => {
                       const targetHour = new Date(now.getTime() - h.offset * 3600000); // 60 * 60 * 1000
                       const targetD = targetHour.getDate();
                       const targetH = targetHour.getHours();
                       
                       const cells = Array.from({length: 60}).map((_, m) => {
                           const key = `${targetD}:${targetH}:${m}`;
                           const found = dataMap.get(key);
                           return { val: found ? (metric === 'count' ? found.count : found.volume) : 0 };
                       });
                       
                       // Format label to show Day + Hour (e.g., "Mon 14h")
                       const day = targetHour.toLocaleDateString([], {weekday: 'short'});
                       const hour = targetHour.getHours();
                       const label = `${day} ${hour}h`;
                       return { label, cells };
                   });
                   return grid;
               }
           }
      },
      '1h': () => {
          // 12 Rows (5s Buckets), 60 Cols (Minutes)
          const minutesConfig = Array.from({length: 60}).map((_, i) => ({ label: i % 10 === 0 ? `-${60-i}m` : '', offset: 60-i-1 }));

           return {
              title: 'Deep Dive (1h)',
              sub: 'Vertical: Seconds (5s buckets) | Horizontal: Minutes',
              cols: minutesConfig.map(m => ({ label: m.label, key: m.offset })),
              colCount: 60,
              grid: [], // processed below
              process: () => {
                   const now = new Date();
                   const buckets = 12; // 60s / 5s
                   const bucketSize = 5;

                   // Optimize: Map Key "HH:MM:SS"
                   const dataMap = new Map<string, ActivityItem>();
                   data.forEach(d => {
                       const t = new Date(d.date);
                       const key = `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;
                       dataMap.set(key, d);
                   });

                   const grid = Array.from({length: buckets}).map((_, bIdx) => {
                       const startSec = bIdx * bucketSize;
                       const endSec = startSec + bucketSize - 1;
                       const label = `${startSec}-${endSec}s`;

                       const cells = minutesConfig.map(m => {
                           const targetMinute = new Date(now.getTime() - m.offset * 60000);
                           const targetH = targetMinute.getHours();
                           const targetM = targetMinute.getMinutes();

                           let sum = 0;
                           for (let s = startSec; s <= endSec; s++) {
                               const key = `${targetH}:${targetM}:${s}`;
                               const item = dataMap.get(key);
                               if (item) {
                                   sum += (metric === 'count' ? item.count : item.volume);
                               }
                           }
                           
                           return { val: sum };
                       });
                       return { label, cells };
                   });
                   return grid;
              }
          };
      },
      '30d': () => {
        // 24 Rows (Hours), 30 Cols (Days)
        // X-axis: Days. Y-axis: Hours.
        const now = new Date();
        const daysConfig = Array.from({length: 30}).map((_, i) => {
             const d = new Date(now);
             d.setDate(d.getDate() - (29 - i)); // -29 to 0
             return { 
                 label: d.getDate().toString(), // "1", "15", "30"
                 dateStrShort: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                 // Store day for filtering
                 day: d.getDate(),
                 month: d.getMonth()
             };
        });

        return {
            title: 'Monthly Intensity',
            sub: 'Vertical: Hours (0-23) | Horizontal: Days',
            cols: daysConfig.map((d, i) => ({ 
                label: i % 3 === 0 ? d.dateStrShort : '', // Sparse labels every 3rd day
                key: d.day 
            })),
            colCount: 30,
            grid: [], // processed below
            process: () => {
                 // Optimize: Map Key "Month:Day:Hour"
                 const dataMap = new Map<string, ActivityItem>();
                 data.forEach(d => {
                     const t = new Date(d.date);
                     const key = `${t.getMonth()}:${t.getDate()}:${t.getHours()}`;
                     dataMap.set(key, d);
                 });

                 const grid = Array.from({length: 24}).map((_, h) => {
                     const label = `${h}:00`;
                     
                     const cells = daysConfig.map(dayCfg => {
                         const key = `${dayCfg.month}:${dayCfg.day}:${h}`;
                         const found = dataMap.get(key);
                         return { val: found ? (metric === 'count' ? found.count : found.volume) : 0 };
                     });
                     
                     return { label, cells };
                 });
                 return grid;
            }
        };
      },
      '365d': () => {
          // 12 Rows (Months), 31 Cols (Days)
          const now = new Date();
          const monthsConfig: { month: number; year: number; label: string }[] = [];
          for (let i = 0; i < 12; i++) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              monthsConfig.push({
                  month: d.getMonth(),
                  year: d.getFullYear(),
                  label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              });
          }

          return {
              title: 'Yearly Intensity',
              sub: 'Vertical: Month | Horizontal: Day',
              cols: Array.from({length: 31}).map((_, i) => ({ 
                  label: (i+1) % 5 === 0 ? `${i+1}` : '', // Label every 5th day
                  key: i+1 
              })),
              colCount: 31,
              grid: monthsConfig.map(mCfg => {
                   // Optimize: Filter data for this month first? 
                   // Or just use Map "Year:Month:Day"
                   // This runs inside map loop, but we can build map once outside if we could.
                   // But `grid` maps over `monthsConfig`. 
                   // We need to build map *before* mapping grid.
                   // Since we can't easily inject code before `grid:`, 
                   // we can optimize by doing filtering or just simpler lookup.
                   // But `grid` expects an array.
                   // Actually, we can define `process` function for 365d strategy too!
                   // The current implementation uses inline `grid: ...`.
                   // Let's refactor to use `process`.
                   return null; // Placeholder to force switch to process()
              }),
              process: () => {
                   // Optimize: Map Key "Year:Month:Day"
                   const dataMap = new Map<string, ActivityItem>();
                   data.forEach(d => {
                       const t = new Date(d.date);
                       const key = `${t.getFullYear()}:${t.getMonth()}:${t.getDate()}`;
                       dataMap.set(key, d); 
                   });

                   return monthsConfig.map(mCfg => {
                       return {
                           label: mCfg.label,
                           cells: Array.from({length: 31}).map((_, dIdx) => {
                               const dayNum = dIdx + 1;
                               const key = `${mCfg.year}:${mCfg.month}:${dayNum}`;
                               const found = dataMap.get(key);
                               return { val: found ? (metric === 'count' ? found.count : found.volume) : 0 };
                           })
                       };
                   });
              }
          };
      },
      'default': () => {
          // Fallback to 7d logic if unknown
          const uniqueDays = Array.from(new Set(data.map(d => new Date(d.date).toLocaleDateString()))).slice(-7);
          return {
              title: 'Activity',
              sub: 'Activity Heatmap',
              cols: [0, 6, 12, 18, 23].map(h => ({ label: `${h}:00`, key: h })),
              colCount: 24,
              grid: uniqueDays.map(dayKey => {
                  const dayItems = data.filter(d => new Date(d.date).toLocaleDateString() === dayKey);
                  return {
                      label: new Date(dayItems[0]?.date || dayKey).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
                      cells: Array.from({length: 24}).map((_, h) => {
                          const found = dayItems.find(d => new Date(d.date).getHours() === h);
                          return { val: found ? (metric === 'count' ? found.count : found.volume) : 0 };
                      })
                  };
              })
          };
      }
  };

  const activeStrategy = strategies[timeRange] || strategies['default'];
  const config = activeStrategy();
  if (config.process) {
      config.grid = config.process();
  }

  // Handle 365d special case effectively or just fallback
  if (config.grid.length === 0 && data.length > 0 && timeRange !== '365d') {
      // safe fallback
  }

  // Calculate max for intensity
  const flatVals = config.grid.flatMap((r: any) => r.cells.map((c: any) => c.val));
  const maxVal = Math.max(...flatVals, 1);

  const getIntensityClass = (val: number) => {
    const ratio = val / maxVal;
    if (val === 0) return 'bg-muted/30';
    if (ratio < 0.25) return metric === 'count' ? 'bg-emerald-500/20' : 'bg-blue-500/20';
    if (ratio < 0.50) return metric === 'count' ? 'bg-emerald-500/40' : 'bg-blue-500/40';
    if (ratio < 0.75) return metric === 'count' ? 'bg-emerald-500/70' : 'bg-blue-500/70';
    return metric === 'count' ? 'bg-emerald-500' : 'bg-blue-500';
  };

  // ... inside component ...
  
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm w-full">
      <div className="flex items-center justify-between mb-6 relative">
        <div>
           <h3 className="text-lg font-semibold text-foreground tracking-tight">{config.title}</h3>
           <p className="text-sm text-muted-foreground">{config.sub}</p>
        </div>

        {hoveredCell && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                    <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-2">
                    <span className="uppercase text-muted-foreground">{hoveredCell.rowLabel}</span>
                    {hoveredCell.colLabel && <span className="text-muted-foreground">•</span>}
                    {hoveredCell.colLabel && <span>{hoveredCell.colLabel}</span>}
                    </h3>
                    <p className={`text-lg font-mono font-bold leading-none mt-1 ${metric === 'count' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {metric === 'count' ? `${formatNumber(hoveredCell.val)} txns` : formatCurrency(hoveredCell.val)}
                    </p>
                </div>
            </div>
        )}
        
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
          <button
            onClick={() => setMetric('count')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
              metric === 'count' 
                ? 'bg-background text-emerald-600 shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Count
          </button>
          <button
            onClick={() => setMetric('volume')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
              metric === 'volume' 
                ? 'bg-background text-blue-600 shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
         <div className="min-w-[600px]">
             {/* Dynamic Header */}
             <div className="flex mb-1">
                <div className="w-16 shrink-0"></div> 
                <div className="flex-1 flex justify-between px-0.5">
                   {config.cols.map((Col: any) => (
                       <span key={Col.key} className="text-[9px] text-muted-foreground font-medium uppercase">{Col.label}</span>
                   ))}
                </div>
            </div>

            <div className="space-y-[2px]">
                {config.grid.map((row: any, rIdx: number) => (
                    <div key={rIdx} className="flex items-center gap-1">
                        <div className="w-16 shrink-0 text-[10px] font-semibold text-muted-foreground text-right pr-2 leading-none">
                             {row.label}
                        </div>
                        <div className="flex-1 flex gap-px h-3">
                             {row.cells.map((cell: any, cIdx: number) => (
                                 <div 
                                    key={cIdx}
                                    onMouseEnter={() => setHoveredCell({ rowLabel: row.label, colLabel: '', val: cell.val })}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    className={`
                                        flex-1 rounded-[1px] cursor-pointer transition-all duration-200
                                        ${getIntensityClass(cell.val)}
                                        hover:ring-1 hover:ring-offset-0 hover:ring-primary/50 hover:z-10
                                    `}
                                 />
                             ))}
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
}
