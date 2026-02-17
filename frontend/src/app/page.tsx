'use client';

import AvgTransactionChart from '@/components/AvgTransactionChart';
import CategoryChart from '@/components/CategoryChart';
import HighValueAlerts from '@/components/HighValueAlerts';
import HourlyHeatmap from '@/components/HourlyHeatmap';
import PaymentTypeChart from '@/components/PaymentTypeChart';
import TimeFilter from '@/components/TimeFilter';
import TopEntitiesChart from "@/components/TopEntitiesChart";
import TransactionList from '@/components/TransactionList';
import VolumeChart from '@/components/VolumeChart';
import { POLLING_INTERVAL } from '@/lib/constants';
import { formatRichCurrency, formatRichNumber } from '@/lib/utils';
import { Activity, CreditCard, TrendingUp, Users, Zap } from 'lucide-react';
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
      avg: b.avg_amount.value
  })) || [];

  const recentTx = data?.recent || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2 text-md flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
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
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Volume</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
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
              <div className="flex items-center gap-1 mt-1 text-green-500 text-[10px] font-bold uppercase">
                <TrendingUp size={12} />
                <span>+12.5% vs last hour</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-sm shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Interactions</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
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
              <div className="flex items-center gap-1 mt-1 text-blue-500 text-[10px] font-bold uppercase">
                <Activity size={12} />
                <span>Live Feed</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-sm shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Users</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 font-mono tracking-tight tabular-nums">
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
              <div className="flex items-center gap-1 mt-1 text-green-500 text-[10px] font-bold uppercase">
                <TrendingUp size={12} />
                <span>Real-time Insight</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-sm shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Processing Rate</p>
              <div className="mt-1 flex items-baseline font-mono tracking-tight tabular-nums text-foreground">
                <span className="text-lg font-medium opacity-50 mr-0.5">~</span>
                <h3 className="text-3xl font-bold">
                  {data?.tps || 0}
                </h3>
                <span className="ml-1.5 text-xs font-black text-muted-foreground uppercase opacity-70">TPS</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-blue-500 text-[10px] font-bold uppercase">
                <Zap size={12} />
                <span>Live Throughput</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-4 space-y-8">
           <VolumeChart data={volHistory} />
        </div>
        <div className="lg:col-span-2 space-y-8">
            <PaymentTypeChart data={data?.stats?.by_type?.buckets || []} />
        </div>
      </div>

      {/* Row 2: Category Stats, Merchants and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-2">
           <CategoryChart data={data?.category_stats || []} />
        </div>
        <div className="lg:col-span-2">
           <TopEntitiesChart 
             volumeData={data?.stats?.top_merchants_by_volume?.buckets || []} 
             countData={data?.stats?.top_merchants_by_count?.buckets || []} 
           />
        </div>
        <div className="lg:col-span-2">
           <HighValueAlerts alerts={data?.alerts || []} />
        </div>
      </div>

      {/* Row 3: Avg Trends and Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
         <div className="lg:col-span-4">
            <AvgTransactionChart data={volHistory} />
         </div>
         <div className="lg:col-span-2">
            <HourlyHeatmap data={data?.stats?.hourly_activity?.buckets || []} />
         </div>
      </div>

      {/* Row 4: Transaction List */}
      <div className="grid grid-cols-1 gap-8">
           <TransactionList transactions={recentTx} />
      </div>
    </div>
  );
}
