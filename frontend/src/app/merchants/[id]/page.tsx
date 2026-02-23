'use client';

import ChartCard from '@/components/ChartCard';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { KPICard } from '@/components/KPICard';
import { Tabs, TabsContent } from '@/components/Tabs';
import TimeFilter from '@/components/TimeFilter';
import { TransactionLedger } from '@/components/transactions/TransactionLedger';
import { formatCompactCurrency, formatCurrency } from '@/lib/utils';

import {
    Activity,
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
    ChevronRight,
    DollarSign,
    Percent, Store, TrendingUp, Users,
    Zap
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const CATEGORY_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#a855f7', '#22d3ee', '#84cc16', '#fb923c', '#f43f5e'];

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#10b981',
  FAILED: '#ef4444',
  PENDING: '#f59e0b',
  REVERSED: '#8b5cf6',
};

const CHANNEL_COLORS: Record<string, string> = {
  Mobile: '#3b82f6',
  Web: '#8b5cf6',
  POS: '#f59e0b',
  API: '#10b981',
};

// --- Custom Tooltips ---
const SpendTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">
          {new Date(label).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-muted-foreground capitalize">{p.dataKey}:</span>
            <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-sm font-bold text-foreground mb-1">{d.name}</p>
        <p className="text-xs font-mono text-muted-foreground">{formatCurrency(d.value)}</p>
        {d.count != null && <p className="text-[10px] text-muted-foreground">{d.count.toLocaleString()} txns</p>}
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl">
        <p className="text-xs font-bold text-foreground mb-1">{label}</p>
        <p className="text-xs font-mono text-blue-500">{formatCurrency(payload[0].value)}</p>
        {payload[0].payload.count != null && (
          <p className="text-[10px] text-muted-foreground">{payload[0].payload.count.toLocaleString()} txns</p>
        )}
      </div>
    );
  }
  return null;
};


export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantId = params.id as string;
  const activeTab = searchParams.get('tab') || 'overview';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3M');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/merchants/${merchantId}?range=${timeRange}&startDate=${startDate}&endDate=${endDate}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch merchant:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [merchantId, timeRange, startDate, endDate]);

  if (loading && !data) return <DashboardSkeleton />;

  if (!data || data.error) {
    return (
      <div className="max-w-7xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-lg text-muted-foreground">Merchant not found</p>
        <button onClick={() => router.push('/merchants')} className="text-primary hover:underline text-sm font-semibold">
          ← Back to Merchants
        </button>
      </div>
    );
  }

  const s = data.summary || {};
  const charts = data.charts || {};
  const revenueData = charts.revenue_over_time || [];
  const tranTypeData = charts.by_tran_type || [];
  const paymentMethodData = charts.by_payment_method || [];
  const channelData = charts.by_channel || [];
  const statusData = charts.by_status || [];
  const topCustomers = charts.top_customers || [];
  const transactions = data.transactions || [];
  const isNetPositive = (s.net_flow || 0) >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4 md:p-8">
      {/* Back + Profile */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/merchants')}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm group"
            title="Back to Merchants"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/merchants')}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Merchants
            </button>
            <ChevronRight size={14} className="text-muted-foreground/30" />
            <span className="text-foreground font-semibold">Merchant Details</span>
            <ChevronRight size={14} className="text-muted-foreground/30" />
            <span className="text-muted-foreground font-mono text-xs bg-muted/50 px-2 py-0.5 rounded border border-border/50">{merchantId}</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
              <Store size={24} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{data.name || 'Unknown Merchant'}</h1>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {data.category || 'Unknown'}
                </span>
                {data.mcc_code && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                    MCC: {data.mcc_code}
                  </span>
                )}
                {s.currencies?.length > 0 && (
                  <div className="flex gap-1">
                    {s.currencies.map((c: string) => (
                      <span key={c} className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{data.id}</p>
            </div>
            <div className="hidden md:flex items-center gap-6 text-right">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Success Rate</p>
                <p className="text-lg font-bold text-emerald-500 font-mono">{s.success_rate?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Customers</p>
                <p className="text-lg font-bold text-foreground font-mono">{s.unique_customers?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Txns</p>
                <p className="text-lg font-bold text-foreground font-mono">{s.tx_count?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + TimeFilter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', tab);
            router.replace(`?${params.toString()}`, { scroll: false });
          }}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'breakdown', label: 'Breakdown' },
            { id: 'customers', label: 'Customers' },
            { id: 'transactions', label: 'Transactions' },
          ]}
        />
        <TimeFilter
          value={timeRange}
          onChange={setTimeRange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      <TabsContent value="overview" activeTab={activeTab}>
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard title="Total Volume" value={s.total_volume || 0} format="currency" icon={DollarSign} color="blue" />
            <KPICard title="Credit (In)" value={s.total_credit || 0} format="currency" icon={ArrowDownLeft} color="emerald"
              trend={{ value: `${s.credit_count?.toLocaleString()} txns`, direction: 'up' }} />
            <KPICard title="Debit (Out)" value={s.total_debit || 0} format="currency" icon={ArrowUpRight} color="rose"
              trend={{ value: `${s.debit_count?.toLocaleString()} txns`, direction: 'down' }} />
            <KPICard title="Net Flow" value={Math.abs(s.net_flow || 0)} format="currency" icon={isNetPositive ? TrendingUp : Activity} color={isNetPositive ? 'cyan' : 'orange'}
              trend={{ value: isNetPositive ? 'Net Positive' : 'Net Negative', direction: isNetPositive ? 'up' : 'down' }} />
            <KPICard title="Avg Transaction" value={s.avg_amount || 0} format="currency" icon={Zap} color="indigo" />
            <KPICard title="Success Rate" value={s.success_rate || 0} format="percent" icon={Percent} color="emerald" />
          </div>

          {/* Volume Over Time */}
          <div className="h-[380px]">
            <ChartCard className="h-full" title="Revenue Over Time" description="Credit vs debit volume">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mCreditGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mDebitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                      tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                      tickFormatter={(v) => formatCompactCurrency(v)} width={60} />
                    <Tooltip content={<SpendTooltip />} />
                    <Area type="monotone" dataKey="credit" stroke="#10b981" strokeWidth={2} fill="url(#mCreditGrad)" dot={false} />
                    <Area type="monotone" dataKey="debit" stroke="#ef4444" strokeWidth={1.5} fill="url(#mDebitGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
              )}
            </ChartCard>
          </div>
        </div>
      </TabsContent>

      {/* ========== BREAKDOWN TAB ========== */}
      <TabsContent value="breakdown" activeTab={activeTab}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Transaction Types - Horizontal Bar */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col h-[360px]">
              <div className="mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Transaction Types</h3>
                <p className="text-xs text-muted-foreground">P2P, P2M, M2P, B2B, SELF</p>
              </div>
              {tranTypeData.length > 0 ? (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tranTypeData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickFormatter={(v) => formatCompactCurrency(v)} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }} width={40} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col h-[360px]">
              <div className="mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Payment Methods</h3>
                <p className="text-xs text-muted-foreground">QR, IBFT, Wallet, Card, Bank</p>
              </div>
              {paymentMethodData.length > 0 ? (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethodData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 9, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickFormatter={(v) => formatCompactCurrency(v)} width={50} />
                      <Tooltip content={<BarTooltip />} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28}>
                        {paymentMethodData.map((_: any, i: number) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>

            {/* Status Distribution - Donut */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col h-[360px]">
              <div className="mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Status Distribution</h3>
                <p className="text-xs text-muted-foreground">Success, Failed, Pending, Reversed</p>
              </div>
              {statusData.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" dataKey="count" strokeWidth={2} stroke="var(--card)">
                          {statusData.map((st: any) => (
                            <Cell key={st.name} fill={STATUS_COLORS[st.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {statusData.map((st: any) => (
                      <div key={st.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[st.name] || '#94a3b8' }} />
                        <span className="text-[9px] font-bold text-muted-foreground">{st.name}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/60">{st.count?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ========== CUSTOMERS TAB ========== */}
      <TabsContent value="customers" activeTab={activeTab}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel Distribution */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col h-[360px]">
              <div className="mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Channel Distribution</h3>
                <p className="text-xs text-muted-foreground">How transactions are initiated</p>
              </div>
              {channelData.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelData} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" dataKey="count" strokeWidth={2} stroke="var(--card)">
                          {channelData.map((c: any) => (
                            <Cell key={c.name} fill={CHANNEL_COLORS[c.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {channelData.map((c: any) => (
                      <div key={c.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[c.name] || '#94a3b8' }} />
                        <span className="text-[9px] font-bold text-muted-foreground">{c.name}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/60">{c.count?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>

            {/* Top Customers */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col h-[360px]">
              <div className="mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Top Customers</h3>
                <p className="text-xs text-muted-foreground">By transaction volume</p>
              </div>
              {topCustomers.length > 0 ? (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {topCustomers.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30 cursor-pointer"
                      onClick={() => router.push(`/users/${c.id}`)}>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users size={12} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{c.id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-mono text-foreground">{formatCompactCurrency(c.volume)}</p>
                        <p className="text-[9px] text-muted-foreground">{c.count} txns</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ========== TRANSACTIONS TAB ========== */}
      <TabsContent value="transactions" activeTab={activeTab}>
        <TransactionLedger merchantId={merchantId} />
      </TabsContent>
    </div>
  );
}
