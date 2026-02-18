'use client';

import AccountHubs from '@/components/AccountHubs';
import AmountDistribution from '@/components/AmountDistribution';
import AvgTransactionChart from '@/components/AvgTransactionChart';
import CategoryChart from '@/components/CategoryChart';
import ChannelReliability from '@/components/ChannelReliability';
import CorrectionTracker from '@/components/CorrectionTracker';
import CreditDebitSplit from '@/components/CreditDebitSplit';
import CurrencyMix from '@/components/CurrencyMix';
import HighValueAlerts from '@/components/HighValueAlerts';
import HourlyHeatmap from '@/components/HourlyHeatmap';
import LiquidityPulse from '@/components/LiquidityPulse';
import MCCDistribution from '@/components/MCCDistribution';
import NetworkConnectivity from '@/components/NetworkConnectivity';
import PaymentMethodGrid from '@/components/PaymentMethodGrid';
import PaymentTypeChart from '@/components/PaymentTypeChart';
import RecipientRanking from '@/components/RecipientRanking';
import StatusDonut from '@/components/StatusDonut';
import TimeFilter from '@/components/TimeFilter';
import TopEntitiesChart from "@/components/TopEntitiesChart";
import TransactionList from '@/components/TransactionList';
import VolumeChart from '@/components/VolumeChart';
import { POLLING_INTERVAL } from '@/lib/constants';
import { formatRichCurrency, formatRichNumber } from '@/lib/utils';
import { Activity, CreditCard, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('15m');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?range=${timeRange}&startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, POLLING_INTERVAL); 
    return () => clearInterval(interval);
  }, [timeRange, startDate, endDate]); // Re-fetch when timeRange, startDate, or endDate changes

  if (loading && !data) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-spin text-primary" size={32} />
        <p className="text-muted-foreground">Initializing Analytics...</p>
      </div>
    </div>
  );

  const totalVol = data?.stats?.total_volume?.value || 0;
  
  const volHistory = data?.stats?.volume_over_time?.buckets?.map((b: any) => ({
      key: b.key,
      key_as_string: b.key_as_string,
      value: b.volume.value,
      count: b.doc_count,
      avg: b.avg_amount.value,
      failed_count: b.statuses?.buckets?.failed?.doc_count || 0
  })) || [];

  const recentTx = data?.recent || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-4">
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
         
         <TimeFilter 
           value={timeRange} 
           onChange={setTimeRange} 
           startDate={startDate}
           endDate={endDate}
           onStartDateChange={setStartDate}
           onEndDateChange={setEndDate}
        />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <LiquidityPulse total={data?.stats?.total_liquidity?.value || 0} />
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
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-8">
           <VolumeChart data={volHistory} />
           <CreditDebitSplit data={data?.stats?.volume_over_time?.buckets || []} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
            <StatusDonut data={data?.stats?.by_status?.buckets || []} />
            <CurrencyMix data={data?.stats?.by_currency?.buckets || []} />
            <HighValueAlerts alerts={data?.alerts || []} />
        </div>
      </div>

      {/* Row 2: Behavioral & Health Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-2">
           <ChannelReliability data={data?.stats?.by_channel?.buckets || []} />
        </div>
        <div className="lg:col-span-2">
           <PaymentMethodGrid data={data?.stats?.by_payment_method?.buckets || []} />
        </div>
        <div className="lg:col-span-2">
           <AmountDistribution data={data?.stats?.amount_distribution?.buckets || []} />
        </div>
      </div>

      {/* Row 3: Entity Hubs & Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-2">
           <AccountHubs data={data?.stats?.top_accounts?.buckets || []} />
        </div>
        <div className="lg:col-span-2">
           <RecipientRanking data={data?.stats?.top_recipients?.buckets || []} />
        </div>
        <div className="lg:col-span-2">
            <NetworkConnectivity data={data?.stats?.by_type?.buckets || []} />
        </div>
      </div>

      {/* Row 4: Specialized Metrics & High Frequency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-2">
           <MCCDistribution data={data?.stats?.top_mcc?.buckets || []} />
        </div>
        <div className="lg:col-span-2">
           <CategoryChart data={data?.category_stats || []} />
        </div>
        <div className="lg:col-span-2">
           <CorrectionTracker data={data?.stats?.reversal_stats || { doc_count: 0, total_reverals: { value: 0 } }} />
        </div>
      </div>

      {/* Row 5: Deep Performance & Entity Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
           <AvgTransactionChart data={volHistory} />
           <PaymentTypeChart data={data?.stats?.by_type?.buckets || []} />
        </div>
        <div className="lg:col-span-2">
           <TopEntitiesChart 
             volumeData={data?.stats?.top_merchants_by_volume?.buckets || []} 
             countData={data?.stats?.top_merchants_by_count?.buckets || []} 
           />
        </div>
        <div className="lg:col-span-2">
           <HourlyHeatmap data={data?.stats?.hourly_activity?.buckets || []} />
        </div>
      </div>

      {/* Row 6: Transaction Ledger */}
      <div className="grid grid-cols-1 gap-8">
           <TransactionList transactions={recentTx} />
      </div>
    </div>
  );
}
