"use client";

import TimeFilter from "@/components/TimeFilter";
import TransactionList from "@/components/TransactionList";
import VolumeChart from "@/components/VolumeChart";
import { POLLING_INTERVAL } from "@/lib/constants";
import { formatCurrency, formatNumber, formatRichCurrency } from "@/lib/utils";
import {
  Activity,
  ArrowLeft,
  Clock,
  CreditCard,
  Store,
  TrendingUp,
  Users as UsersIcon
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EntityProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/merchants/${id}?range=${timeRange}&startDate=${startDate}&endDate=${endDate}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [id, timeRange, startDate, endDate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin text-orange-500"><Store size={32} /></div>
    </div>
  );

  if (data?.error) return (
    <div className="p-8 text-center text-red-500">Error: {data.error}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Network
        </button>

        <TimeFilter 
          value={timeRange} 
          onChange={setTimeRange} 
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Entity Info Banner - Redesigned */}
      <div className="relative overflow-hidden bg-gradient-to-br from-card to-muted/20 border border-border rounded-3xl p-8 lg:p-10 shadow-sm">
         <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-[2.5rem] flex items-center justify-center font-bold shadow-sm border border-orange-500/20">
                     <Store size={48} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-sm text-emerald-500">
                    <TrendingUp size={16} />
                  </div>
                </div>
                
                <div className="text-center md:text-left">
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                     <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase border border-emerald-500/20 tracking-tighter">
                        Verified Network Node
                     </span>
                     {data.transactions?.[0] && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-background/50 backdrop-blur-sm rounded-full text-[10px] text-muted-foreground font-bold border border-border shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Live Sync: {new Date(data.transactions[0].ts).toLocaleTimeString()}
                        </div>
                     )}
                   </div>
                   <h1 className="text-5xl font-black text-foreground tracking-tight mb-2">{data?.name || 'Entity Profile'}</h1>
                   <p className="text-muted-foreground font-mono text-sm tracking-[0.2em] opacity-60 uppercase">{id}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
               <div className="flex-1 lg:flex-none bg-orange-500 text-white p-6 rounded-[2rem] shadow-xl shadow-orange-500/20 min-w-[200px]">
                  <p className="text-[10px] opacity-70 uppercase font-black tracking-widest mb-2">Avg. Ticket Size</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-black tabular-nums">{formatCurrency(data.summary.avg_sale, 'USD')}</p>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                       <Activity size={20} />
                    </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            <div className="bg-background/40 backdrop-blur-sm border border-border/60 p-5 rounded-2xl shadow-sm hover:border-orange-500/30 transition-colors group">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 group-hover:text-orange-500 transition-colors">Managed Portfolio Volume</p>
               <div className="flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums">
                  {formatRichCurrency(data?.summary?.total_revenue || 0, 'USD', 0).map((part, i) => (
                    <span key={i} className={i === 0 ? "text-2xl font-black text-foreground" : "text-xs text-muted-foreground/60"}>
                      {part.value}<span className="text-[8px] ml-0.5 opacity-70 uppercase font-bold">{part.unit}</span>
                    </span>
                  ))}
               </div>
            </div>
            
            <div className="bg-background/40 backdrop-blur-sm border border-border/60 p-5 rounded-2xl shadow-sm">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Total Network Connections</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-black text-foreground tabular-nums">{formatNumber(data?.summary.unique_customers || 0)}</p>
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Active Nodes</span>
               </div>
            </div>

            <div className="bg-background/40 backdrop-blur-sm border border-border/60 p-5 rounded-2xl shadow-sm">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Operational Velocity</p>
               <div className="flex items-baseline gap-2">
                 <p className="text-2xl font-black text-foreground tabular-nums">{formatNumber(data?.summary.tx_count || 0)}</p>
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Processed Events</span>
               </div>
            </div>

            <div className="bg-background/40 backdrop-blur-sm border border-border/60 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
               <div className="flex items-center gap-3">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-orange-500/20" />
                      </div>
                    ))}
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground leading-tight">High Network Connectivity <br/> <span className="text-orange-500">99.9% Rank</span></p>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
         <div className="lg:col-span-4 rounded-2xl shadow-sm border border-border bg-card">
             <VolumeChart data={data.charts.revenue_over_time} />
         </div>


         {/* Hourly Heatmap Distribution */}
         <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
               <Clock size={18} className="text-orange-500" />
               <h3 className="font-bold text-foreground">Traffic Density</h3>
            </div>
            <div className="space-y-3">
               {data.charts.hourly_distribution.map((h: any) => (
                 <div key={h.hour} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground w-8">{String(h.hour).padStart(2, '0')}:00</span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                       <div 
                          className="h-full bg-orange-500/60 rounded-full" 
                          style={{ width: `${(h.count / Math.max(...data.charts.hourly_distribution.map((x:any) => x.count))) * 100}%` }} 
                       />
                    </div>
                    <span className="text-[10px] font-bold text-foreground w-6">{h.count}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* User Rankings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Leaderboard: Interaction Volume
            </h3>
            <div className="space-y-4">
              {(data.rankings?.top_by_volume ?? []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-blue-500 transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground shrink-0">{formatCurrency(m.volume)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-500" />
              Top Frequency (Count)
            </h3>
            <div className="space-y-4">
              {(data.rankings?.top_by_count ?? []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-[10px] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-indigo-500 transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground shrink-0">{formatNumber(m.count)} txs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full md:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <UsersIcon size={16} className="text-emerald-500" />
              Top Global Contributors
            </h3>
            <div className="space-y-4">
              {(data.rankings?.top_by_revenue ?? []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-emerald-500 transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500 shrink-0">{formatCurrency(m.volume)}</span>
                </div>
              ))}
            </div>
          </div>
      </div>


      <TransactionList transactions={data.transactions} />
    </div>
  );
}
