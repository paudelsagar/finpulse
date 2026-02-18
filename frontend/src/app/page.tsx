'use client';

import AccountHubs from '@/components/AccountHubs';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import AmountDistribution from '@/components/AmountDistribution';
import ChannelReliability from '@/components/ChannelReliability';
import CorrectionTracker from '@/components/CorrectionTracker';
import CreditDebitSplit from '@/components/CreditDebitSplit';
import CurrencyMix from '@/components/CurrencyMix';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import DAUMomentum from '@/components/DAUMomentum';
import HighValueAlerts from '@/components/HighValueAlerts';
import IntentCloud from '@/components/IntentCloud';
import LiquidityPulse from '@/components/LiquidityPulse';
import MCCDistribution from '@/components/MCCDistribution';
import MCCHotZones from '@/components/MCCHotZones';
import MerchantIntegrity from '@/components/MerchantIntegrity';
import NetworkConnectivity from '@/components/NetworkConnectivity';
import NetworkStickiness from '@/components/NetworkStickiness';
import RailReliability from '@/components/RailReliability';
import RecipientRanking from '@/components/RecipientRanking';
import RevenueLeakage from '@/components/RevenueLeakage';
import StatusDonut from '@/components/StatusDonut';
import { TabEmptyState } from '@/components/TabEmptyState';
import { Tabs, TabsContent } from '@/components/Tabs';
import TimeFilter from '@/components/TimeFilter';
import TopEntitiesChart from "@/components/TopEntitiesChart";
import TransactionList from '@/components/TransactionList';
import VolumeChart from '@/components/VolumeChart';
import { POLLING_INTERVAL } from '@/lib/constants';
import { formatRichCurrency, formatRichNumber } from '@/lib/utils';
import { Activity, BadgeDollarSign, BarChart4, CreditCard, Network, ShieldAlert, TrendingUp, Users, Users2, Zap } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  
  const [timeRange, setTimeRange] = useState('1h');
  const activeTab = searchParams.get('tab') || 'overview';
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch(`/api/stats?range=${timeRange}&startDate=${startDate}&endDate=${endDate}&tab=${activeTab}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false); // Initial fetch or params change
    const interval = setInterval(() => fetchData(true), POLLING_INTERVAL); 
    return () => clearInterval(interval);
  }, [timeRange, startDate, endDate, activeTab]); // Re-fetch when timeRange, startDate, endDate or activeTab changes

  if (loading && !data) return <DashboardSkeleton />;
  
  // Show skeleton on tab switch to prevent stale data glitches
  if (loading && data) return <DashboardSkeleton />;

  const totalVol = data?.stats?.total_volume?.value || 0;
  
  const volHistory = data?.stats?.volume_over_time?.buckets?.map((b: any) => ({
      key: b.key,
      key_as_string: b.key_as_string,
      value: b.volume?.value || 0,
      count: b.doc_count,
      avg: b.avg_amount?.value || 0,
      failed_count: b.statuses?.buckets?.failed?.doc_count || 0
  })) || [];

  const recentTx = data?.recent || [];
  
  const activityData = data?.stats?.activity_context?.heatmap?.buckets?.map((b: any) => ({
      date: b.key_as_string,
      count: b.doc_count,
      volume: b.volume?.value || 0
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-4 md:p-8">
      
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
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
          Real-time monitoring of global transaction flows and network performance.
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
              { id: 'network', label: 'Network Health' },
              { id: 'financials', label: 'Financials' },
              { id: 'demographics', label: 'Demographics' },
              { id: 'executive', label: 'Executive' },
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


      <TabsContent value="overview" activeTab={activeTab}>
          {volHistory.length === 0 ? (
             <TabEmptyState 
               icon={BarChart4}
               title="No Activity Detected"
               description="There are no transactions in this time range. Try adjusting the filter."
             />
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-2 -top-2 w-20 h-20 bg-blue-500/5 rounded-full flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-500/10 transition-colors">
                    <CreditCard size={32} className="text-blue-500/30" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Volume</p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
                      {formatRichCurrency(totalVol, 'USD', 0).map((part, i) => {
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
                    <div className="flex items-center gap-1 mt-2 text-green-500 text-[10px] font-bold uppercase">
                      <TrendingUp size={12} />
                      <span>+12.5% VS LH</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-2 -top-2 w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center border border-indigo-500/10 group-hover:bg-indigo-500/10 transition-colors">
                    <Zap size={32} className="text-indigo-500/30" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Interactions</p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
                      {formatRichNumber(data?.total_count || 0).map((part, i) => {
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
                    <div className="flex items-center gap-1 mt-2 text-blue-500 text-[10px] font-bold uppercase">
                      <Activity size={12} />
                      <span>Live Feed</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-2 -top-2 w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center border border-emerald-500/10 group-hover:bg-emerald-500/10 transition-colors">
                    <Users size={32} className="text-emerald-500/30" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Users</p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
                      {formatRichNumber(data?.active_users || 0).map((part, i) => {
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
                    <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase">
                      <TrendingUp size={12} />
                      <span>Network Reach</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-2 -top-2 w-20 h-20 bg-orange-500/5 rounded-full flex items-center justify-center border border-orange-500/10 group-hover:bg-orange-500/10 transition-colors">
                    <Activity size={32} className="text-orange-500/30" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Processing Rate</p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
                      {formatRichNumber(data?.tps || 0).map((part, i) => {
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
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase mb-0.5 ml-1 leading-none">TPS</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-blue-500 text-[10px] font-bold uppercase">
                      <Zap size={12} />
                      <span>Live Throughput</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 1: High Level Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
                <div className="lg:col-span-4 flex flex-col gap-8">
                   <VolumeChart data={volHistory} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <HighValueAlerts alerts={data?.alerts || []} />
                </div>
                <div className="lg:col-span-6">
                    <ActivityHeatmap data={activityData} timeRange={timeRange} />
                </div>
                <div className="lg:col-span-6">
                    <TransactionList transactions={recentTx} />
                </div>
              </div>
            </>
          )}
      </TabsContent>

      <TabsContent value="network" activeTab={activeTab}>
        {(!data?.stats?.rail_reliability?.buckets?.length) ? (
             <TabEmptyState 
               icon={Network}
               title="System Dormant"
               description="No network health metrics available for this period."
             />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-2">
                 <RailReliability data={data?.stats?.rail_reliability?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                 <ChannelReliability data={data?.stats?.by_channel?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                  <StatusDonut data={data?.stats?.by_status?.buckets || []} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-2">
                  <NetworkConnectivity data={data?.stats?.by_type?.buckets || []} />
              </div>
              <div className="lg:col-span-4">
                 <CorrectionTracker data={data?.stats?.reversal_stats || { doc_count: 0, total_reverals: { value: 0 } }} />
              </div>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="financials" activeTab={activeTab}>
        {(!data?.stats?.volume_over_time?.buckets?.length) ? (
             <TabEmptyState 
               icon={BadgeDollarSign}
               title="No Financial Data"
               description="No liquidity or revenue flows detected."
             />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-4">
                 <LiquidityPulse data={data?.stats?.volume_over_time?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                 <RevenueLeakage 
                   reversalVolume={data?.stats?.reversal_stats?.aggs?.total_reversals?.value || 0} 
                   totalVolume={data?.stats?.total_volume?.value || 1}
                 />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-2">
                 <CreditDebitSplit data={data?.stats?.volume_over_time?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                 <CurrencyMix data={data?.stats?.by_currency?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                 <AmountDistribution data={data?.stats?.amount_distribution?.buckets || []} />
              </div>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="demographics" activeTab={activeTab}>
        {(!data?.stats?.volume_over_time?.buckets?.length) ? (
             <TabEmptyState 
               icon={Users2}
               title="No Demographic Data"
               description="Insufficient data to map user trends or locations."
             />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-4">
                 <DAUMomentum data={data?.stats?.volume_over_time?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                 <MCCHotZones data={data?.stats?.top_mcc?.buckets || []} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
               <div className="lg:col-span-2">
                  <MCCDistribution data={data?.stats?.top_mcc?.buckets || []} />
               </div>
               <div className="lg:col-span-2">
                  <RecipientRanking data={data?.stats?.top_recipients?.buckets || []} />
               </div>
               <div className="lg:col-span-2">
                  <AccountHubs data={data?.stats?.top_accounts?.buckets || []} />
               </div>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="executive" activeTab={activeTab}>
        {(!data?.stats?.merchant_integrity?.buckets?.length) ? (
             <TabEmptyState 
               icon={ShieldAlert}
               title="No Executive Insights"
               description="Need more data to generate integrity scores and high-level patterns."
             />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-2">
                 <MerchantIntegrity data={data?.stats?.merchant_integrity?.buckets || []} />
              </div>
               <div className="lg:col-span-2">
                 <NetworkStickiness data={data?.stats?.by_type?.buckets || []} />
              </div>
              <div className="lg:col-span-2">
                 <IntentCloud data={data?.stats?.top_remarks?.buckets || []} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-8">
              <div className="lg:col-span-6">
                 <TopEntitiesChart 
                   volumeData={data?.stats?.top_merchants_by_volume?.buckets || []} 
                   countData={data?.stats?.top_merchants_by_count?.buckets || []}
                 />
              </div>
            </div>
          </>
        )}
      </TabsContent>

    </div>
  );
}
