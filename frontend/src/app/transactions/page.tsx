'use client';

import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { KPICard } from '@/components/KPICard';
import { Tabs, TabsContent } from '@/components/Tabs';
import TimeFilter from '@/components/TimeFilter';
import { AdvancedTrendChart } from '@/components/transactions/AdvancedTrendChart';
import { CategoryPerformanceList } from '@/components/transactions/CategoryPerformanceList';
import { ChannelDistributionChart } from '@/components/transactions/ChannelDistributionChart';
import { PaymentMethodChart } from '@/components/transactions/PaymentMethodChart';
import { StatusDistributionChart } from '@/components/transactions/StatusDistributionChart';
import { TransactionLedger } from '@/components/transactions/TransactionLedger';

import { POLLING_INTERVAL } from '@/lib/constants';
import { Activity, AlertCircle, ArrowDownLeft, ArrowUpRight, CreditCard, XCircle } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const activeTab = searchParams.get('tab') || 'overview';
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchData(isPolling = false) {
      if (!isPolling) setLoading(true);
      try {
        const res = await fetch(`/api/transactions/analytics?range=${timeRange}`);
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData(); // Initial fetch

    const interval = setInterval(() => {
        fetchData(true);
    }, POLLING_INTERVAL.MEDIUM);

    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [timeRange]);

  if (loading && !data) return <DashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4 md:p-8">
      
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Transactions</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 shadow-sm self-start md:self-center">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold tracking-tight">
              <span className="text-muted-foreground/60 uppercase">Data:</span>
              <span className="text-emerald-600 font-mono">
                {data?.last_event_ts ? new Date(data.last_event_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...'}
              </span>
              <span className="mx-1 text-border">|</span>
              <span className="text-muted-foreground/60 uppercase">Sync:</span>
              <span className="text-muted-foreground/40 font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-md">
          Monitor transaction volumes, success rates, and payment rails.
        </p>
      </div>

      <div className="sticky top-0 z-30 bg-background -mx-4 px-4 md:-mx-8 md:px-8 py-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <Tabs 
            activeTab={activeTab} 
            onTabChange={(term) => {
              const params = new URLSearchParams(searchParams);
              params.set('tab', term);
              replace(`${pathname}?${params.toString()}`);
            }}
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'ledger', label: 'Ledger' },
            ]} 
          />
          <TimeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <TabsContent value="overview" activeTab={activeTab}>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
             <KPICard 
                title="Total Volume" 
                value={data?.summary?.total_volume || 0} 
                format="currency" 
                icon={CreditCard} 
                color="blue"
                trend={{ value: "+12.5%", label: "VS PERIOD", direction: 'up' }}
             />
             <KPICard 
                title="Total Count" 
                value={data?.summary?.total_count || 0} 
                format="number" 
                icon={ArrowUpRight} 
                color="emerald"
                trend={{ value: "+5.2%", label: "VS PERIOD", direction: 'up' }}
             />
             <KPICard 
                title="Success Rate" 
                value={data?.summary?.success_rate || 0} 
                format="percent" 
                icon={AlertCircle} 
                color="emerald"
                trend={{ value: "-0.1%", label: "VS PERIOD", direction: 'down' }}
             />
             <KPICard 
                title="Avg Ticket" 
                value={data?.summary?.avg_ticket_size || 0} 
                format="currency" 
                icon={ArrowDownLeft} 
                color="indigo"
                trend={{ value: "+2.4%", label: "VS PERIOD", direction: 'up' }}
             />
             <KPICard 
                title="Failed Volume" 
                value={data?.summary?.failed_volume || 0} 
                format="currency" 
                icon={XCircle} 
                color="rose"
                trend={{ value: "+1.2%", label: "VS PERIOD", direction: 'up' }}
             />
             <KPICard 
                title="Peak TPS" 
                value={data?.summary?.peak_tps || 0} 
                format="number" 
                icon={Activity} 
                color="purple"
                trend={{ value: "+8.5%", label: "VS PERIOD", direction: 'up' }}
             />
          </div>

          {/* Charts Row 1: Volume & Channel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                  <AdvancedTrendChart data={data?.trend} />
              </div>
              <div className="lg:col-span-1">
                  <ChannelDistributionChart data={data?.channel_distribution} />
              </div>
          </div>

          {/* Charts Row 2: Categories, Methods, Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
               <CategoryPerformanceList data={data?.category_performance} />
               <PaymentMethodChart data={data?.payment_methods} />
               <StatusDistributionChart data={data?.status_distribution} />
          </div>

          {/* Charts Row 3: Failures */}
          <div className="grid grid-cols-1 gap-6">
               <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground tracking-tight">Top Failure Reasons</h3>
                      <button className="text-xs text-primary font-medium hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {data?.failure_reasons.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-500" />
                                {item.reason}
                              </span>
                              <span className="text-sm text-muted-foreground">{item.count} errors</span>
                          </div>
                      ))}
                  </div>
               </div>
          </div>
      </TabsContent>

      <TabsContent value="ledger" activeTab={activeTab}>
         <div className="bg-card/50 border border-border/50 rounded-xl p-6">
             <TransactionLedger />
         </div>
      </TabsContent>
    </div>
  );
}
