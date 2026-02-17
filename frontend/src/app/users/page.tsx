"use client";

import ChartCard from "@/components/ChartCard";
import Pagination from "@/components/Pagination";
import { formatCurrency, formatNumber, formatRichCurrency } from "@/lib/utils";
import { ArrowRight, CreditCard, TrendingUp, Users as UsersIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

import TimeFilter from "@/components/TimeFilter";
import { POLLING_INTERVAL } from "@/lib/constants";

export default function UsersPage() {
  const [data, setData] = useState<{ 
    data: any[], 
    total: number, 
    totalPages: number, 
    page: number, 
    trend: any[],
    global: { total_spent: number, total_received: number, total_txs: number, avg_tx: number, top_spender: string },
    rankings: {
      top_by_volume: any[],
      top_by_count: any[],
      top_by_revenue: any[]
    }
  }>({
    data: [],
    total: 0,
    totalPages: 0,
    page: 1,
    trend: [],
    global: { total_spent: 0, total_received: 0, total_txs: 0, avg_tx: 0, top_spender: 'N/A' },
    rankings: {
      top_by_volume: [],
      top_by_count: [],
      top_by_revenue: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("15m");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async (page: number, range: string, start: string, end: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let url = `/api/users?page=${page}&limit=20`;
      if (range) {
        url += `&range=${range}`;
      }
      if (start) {
        url += `&startDate=${start}`;
      }
      if (end) {
        url += `&endDate=${end}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, timeRange, startDate, endDate);
    const interval = setInterval(() => {
      fetchData(currentPage, timeRange, startDate, endDate, true);
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [currentPage, timeRange, startDate, endDate, fetchData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">User Directory</h1>
          <p className="text-muted-foreground mt-2 text-md flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Insights for {(data?.total ?? 0).toLocaleString()} users active in the selected timeframe.
          </p>
        </div>

        <TimeFilter 
          value={timeRange} 
          onChange={(val) => {
            setTimeRange(val);
            setCurrentPage(1);
          }} 
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* KPI Tiles Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">Total Users</p>
              <h3 className="text-2xl xl:text-3xl font-bold mt-2 text-foreground font-mono tracking-tight truncate">{(data?.total ?? 0).toLocaleString()}</h3>
              <p className="text-[10px] text-primary font-bold mt-2 uppercase tracking-tighter truncate">Registered & Active</p>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
              <UsersIcon size={20} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">Avg Transaction</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums overflow-hidden">
                {formatRichCurrency(data?.global?.avg_tx ?? 0).map((part, i) => {
                  const sizeClass = [
                    "text-3xl font-bold text-foreground",
                    "text-base font-semibold text-muted-foreground",
                    "text-xs font-medium text-muted-foreground/60",
                    "text-[10px] font-medium text-muted-foreground/40"
                  ][Math.min(i, 3)];
                  return (
                    <span key={i} className={sizeClass}>
                      {part.value}<span className="text-[10px] ml-0.5 opacity-70 font-bold uppercase">{part.unit}</span>
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-blue-500 font-bold mt-2 uppercase tracking-tighter truncate">Per Interaction</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all group border-l-4 border-l-emerald-500 overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">Global Vol (Pool)</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums overflow-hidden">
                {formatRichCurrency(data?.global?.total_spent ?? 0).map((part, i) => {
                  const sizeClass = [
                    "text-3xl font-bold text-emerald-500",
                    "text-base font-bold text-emerald-500/80",
                    "text-xs font-semibold text-emerald-500/60",
                    "text-[10px] font-medium text-emerald-500/40"
                  ][Math.min(i, 3)];
                  return (
                    <span key={i} className={sizeClass}>
                      {part.value}<span className="text-[10px] ml-0.5 opacity-80 font-bold uppercase">{part.unit}</span>
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-tighter truncate">Live Network Flow</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Insights Section: Rankings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Leaderboard: Volume
            </h3>
            <div className="space-y-4">
              {(data?.rankings?.top_by_volume ?? []).map((u, i) => (
                <div key={u.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{u.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground shrink-0">{formatCurrency(u.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" />
              Top Activity (Count)
            </h3>
            <div className="space-y-4">
              {(data?.rankings?.top_by_count ?? []).map((u, i) => (
                <div key={u.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px] shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-blue-500 transition-colors">{u.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground shrink-0">{u.value} txs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full md:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500 rotate-90" />
              Top Revenue Inflow
            </h3>
            <div className="space-y-4">
              {(data?.rankings?.top_by_revenue ?? []).map((u, i) => (
                <div key={u.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px] shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold truncate group-hover:text-emerald-500 transition-colors">{u.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-500 shrink-0">{formatCurrency(u.value)}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
          <ChartCard title="User Activity Trend" description="Network interaction volume over time" className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.trend ?? []}>
                        <defs>
                            <linearGradient id="colorUserVol" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis 
                            dataKey="time" 
                            fontSize={10} 
                            tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                            stroke="var(--muted-foreground)"
                        />
                        <YAxis fontSize={10} stroke="var(--muted-foreground)" tickFormatter={(val) => `$${formatNumber(val)}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                            formatter={(value: any) => [formatCurrency(value), 'Volume']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUserVol)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin text-primary flex flex-col items-center gap-2">
              <UsersIcon size={24} />
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Updating...</span>
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border text-left">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold text-center">User ID</th>
              <th className="px-6 py-4 font-semibold text-right">Transactions</th>
              <th className="px-6 py-4 font-semibold text-right text-red-500/80">Spent</th>
              <th className="px-6 py-4 font-semibold text-right text-emerald-500/80">Received</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.data ?? []).map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-foreground">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-mono text-[10px] text-muted-foreground">{user.id}</td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-1.5 font-medium">
                      <CreditCard size={14} className="text-muted-foreground" />
                      {user.tx_count}
                   </div>
                </td>
                <td className="px-6 py-4 text-right font-bold text-red-500">{formatCurrency(user.total_spent)}</td>
                <td className="px-6 py-4 text-right font-bold text-emerald-500">{formatCurrency(user.total_received)}</td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/users/${user.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors shadow-sm"
                  >
                    Profile <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
            {(data?.data?.length ?? 0) === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                   No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground font-medium">
          Showing <span className="text-foreground">{(currentPage - 1) * 20 + 1}</span> to <span className="text-foreground">{Math.min(currentPage * 20, data?.total ?? 0)}</span> of <span className="text-foreground">{data?.total ?? 0}</span> users
        </p>
        <Pagination 
          currentPage={currentPage}
          totalPages={data?.totalPages ?? 0}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
