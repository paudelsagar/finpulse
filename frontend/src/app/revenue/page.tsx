"use client";

import { formatCurrency, formatRichCurrency, formatRichNumber } from "@/lib/utils";
import {
    ArrowUpRight,
    BarChart3,
    DollarSign,
    Layers,
    Store,
    TrendingUp,
    Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

import TimeFilter from "@/components/TimeFilter";

export default function RevenuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/revenue?range=${range}&startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s refresh for analytics
    return () => clearInterval(interval);
  }, [range, startDate, endDate]);

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin text-primary">
          <TrendingUp size={48} />
        </div>
        <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Analyzing Revenue Streams...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Revenue Analysis</h1>
          <p className="text-muted-foreground mt-1 text-sm">Comprehensive financial performance across categories and merchants.</p>
        </div>

        <TimeFilter 
           value={range} 
           onChange={setRange} 
           startDate={startDate}
           endDate={endDate}
           onStartDateChange={setStartDate}
           onEndDateChange={setEndDate}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Gross Revenue</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums">
                {formatRichCurrency(data?.total || 0, 'USD', 0).map((part, i) => {
                  const sizeClass = [
                    "text-3xl font-black text-foreground",
                    "text-base font-bold text-foreground/80",
                    "text-xs font-semibold text-muted-foreground",
                    "text-[10px] font-medium text-muted-foreground/40"
                  ][Math.min(i, 3)];
                  return (
                    <span key={i} className={sizeClass}>
                      {part.value}<span className="text-[10px] ml-0.5 opacity-70 font-bold uppercase">{part.unit}</span>
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 mt-1 text-emerald-500 text-[10px] font-bold uppercase">
                <TrendingUp size={12} /> +12.4% vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-sm shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg. Transaction Value</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums">
                {formatRichCurrency(data?.average || 0, 'USD', 2).map((part, i) => {
                  const sizeClass = [
                    "text-3xl font-black text-foreground",
                    "text-base font-bold text-foreground/80",
                    "text-xs font-semibold text-muted-foreground",
                    "text-[10px] font-medium text-muted-foreground/40"
                  ][Math.min(i, 3)];
                  return (
                    <span key={i} className={sizeClass}>
                      {part.value}<span className="text-[10px] ml-0.5 opacity-70 font-bold uppercase">{part.unit}</span>
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Stable over last {range}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-sm shrink-0">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Revenue Density</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1 font-mono tracking-tight tabular-nums">
                {formatRichNumber((data?.total || 0) / (range === '24h' ? 24 : range === '7d' ? 168 : 720)).map((part, i) => {
                  const sizeClass = [
                    "text-3xl font-black text-foreground",
                    "text-base font-bold text-foreground/80",
                    "text-xs font-semibold text-muted-foreground",
                    "text-[10px] font-medium text-muted-foreground/40"
                  ][Math.min(i, 3)];
                  return (
                    <span key={i} className={sizeClass}>
                      {part.value}<span className="text-[10px] ml-0.5 opacity-70 font-bold uppercase">{part.unit}</span>
                    </span>
                  );
                })}
                <span className="text-sm font-normal text-muted-foreground ml-1">/hr</span>
              </div>
              <p className="text-[10px] text-purple-500 mt-1 font-bold uppercase">Peak activity at 14:00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Revenue Trends
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">Real-time</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  fontSize={10} 
                  tickFormatter={(val) => range === '24h' ? new Date(val).getHours() + ':00' : new Date(val).toLocaleDateString()} 
                  stroke="#888"
                />
                <YAxis fontSize={10} stroke="#888" tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: any) => [formatCurrency(value, 'USD'), 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <Store size={18} className="text-emerald-500" /> Top Revenue Contributors
            </h3>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.top_merchants || []} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} fontSize={10} stroke="#888" />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                     formatter={(value: any) => [formatCurrency(value, 'USD'), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                    {data?.top_merchants?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Layers size={18} className="text-pink-500" /> Revenue by Category
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categories || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.categories?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(value: any) => [formatCurrency(value, 'USD'), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data?.categories?.slice(0, 4).map((cat: any, i: number) => (
               <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{cat.name}</span>
               </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-cyan-500" /> Payment Methods
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.methods || []}
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="value"
                >
                  {data?.methods?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                   formatter={(value: any) => [formatCurrency(value, 'USD'), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data?.methods?.map((method: any, i: number) => (
               <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                  <span className="text-muted-foreground">{method.name}</span>
               </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-500" /> Revenue Stream
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
             {data?.top_merchants?.map((merchant: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                         {merchant.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-foreground">{merchant.name}</p>
                         <p className="text-[10px] text-muted-foreground">Certified Partner</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-foreground">{formatCurrency(merchant.revenue, 'USD')}</p>
                      <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">+5.2%</p>
                   </div>
                </div>
             ))}
          </div>
          <button className="w-full py-2 mt-4 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
            Export Financial Report
          </button>
        </div>
      </div>
    </div>
  );
}
