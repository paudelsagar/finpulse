'use client';

import { formatCurrency } from '@/lib/utils';
import { Activity, ArrowUpRight, Car, Coffee, Music, ShoppingBag, Users } from 'lucide-react';

const getIcon = (category: string) => {
  switch (category) {
    case 'Shopping': return <ShoppingBag size={16} className="text-pink-400" />;
    case 'Food & Drink': return <Coffee size={16} className="text-orange-400" />;
    case 'Entertainment': return <Music size={16} className="text-purple-400" />;
    case 'Transport': return <Car size={16} className="text-blue-400" />;
    default: return <ArrowUpRight size={16} className="text-green-400" />;
  }
};

export default function TransactionList({ transactions }: { transactions: any[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Activity className="text-muted-foreground animate-pulse" size={24} />
        </div>
        <p className="text-muted-foreground font-medium">Waiting for live data...</p>
      </div>
    );
  }

  // Show only most recent 10 records
  const displayTx = transactions.slice(0, 10);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col mb-12">
      <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity ({displayTx.length})</h3>
          <p className="text-sm text-muted-foreground">Real-time transaction stream</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
          Live Feed
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed border-collapse">
          <thead className="bg-muted/35 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            <tr>
              <th className="px-4 py-3 text-left w-[50px]">Type</th>
              <th className="px-4 py-3 text-left w-[100px]">Tx ID</th>
              <th className="px-4 py-3 text-left w-[20%]">Recipient</th>
              <th className="px-4 py-3 text-left w-[20%]">Sender</th>
              <th className="px-4 py-3 text-left w-[15%]">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right w-[100px]">Time</th>
              <th className="px-4 py-3 text-center w-[60px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {displayTx.map((tx, idx) => (
              <tr key={`${tx.transactionId}-${idx}`} className="hover:bg-accent/30 transition-colors duration-100 group">
                <td className="px-4 py-2 text-center align-middle">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center mx-auto ${
                    tx.type === 'P2P' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {tx.type === 'P2P' ? <Users size={12} /> : <ShoppingBag size={12} />}
                  </div>
                </td>
                <td className="px-4 py-2 align-middle">
                  <span className="font-mono text-[10px] text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                    {tx.transactionId?.substring(0, 8) || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-2 truncate align-middle">
                  <span className="font-semibold text-foreground text-xs">{tx.targetName}</span>
                </td>
                <td className="px-4 py-2 truncate align-middle">
                  <span className="text-[11px] text-muted-foreground">{tx.sourceName}</span>
                </td>
                <td className="px-4 py-2 align-middle">
                  <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-muted/40 w-fit">
                    {getIcon(tx.category)}
                    <span className="text-[10px] font-medium text-foreground/70 uppercase tracking-tight">{tx.category || 'Transfer'}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right align-middle">
                  <span className="font-mono font-bold text-foreground text-xs">
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right align-middle">
                  <span className="text-[10px] text-muted-foreground font-mono opacity-80">
                    {new Date(tx.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </td>
                <td className="px-4 py-2 text-center align-middle">
                   <div className="flex justify-center">
                     <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-muted/20 border-t border-border flex justify-center">
         <button className="text-xs font-semibold text-primary hover:underline">View Analytics Report →</button>
      </div>
    </div>
  );
}
