'use client';

import { formatCurrency } from '@/lib/utils';
import { Activity, ArrowUpRight, Car, Coffee, Music, ShoppingBag, Zap } from 'lucide-react';

const getIcon = (category: string) => {
  // Normalize to uppercase just in case
  const cat = category?.toUpperCase() || ''
  
  switch (cat) {
    case 'RETAIL':
    case 'FASHION': 
    case 'ELECTRONICS':
    case 'SHOPPING':
    case 'AUTOMOTIVE':
    case 'CONSTRUCTION':
      return <ShoppingBag size={16} className="text-pink-400" />;
    case 'FOOD':
    case 'GROCERY':
    case 'DINING':
    case 'FOOD & DRINK':
      return <Coffee size={16} className="text-orange-400" />;
    case 'ENTERTAINMENT': 
    case 'HOSPITALITY':
      return <Music size={16} className="text-purple-400" />;
    case 'TRAVEL': 
    case 'TRANSPORT':
      return <Car size={16} className="text-blue-400" />;
    case 'UTILITIES':
    case 'IT_SERVICES':
      return <Zap size={16} className="text-yellow-400" />;
    case 'EDUCATION':
    case 'HEALTH':
    case 'FINANCE':
    case 'GOVERNMENT':
    case 'REAL_ESTATE':
    case 'INSURANCE':
    case 'NON_PROFIT':
    default: 
      return <ArrowUpRight size={16} className="text-green-400" />;
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
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col min-h-[500px]">
      <div className="p-6 border-b border-border flex items-center justify-between bg-card">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            Transaction Ledger
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border">
              {transactions.length} Events
            </span>
          </h3>
          <p className="text-xs text-muted-foreground font-medium">Real-time financial activity stream</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Feed</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-muted/40 backdrop-blur-md z-10 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border w-[140px]">Timestamp / ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">Entities</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">Type / Category</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border text-center">Channel</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border text-right">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {displayTx.map((tx, idx) => {
              const isP2P = tx.tran_type === 'P2P';
              const sender = tx.user_id;
              const recipient = isP2P ? tx.counterparty_user_id : (tx.merchant_id || tx.counterparty_user_id || 'System');
              
              return (
                <tr key={`${tx.tran_id}-${idx}`} className="hover:bg-muted/30 transition-colors duration-150 group">
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {new Date(tx.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground/60 truncate w-24 select-all cursor-pointer hover:text-primary transition-colors" title="Click to copy ID">
                        {tx.tran_id}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 group/sender">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                          <ArrowUpRight size={10} className="text-red-500" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-semibold text-foreground truncate">{sender}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50 truncate">Account: {tx.account_id}</span>
                        </div>
                      </div>
                      
                      <div className="w-px h-2 bg-border ml-2.5 my-[-4px]" />
                      
                      <div className="flex items-center gap-2 group/recip">
                         <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                          <ArrowUpRight size={10} className="text-emerald-500 rotate-180" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-semibold text-foreground truncate">{recipient}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50 truncate">Account: {tx.counterparty_account_id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-2 items-start">
                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                        {getIcon(tx.merchant_category)}
                        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-tight">
                          {tx.merchant_category || 'Transfer'}
                        </span>
                      </div>
                      {tx.mcc_code && (
                         <span className="text-[9px] font-mono text-muted-foreground/60 px-1">MCC: {tx.mcc_code}</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 align-top text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-border bg-background text-[10px] font-bold text-muted-foreground uppercase tracking-wider shadow-sm">
                      {tx.channel}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-bold tracking-tight tabular-nums ${tx.is_credit ? 'text-emerald-600' : 'text-foreground'}`}>
                        {tx.is_credit ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">{tx.currency}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 align-top text-right">
                     <div className="flex flex-col items-end gap-1">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          tx.tran_status === 'SUCCESS' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' :
                          tx.tran_status === 'PENDING' ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' : 
                          'bg-rose-500/5 text-rose-600 border-rose-500/20'
                       }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${
                            tx.tran_status === 'SUCCESS' ? 'bg-emerald-500' :
                            tx.tran_status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 
                            'bg-rose-500'
                         }`} />
                         {tx.tran_status}
                       </span>
                       {tx.remark && (
                         <span className="text-[9px] text-muted-foreground/50 italic max-w-[100px] truncate">
                           {tx.remark}
                         </span>
                       )}
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-muted/20 border-t border-border flex justify-center">
         <button className="text-[10px] font-black text-primary/70 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1 group">
           View Complete Audit Log 
           <span className="group-hover:translate-x-0.5 transition-transform">→</span>
         </button>
      </div>
    </div>
  );
}
