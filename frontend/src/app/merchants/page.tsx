"use client";

import ChartCard from "@/components/ChartCard";
import Pagination from "@/components/Pagination";
import { formatCurrency, formatNumber, formatRichCurrency, formatRichNumber } from "@/lib/utils";
import { Activity, ArrowRight, CreditCard, DollarSign, Store, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

import TimeFilter from "@/components/TimeFilter";

import { POLLING_INTERVAL } from "@/lib/constants";

export default function EntitiesPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("15m");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rankings, setRankings] = useState<any>(null);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/merchants?range=${timeRange}&startDate=${startDate}&endDate=${endDate}&page=${currentPage}&limit=5`);
      const json = await res.json();
      setEntities(json.data || []);
      setTotalRevenue(json.total_revenue || 0);
      setTotal(json.total || 0);
      setRankings(json.rankings || null);
    } catch (error) {
      console.error("Merchant Fetch Error:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [timeRange, startDate, endDate, currentPage]);

  if (loading && entities.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin text-orange-500"><Store size={32} /></div>
    </div>
  );

  const flowData = [...entities]
    .sort((a,b) => b.total_revenue - a.total_revenue)
    .slice(0, 5)
    .map(e => ({ name: e.name, Inbound: e.total_revenue, Outbound: e.total_debit }));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Merchant Portfolio</h1>
          <p className="text-muted-foreground mt-2 text-md flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            Analyzing performance across {total} monitored entities.
          </p>
        </div>

        <TimeFilter 
           value={timeRange} 
           onChange={(val) => { setTimeRange(val); setCurrentPage(1); }} 
           startDate={startDate}
           endDate={endDate}
           onStartDateChange={(val) => { setStartDate(val); setCurrentPage(1); }}
           onEndDateChange={(val) => { setEndDate(val); setCurrentPage(1); }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Merchants */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm shrink-0">
              <Store size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Merchants</p>
              <h3 className="text-lg font-bold text-foreground mt-1 truncate">
                {total > 0 ? total : '...'}
              </h3>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[10px] text-muted-foreground/60 font-medium font-mono uppercase">Monitored Entities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top by Revenue */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm shrink-0">
              <DollarSign size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Top by Revenue</p>
              <h3 className="text-lg font-bold text-foreground mt-1 truncate">
                {rankings?.top_by_revenue?.[0]?.name || 'N/A'}
              </h3>
              <div className="flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums mt-0.5">
                {formatRichCurrency(rankings?.top_by_revenue?.[0]?.value || 0, 'USD', 0).map((part, i) => (
                  <span key={i} className={i === 0 ? "text-lg font-bold text-emerald-500" : "text-xs text-muted-foreground/60"}>
                    {part.value}<span className="text-[8px] ml-0.5 opacity-70 uppercase">{part.unit}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top by Count */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-sm shrink-0">
              <Zap size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Top by Count</p>
              <h3 className="text-lg font-bold text-foreground mt-1 truncate">
                {rankings?.top_by_count?.[0]?.name || 'N/A'}
              </h3>
              <div className="flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums mt-0.5">
                {formatRichNumber(rankings?.top_by_count?.[0]?.value || 0).map((part, i) => (
                  <span key={i} className={i === 0 ? "text-lg font-bold text-indigo-500" : "text-xs text-muted-foreground/60"}>
                    {part.value}<span className="text-[8px] ml-0.5 opacity-70 uppercase">{part.unit}</span>
                  </span>
                ))}
                <span className="text-[10px] text-muted-foreground/40 ml-1 uppercase font-bold">TXs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top by Net Flow (Volume) */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm shrink-0">
              <TrendingUp size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Top by Net Gain</p>
              <h3 className="text-lg font-bold text-foreground mt-1 truncate">
                {rankings?.top_by_volume?.[0]?.name || 'N/A'}
              </h3>
              <div className="flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums mt-0.5">
                {formatRichCurrency(rankings?.top_by_volume?.[0]?.value || 0, 'USD', 0).map((part, i) => (
                  <span key={i} className={i === 0 ? "text-lg font-bold text-blue-500" : "text-xs text-muted-foreground/60"}>
                    {part.value}<span className="text-[8px] ml-0.5 opacity-70 uppercase">{part.unit}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Insights Section: Rankings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Leaderboard: Net Gain
            </h3>
            <div className="space-y-4">
              {(rankings?.top_by_volume ?? []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-blue-500 transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground shrink-0">{formatCurrency(m.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-500" />
              Top Activity (Count)
            </h3>
            <div className="space-y-4">
              {(rankings?.top_by_count ?? []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-[10px] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-indigo-500 transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground shrink-0">{formatNumber(m.value)} txs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full md:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500" />
              Top Revenue Inflow
            </h3>
            <div className="space-y-4">
              {(rankings?.top_by_revenue ?? []).map((m: any, i: number) => (
                <div key={m.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px] shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-emerald-500 transition-colors">{m.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500 shrink-0">{formatCurrency(m.value)}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
          <ChartCard title="Merchant Flow Comparison" description="Inbound vs Outbound total volume" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" fontSize={10} stroke="var(--muted-foreground)" />
                      <YAxis fontSize={10} stroke="var(--muted-foreground)" tickFormatter={(val) => `$${formatNumber(val)}`} />
                      <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                          formatter={(value: any) => [formatCurrency(value), '']}
                      />
                      <Bar dataKey="Inbound" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Outbound" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
              </ResponsiveContainer>
          </ChartCard>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin text-orange-500 flex flex-col items-center gap-2">
              <Store size={24} />
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Updating...</span>
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border text-left">
            <tr>
              <th className="px-6 py-4 font-semibold">Merchant</th>
              <th className="px-6 py-4 font-semibold text-center">Entity ID</th>
              <th className="px-6 py-4 font-semibold text-right">TX Count</th>
              <th className="px-6 py-4 font-semibold text-right text-emerald-500/80">Inflow</th>
              <th className="px-6 py-4 font-semibold text-right text-red-500/80">Outflow</th>
              <th className="px-6 py-4 font-semibold text-right">Net Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entities.map((entity) => (
              <tr key={entity.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                      <Store size={14} />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground block">{entity.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-mono text-[10px] text-muted-foreground">{entity.id}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-1.5 font-medium">
                      <Activity size={12} className="text-muted-foreground" />
                      {entity.tx_count}
                   </div>
                </td>
                <td className="px-6 py-4 text-right font-bold text-emerald-500">{formatCurrency(entity.total_revenue)}</td>
                <td className="px-6 py-4 text-right font-bold text-red-500">{formatCurrency(entity.total_debit)}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-3">
                      <span className={`font-mono font-bold ${entity.net_flow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {entity.net_flow > 0 ? '+' : ''}{formatCurrency(entity.net_flow)}
                      </span>
                      <Link 
                        href={`/merchants/${entity.id}`}
                        className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-orange-500 hover:text-white transition-all transform group-hover:translate-x-1"
                      >
                        <ArrowRight size={14} />
                      </Link>
                   </div>
                </td>
              </tr>
            ))}
            {entities.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                   No merchants found for the selected timeframe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground font-medium">
          Showing <span className="text-foreground">{(currentPage - 1) * 5 + 1}</span> to <span className="text-foreground">{Math.min(currentPage * 5, total)}</span> of <span className="text-foreground">{total}</span> merchants
        </p>
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(total / 5)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
