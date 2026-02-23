'use client';

import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { Column, DataTable } from '@/components/DataTable';
import { KPICard } from '@/components/KPICard';
import MerchantActivityTrend from '@/components/merchants/MerchantActivityTrend';
import MerchantCategoryChart from '@/components/merchants/MerchantCategoryChart';
import MerchantLeaderboard from '@/components/merchants/MerchantLeaderboard';
import { Tabs, TabsContent } from '@/components/Tabs';
import TimeFilter from '@/components/TimeFilter';

import { POLLING_INTERVAL } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Layers, Search, Store, TrendingUp, X, Zap } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface MerchantRow {
  id: string;
  name: string;
  category: string;
  mcc_code: string;
  total_revenue: number;
  avg_sale: number;
  tx_count: number;
}

const SORT_OPTIONS = [
  { value: 'tx_count_desc', label: 'Most Transactions' },
  { value: 'tx_count_asc', label: 'Least Transactions' },
  { value: 'revenue_desc', label: 'Highest Revenue' },
  { value: 'revenue_asc', label: 'Lowest Revenue' },
  { value: 'avg_desc', label: 'Highest Avg Sale' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'FOOD', label: 'Food' },
  { value: 'GROCERY', label: 'Grocery' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'TELECOM', label: 'Telecom' },
  { value: 'FUEL', label: 'Fuel' },
];

export default function MerchantsPage() {
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
  const [sortBy, setSortBy] = useState('revenue_desc');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
          `/api/merchants?range=${timeRange}&startDate=${startDate}&endDate=${endDate}&page=1&limit=5000`
        );
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (error) {
        console.error('Failed to fetch merchants:', error);
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

  const handleMerchantClick = (merchantId: string) => {
    push(`/merchants/${merchantId}`);
  };

  // Client-side filtered + sorted data for directory
  const filteredMerchants = useMemo(() => {
    let merchants: MerchantRow[] = data?.data || [];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      merchants = merchants.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }

    // Category filter
    if (categoryFilter !== 'all') {
      merchants = merchants.filter(m => m.category === categoryFilter);
    }

    // Sort
    const sorted = [...merchants];
    switch (sortBy) {
      case 'tx_count_desc': sorted.sort((a, b) => b.tx_count - a.tx_count); break;
      case 'tx_count_asc': sorted.sort((a, b) => a.tx_count - b.tx_count); break;
      case 'revenue_desc': sorted.sort((a, b) => b.total_revenue - a.total_revenue); break;
      case 'revenue_asc': sorted.sort((a, b) => a.total_revenue - b.total_revenue); break;
      case 'avg_desc': sorted.sort((a, b) => b.avg_sale - a.avg_sale); break;
    }

    return sorted;
  }, [data?.data, debouncedSearch, categoryFilter, sortBy]);

  const paginatedMerchants = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredMerchants.slice(start, start + limit);
  }, [filteredMerchants, page, limit]);

  const hasActiveFilters = debouncedSearch || categoryFilter !== 'all' || sortBy !== 'revenue_desc';

  const columns: Column<MerchantRow>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Merchant',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Store size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{row.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{row.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => (
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
          {row.category}
        </span>
      ),
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
      key: 'total_revenue',
      header: 'Revenue',
      className: 'text-right',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-emerald-500">{formatCurrency(row.total_revenue)}</span>
      ),
    },
    {
      key: 'avg_sale',
      header: 'Avg Sale',
      className: 'text-right',
      cell: (row) => (
        <span className="font-mono font-bold text-sm text-muted-foreground">{formatCurrency(row.avg_sale)}</span>
      ),
    },
  ], []);

  if (loading && !data) return <DashboardSkeleton />;

  const global = data?.global || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Merchants</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 shadow-sm self-start md:self-center">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-tight">
              <span className="text-muted-foreground/60 uppercase">Merchants:</span>
              <span className="text-emerald-600 font-mono">{data?.total?.toLocaleString() || '...'}</span>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-md">
          Analyze merchant performance, category distribution, and revenue metrics.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <KPICard
            title="Total Merchants"
            value={data?.total || 0}
            format="number"
            icon={Store}
            color="blue"
          />
          <KPICard
            title="Total Revenue"
            value={global.total_revenue || 0}
            format="currency"
            icon={DollarSign}
            color="emerald"
          />
          <KPICard
            title="Avg Sale"
            value={global.avg_sale || 0}
            format="currency"
            icon={Zap}
            color="indigo"
          />
          <KPICard
            title="Categories"
            value={global.category_count || 0}
            format="number"
            icon={Layers}
            color="purple"
          />
          <KPICard
            title="Top Merchant"
            value={global.total_revenue || 0}
            format="currency"
            icon={TrendingUp}
            color="amber"
            trend={{ value: global.top_merchant || 'N/A', direction: 'neutral' }}
          />
        </div>

        {/* Charts Row 1: Activity Trend + Category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 h-[400px]">
            <MerchantActivityTrend data={data?.trend || []} />
          </div>
          <div className="lg:col-span-1">
            <MerchantCategoryChart data={data?.category_breakdown || []} />
          </div>
        </div>

        {/* Charts Row 2: Leaderboard */}
        <div className="mb-6">
          <MerchantLeaderboard
            rankings={data?.rankings || { top_by_volume: [], top_by_count: [] }}
            onMerchantClick={handleMerchantClick}
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
                placeholder="Search by merchant ID or category..."
                value={dirSearch}
                onChange={(e) => setDirSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-9 px-3 rounded-md bg-card border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm grow sm:grow-0 sm:ml-auto"
            >
              {CATEGORY_OPTIONS.map(opt => (
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
                {filteredMerchants.length.toLocaleString()} results
              </span>
              {hasActiveFilters && (
                <button
                  onClick={() => { setDirSearch(''); setCategoryFilter('all'); setSortBy('revenue_desc'); }}
                  className="h-9 w-9 flex items-center justify-center rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
                  title="Clear Filters"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <DataTable<MerchantRow>
            columns={columns}
            data={paginatedMerchants}
            loading={loading}
            onRowClick={(row) => handleMerchantClick(row.id)}
            pagination={{
              currentPage: page,
              totalPages: Math.ceil(filteredMerchants.length / limit),
              totalItems: filteredMerchants.length,
              itemsPerPage: limit,
              onPageChange: setPage,
            }}
          />
        </div>
      </TabsContent>
    </div>
  );
}
