"use client";

import { Column, DataTable } from "@/components/DataTable";
import { POLLING_INTERVAL } from "@/lib/constants";
import {
  CHANNELS,
  FLOW_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES
} from "@/lib/transaction-options";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, Check, Clock, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Types matching API response
interface Transaction {
  _id: string;
  tran_id: string;
  user_id: string;
  merchant_id: string;
  merchant_category: string;
  amount: number;
  currency: string;
  tran_status: string;
  tran_type: string;
  payment_method: string;
  channel: string;
  ts: string;
  is_credit?: boolean;
  details?: any;
}

export function TransactionLedger() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [flow, setFlow] = useState("all");
  const [channel, setChannel] = useState("all");
  const [method, setMethod] = useState("all");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Data
  useEffect(() => {
    let isMounted = true;
    async function fetchData(isPolling = false) {
      if (!isPolling) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: debouncedSearch,
          range: 'all'
        });

        if (status && status !== 'all') params.set('status', status);
        if (type && type !== 'all') params.set('type', type);
        if (flow && flow !== 'all') params.set('flow', flow);
        if (channel && channel !== 'all') params.set('channel', channel);
        if (method && method !== 'all') params.set('method', method);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        const json = await res.json();
        
        if (isMounted) {
            setData(json.data || []);
            setTotal(json.total || 0);
        }
      } catch (err) {
        console.error("Failed to fetch ledger:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData(); // Initial fetch

    // Auto-refresh interval
    const interval = setInterval(() => {
        fetchData(true);
    }, POLLING_INTERVAL.FAST);

    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [page, limit, debouncedSearch, status, type, flow, channel, method]);

  const columns: Column<Transaction>[] = useMemo(() => [
    {
      key: "tran_id",
      header: "Transaction",
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] font-bold text-foreground">{row.tran_id}</span>
          <span className="text-[10px] text-muted-foreground">
             {new Date(row.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        </div>
      ),
    },
    {
        key: "user",
        header: "Participants",
        cell: (row) => (
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                <span className="font-medium truncate max-w-[120px]" title={row.user_id}>{row.user_id}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <ArrowUpRight size={10} className="ml-0.5" />
                <span className="truncate max-w-[120px]" title={row.merchant_id || 'System'}>{row.merchant_id || 'System'}</span>
            </div>
          </div>
        )
    },
    {
      key: "type",
      header: "Payment Details",
      cell: (row) => (
        <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
                <span className="font-medium text-[10px] uppercase tracking-tight">{row.tran_type}</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{row.payment_method}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase">
                 <span className="bg-muted px-1 rounded">{row.channel}</span>
                 <span>{row.merchant_category}</span>
            </div>
        </div>
      )
    },
    {
        key: "amount",
        header: "Amount / Flow",
        cell: (row) => (
          <div className="flex flex-col items-start">
            <span className={`font-bold text-sm tracking-tight ${row.is_credit ? 'text-emerald-600' : ''}`}>
                {row.is_credit ? '+' : ''}{formatCurrency(row.amount, row.currency)}
            </span>
            <span className={`text-[9px] font-bold uppercase ${row.is_credit ? 'text-emerald-600/70' : 'text-muted-foreground'}`}>
                {row.is_credit ? 'Credit' : 'Debit'}
            </span>
          </div>
        )
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const isSuccess = row.tran_status === 'SUCCESS';
        const isPending = row.tran_status === 'PENDING';
        
        return (
          <div className="flex justify-start">
              <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide
                ${isSuccess ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : ''}
                ${isPending ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' : ''}
                ${!isSuccess && !isPending ? 'bg-rose-500/5 text-rose-600 border-rose-500/20' : ''}
              `}>
                {isSuccess && <Check size={10} strokeWidth={4} />}
                {isPending && <Clock size={10} strokeWidth={4} />}
                {!isSuccess && !isPending && <X size={10} strokeWidth={4} />}
                {row.tran_status}
              </span>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:w-64 group grow sm:grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
            <input 
                type="text" 
                placeholder="Search ledger..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
        </div>

        <select 
            value={status} 
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0 sm:ml-auto"
        >
            <option value="all">All Status</option>
            {TRANSACTION_STATUSES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>

        <select 
            value={type} 
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0"
        >
            <option value="all">All Types</option>
            {TRANSACTION_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>

        <select 
            value={flow} 
            onChange={(e) => { setFlow(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0"
        >
            <option value="all">All Flows</option>
            {FLOW_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>

        <select 
            value={channel} 
            onChange={(e) => { setChannel(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0"
        >
            <option value="all">All Channels</option>
            {CHANNELS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>

        <select 
            value={method} 
            onChange={(e) => { setMethod(e.target.value); setPage(1); }}
            className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0"
        >
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>

        {(status !== 'all' || type !== 'all' || flow !== 'all' || channel !== 'all' || method !== 'all' || search) && (
            <button 
                onClick={() => { setStatus('all'); setType('all'); setFlow('all'); setChannel('all'); setMethod('all'); setSearch(''); }}
                className="h-9 w-9 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors ml-auto sm:ml-0"
                title="Clear Filters"
            >
                <X size={14} />
            </button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        loading={loading}
        pagination={{
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            onPageChange: setPage
        }}
      />
    </div>
  );
}
