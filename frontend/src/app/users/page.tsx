'use client';

import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { Column, DataTable } from '@/components/DataTable';
import { KPICard } from '@/components/KPICard';
import { Tabs, TabsContent } from '@/components/Tabs';
import TimeFilter from '@/components/TimeFilter';
import UserActivityTrend from '@/components/users/UserActivityTrend';
import UserLeaderboard from '@/components/users/UserLeaderboard';
import UserSegmentChart from '@/components/users/UserSegmentChart';

import { POLLING_INTERVAL } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, DollarSign, Minus, Search, TrendingUp, Users, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface UserRow {
  id: string;
  name: string;
  total_spent: number;
  total_received: number;
  tx_count: number;
}

const SORT_OPTIONS = [
  { value: 'tx_count_desc', label: 'Most Transactions' },
  { value: 'tx_count_asc', label: 'Least Transactions' },
  { value: 'total_spent_desc', label: 'Highest Spent' },
  { value: 'total_received_desc', label: 'Highest Received' },
  { value: 'net_desc', label: 'Highest Net Flow' },
  { value: 'net_asc', label: 'Lowest Net Flow' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'whale', label: 'Whale (50+)' },
  { value: 'heavy', label: 'Heavy (20-49)' },
  { value: 'medium', label: 'Medium (5-19)' },
  { value: 'light', label: 'Light (1-4)' },
];

function getUserTier(txCount: number) {
  if (txCount >= 50) return 'whale';
  if (txCount >= 20) return 'heavy';
  if (txCount >= 5) return 'medium';
  return 'light';
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace, push } = useRouter();

  const activeTab = searchParams.get('tab') || 'overview';
  const [timeRange, setTimeRange] = useState('24h');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Directory filters
  const [dirSearch, setDirSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('tx_count_desc');
  const [tierFilter, setTierFilter] = useState('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(dirSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [dirSearch]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData(isPolling = false) {
      if (!isPolling) setLoading(true);
      try {
        const res = await fetch(
          `/api/users?range=${timeRange}&startDate=${startDate}&endDate=${endDate}&page=1&limit=5000`
        );
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    const interval = setInterval(() => {
      fetchData(true);
    }, POLLING_INTERVAL.MEDIUM);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [timeRange, startDate, endDate]);

  const handleUserClick = (userId: string) => {
    push(`/users/${userId}`);
  };

  // Client-side filtered + sorted data for directory
  const filteredUsers = useMemo(() => {
    let users: UserRow[] = data?.data || [];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      users = users.filter(u => u.id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    }

    // Tier filter
    if (tierFilter !== 'all') {
      users = users.filter(u => getUserTier(u.tx_count) === tierFilter);
    }

    // Sort
    const sorted = [...users];
    switch (sortBy) {
      case 'tx_count_desc': sorted.sort((a, b) => b.tx_count - a.tx_count); break;
      case 'tx_count_asc': sorted.sort((a, b) => a.tx_count - b.tx_count); break;
      case 'total_spent_desc': sorted.sort((a, b) => b.total_spent - a.total_spent); break;
      case 'total_received_desc': sorted.sort((a, b) => b.total_received - a.total_received); break;
      case 'net_desc': sorted.sort((a, b) => (b.total_received - b.total_spent) - (a.total_received - a.total_spent)); break;
      case 'net_asc': sorted.sort((a, b) => (a.total_received - a.total_spent) - (b.total_received - b.total_spent)); break;
    }

    return sorted;
  }, [data?.data, debouncedSearch, tierFilter, sortBy]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page, limit]);

  const hasActiveFilters = debouncedSearch || tierFilter !== 'all' || sortBy !== 'tx_count_desc';

  const columns: Column<UserRow>[] = useMemo(() => [
    {
      key: 'name',
      header: 'User',
      cell: (row) => {
        const tier = getUserTier(row.tx_count);
        const tierColors: Record<string, string> = {
          whale: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
          heavy: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          medium: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          light: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        };
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {row.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{row.name}</p>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${tierColors[tier]}`}>
                  {tier}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{row.id}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'tx_count',
      header: 'Transactions',
      className: 'text-right',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-foreground">{row.tx_count.toLocaleString()}</span>
      ),
    },
    {
      key: 'total_spent',
      header: 'Total Spent',
      className: 'text-right',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-rose-500">{formatCurrency(row.total_spent)}</span>
      ),
    },
    {
      key: 'total_received',
      header: 'Total Received',
      className: 'text-right',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-emerald-500">{formatCurrency(row.total_received)}</span>
      ),
    },
    {
      key: 'net_flow',
      header: 'Net Flow',
      className: 'text-right',
      cell: (row) => {
        const net = row.total_received - row.total_spent;
        const isPositive = net >= 0;
        return (
          <div className="flex items-center justify-end gap-1">
            {isPositive ? (
              <ArrowUpRight size={12} className="text-emerald-500" />
            ) : (
              <ArrowDownLeft size={12} className="text-rose-500" />
            )}
            <span className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(Math.abs(net))}
            </span>
          </div>
        );
      },
    },
  ], []);

  if (loading && !data) return <DashboardSkeleton />;

  const global = data?.global || {};
  const netFlow = (global.total_received || 0) - (global.total_spent || 0);
  const avgTxPerUser = data?.total > 0 ? Math.round(global.total_txs / data.total) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Users</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 shadow-sm self-start md:self-center">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-tight">
              <span className="text-muted-foreground/60 uppercase">Users:</span>
              <span className="text-emerald-600 font-mono">{data?.total?.toLocaleString() || '...'}</span>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-md">
          Analyze user behavior, spending patterns, and engagement metrics.
        </p>
      </div>

      {/* Sticky Controls */}
      <div className="sticky top-0 z-30 bg-background -mx-4 px-4 md:-mx-8 md:px-8 py-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <Tabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            const params = new URLSearchParams(searchParams);
            params.set('tab', tab);
            replace(`${pathname}?${params.toString()}`);
          }}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'directory', label: 'Directory' },
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

      {/* Overview Tab */}
      <TabsContent value="overview" activeTab={activeTab}>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <KPICard
            title="Total Users"
            value={data?.total || 0}
            format="number"
            icon={Users}
            color="blue"
          />
          <KPICard
            title="Total Spent"
            value={global.total_spent || 0}
            format="currency"
            icon={ArrowUpRight}
            color="rose"
          />
          <KPICard
            title="Total Received"
            value={global.total_received || 0}
            format="currency"
            icon={ArrowDownLeft}
            color="emerald"
          />
          <KPICard
            title="Avg Tx / User"
            value={avgTxPerUser}
            format="number"
            icon={TrendingUp}
            color="indigo"
          />
          <KPICard
            title="Top Spender"
            value={global.total_spent || 0}
            format="currency"
            icon={DollarSign}
            color="amber"
            trend={{ value: global.top_spender || 'N/A', direction: 'neutral' }}
          />
          <KPICard
            title="Net Flow"
            value={Math.abs(netFlow)}
            format="currency"
            icon={netFlow >= 0 ? ArrowUpRight : Minus}
            color={netFlow >= 0 ? 'cyan' : 'orange'}
            trend={{ value: netFlow >= 0 ? 'Positive' : 'Negative', direction: netFlow >= 0 ? 'up' : 'down' }}
          />
        </div>

        {/* Charts Row 1: Activity Trend + Segment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 h-[400px]">
            <UserActivityTrend data={data?.trend || []} />
          </div>
          <div className="lg:col-span-1">
            <UserSegmentChart users={data?.data || []} />
          </div>
        </div>

        {/* Charts Row 2: Leaderboard */}
        <div className="mb-6">
          <UserLeaderboard
            rankings={data?.rankings || { top_by_volume: [], top_by_count: [], top_by_revenue: [] }}
            onUserClick={handleUserClick}
          />
        </div>
      </TabsContent>

      {/* Directory Tab */}
      <TabsContent value="directory" activeTab={activeTab}>
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64 group grow sm:grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search by user ID..." 
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>

            {/* Tier Filter */}
            <select 
              value={tierFilter} 
              onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0 sm:ml-auto"
            >
              {TIER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select 
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Result count + Clear */}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {filteredUsers.length.toLocaleString()} results
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={() => { setDirSearch(''); setTierFilter('all'); setSortBy('tx_count_desc'); }}
                  className="h-9 w-9 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                  title="Clear Filters"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <DataTable<UserRow>
            columns={columns}
            data={paginatedUsers}
            loading={loading}
            onRowClick={(row) => handleUserClick(row.id)}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(filteredUsers.length / limit),
              totalItems: filteredUsers.length,
              itemsPerPage: limit,
              onPageChange: setPage,
            }}
          />
        </div>
      </TabsContent>
    </div>
  );
}

