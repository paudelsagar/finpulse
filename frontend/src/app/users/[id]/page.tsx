"use client";

import TransactionList from "@/components/TransactionList";
import { POLLING_INTERVAL } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  PieChart as PieIcon,
  User
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function UserProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/users/${id}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin text-primary"><User size={32} /></div>
    </div>
  );

  if (data?.error) return (
    <div className="p-8 text-center text-red-500">Error: {data.error}</div>
  );

  return (
    <div className="space-y-6">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Header Profile Section */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-4 border-background shadow-inner">
          {data.name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{data.name}</h1>
          <div className="flex items-center justify-center md:justify-start gap-4 mt-1">
            <p className="text-muted-foreground font-mono text-sm">{data.id}</p>
            {data.transactions[0] && (
              <div className="flex items-center gap-2 px-2 py-0.5 bg-muted/50 rounded text-[10px] text-muted-foreground font-medium border border-border/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Synced: {new Date(data.transactions[0].ts).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Active Account
            </div>
            <div className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              Member since Feb 2026
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
           <div className="bg-muted/30 p-3 rounded-xl border border-border/40 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Spent</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(data.summary.total_spent, 'USD')}</p>
           </div>
           <div className="bg-muted/30 p-3 rounded-xl border border-border/40 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tx Count</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{data.summary.tx_count}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-primary" />
            <h3 className="font-bold text-foreground">Spending by Category</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.by_category}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.charts.by_category.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.charts.by_category.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                <span className="text-xs font-bold ml-auto">{formatCurrency(entry.value, 'USD')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spend Timeline */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={18} className="text-primary" />
            <h3 className="font-bold text-foreground">Spending Timeline</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.spend_over_time}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                   labelStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
         <div className="flex items-center gap-2 mb-6 text-foreground">
            <CreditCard size={18} className="text-primary" />
            <h3 className="font-bold">Transaction History</h3>
         </div>
         <TransactionList transactions={data.transactions} />
      </div>
    </div>
  );
}
