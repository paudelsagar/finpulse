"use client";

import Pagination from "@/components/Pagination";
import TimeFilter from "@/components/TimeFilter";
import { POLLING_INTERVAL } from "@/lib/constants";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  Activity,
  ArrowUpRight,
  Car,
  CheckCircle2,
  Clock,
  Coffee,
  Info,
  Music,
  Search,
  ShoppingBag,
  TrendingUp,
  Users as UsersIcon
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";


const getIcon = (category: string) => {
  switch (category) {
    case 'Shopping': return <ShoppingBag size={14} className="text-pink-400" />;
    case 'Food & Drink': return <Coffee size={14} className="text-orange-400" />;
    case 'Entertainment': return <Music size={14} className="text-purple-400" />;
    case 'Transport': return <Car size={14} className="text-blue-400" />;
    default: return <ArrowUpRight size={14} className="text-green-400" />;
  }
};


export default function TransactionsPage() {
  const [data, setData] = useState<{ 
    data: any[], 
    total: number, 
    totalPages: number, 
    page: number, 
    distribution: any[],
    stats: { total_volume: number, categories: string[], types: string[] }
  }>({
    data: [],
    total: 0,
    totalPages: 0,
    page: 1,
    distribution: [],
    stats: { total_volume: 0, categories: [], types: [] }
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async (page: number, searchTerm: string, type: string, category: string, range: string, start: string, end: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/transactions?page=${page}&limit=20&search=${searchTerm}&type=${type}&category=${category}&range=${range}&startDate=${start}&endDate=${end}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Debounced fetch for filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(currentPage, search, typeFilter, categoryFilter, timeRange, startDate, endDate);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentPage, search, typeFilter, categoryFilter, timeRange, startDate, endDate, fetchData]);

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(currentPage, search, typeFilter, categoryFilter, timeRange, startDate, endDate, true);
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [currentPage, search, typeFilter, categoryFilter, timeRange, startDate, endDate, fetchData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Transaction Ledger</h1>
          <p className="text-muted-foreground mt-2 text-md flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Monitoring {data.total.toLocaleString()} global transactions in real-time.
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
          onStartDateChange={(val) => { setStartDate(val); setCurrentPage(1); }}
          onEndDateChange={(val) => { setEndDate(val); setCurrentPage(1); }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search ID, Name, Category..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          

          <div className="flex items-center gap-2">
            <select 
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:border-primary/30 transition-colors"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Types</option>
              {data.stats.types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select 
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:border-primary/30 transition-colors"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Categories</option>
              {data.stats.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
      </div>

      {/* KPI Grid Removed as per user request */}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="animate-spin text-primary flex flex-col items-center gap-2">
              <Activity size={32} />
              <span className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground">Streaming Ledger...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-left">
                <tr className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Tx ID</th>
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
                {data.data.map((tx) => (
                <tr key={tx._id} className="hover:bg-accent/40 transition-colors group">
                    <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                            tx.type === 'P2P' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                            {tx.type === 'P2P' ? <UsersIcon size={14} /> : <ShoppingBag size={14} />}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={12} className="opacity-50" />
                            <span className="text-[11px] font-bold tabular-nums uppercase">{formatRelativeTime(tx.ts)}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground">
                       <span className="bg-muted border border-border/50 px-2 py-1 rounded inline-flex items-center gap-1.5 group-hover:text-primary transition-colors">
                            {tx.transactionId.substring(0, 8)}...
                            <Info size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                        <Link href={`/users/${tx.sourceId}`} className="hover:text-primary transition-colors">
                            {tx.sourceName}
                        </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground/80">
                        {tx.type === 'MERCHANT' ? (
                            <Link href={`/entities/${tx.targetId}`} className="hover:text-primary transition-colors underline decoration-primary/30 decoration-2 underline-offset-4">
                                {tx.targetName}
                            </Link>
                        ) : tx.targetName}
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md w-fit border shadow-sm ${
                           tx.category === 'Shopping' ? 'bg-pink-500/5 text-pink-500 border-pink-500/20' :
                           tx.category === 'Food & Drink' ? 'bg-orange-500/5 text-orange-500 border-orange-500/20' :
                           tx.category === 'Transport' ? 'bg-blue-500/5 text-blue-500 border-blue-500/20' :
                           tx.category === 'Entertainment' ? 'bg-purple-500/5 text-purple-500 border-purple-500/20' :
                           'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'
                        }`}>
                            {getIcon(tx.category)}
                            <span className="text-[10px] font-black uppercase tracking-wider">{tx.category || 'Transfer'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono font-black text-foreground text-md tracking-tighter tabular-nums">
                              {formatCurrency(tx.amount, tx.currency)}
                          </span>
                          {tx.amount > 5000 && (
                            <span className="flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                              <TrendingUp size={8} /> High Value
                            </span>
                          )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 size={16} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Settled</span>
                        </div>
                    </td>
                </tr>
                ))}
                {data.data.length === 0 && !loading && (
                    <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <Search size={48} className="text-muted-foreground/20" />
                                <p className="text-muted-foreground font-medium italic">No ledger entries found matching your criteria.</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">
          Record <span className="text-primary">{(currentPage - 1) * 20 + 1}</span> — <span className="text-primary">{Math.min(currentPage * 20, data.total)}</span> 
          <span className="mx-2 text-border">|</span> 
          Global Total: <span className="text-foreground">{data.total.toLocaleString()}</span>
        </p>
        <Pagination 
          currentPage={currentPage}
          totalPages={data.totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
