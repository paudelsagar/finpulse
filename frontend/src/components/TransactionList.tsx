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
      <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
        <div>
          <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Transaction Ledger</h3>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Real-time Activity Stream</p>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
          </span>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-md z-10 border-b border-border">
            <tr>
              <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">ID / Time</th>
              <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">Parties</th>
              <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">Category / Rail</th>
              <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center border-b border-border">Channel</th>
              <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right border-b border-border">Value</th>
              <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {displayTx.map((tx, idx) => {
              const isP2P = tx.tran_type === 'P2P';
              const sender = tx.user_id;
              const recipient = isP2P ? tx.counterparty_user_id : (tx.merchant_id || tx.counterparty_user_id || 'System');
              
              return (
                <tr key={`${tx.tran_id}-${idx}`} className="hover:bg-accent/30 transition-colors duration-100 group">
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-foreground truncate w-24" title={tx.tran_id}>{tx.tran_id}</span>
                      <span className="text-[9px] font-medium text-muted-foreground/60">{new Date(tx.ts).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 group/sender">
                        <span className="text-[9px] font-black text-primary/80 uppercase tracking-tighter w-3">S:</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-foreground truncate max-w-[120px]">{sender}</span>
                          <span className="text-[7px] font-mono text-muted-foreground/40 hidden group-hover/sender:block">{tx.account_id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 group/recip">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter w-3">R:</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-foreground truncate max-w-[120px]">{recipient}</span>
                          <span className="text-[7px] font-mono text-muted-foreground/40 hidden group-hover/recip:block">{tx.counterparty_account_id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-muted/40 w-fit">
                        {getIcon(tx.merchant_category)}
                        <span className="text-[10px] font-black text-foreground/70 uppercase tracking-tight">
                          {tx.merchant_category || 'Transfer'}
                          {tx.mcc_code && <span className="ml-1 opacity-40 font-mono text-[8px]">#{tx.mcc_code}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 border border-border w-fit rounded-sm bg-background/50">
                         <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider text-[8px]">{tx.payment_method}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle text-center">
                    <span className="inline-block text-[9px] font-black text-muted-foreground uppercase tracking-widest py-1 px-2 rounded-md border border-border bg-muted/20">
                      {tx.channel}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right align-middle">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-mono font-bold tracking-tight ${tx.is_credit ? 'text-emerald-500' : 'text-foreground'}`}>
                        {tx.is_credit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">{tx.currency}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center align-middle">
                     <div className="flex flex-col items-center gap-1">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          tx.tran_status === 'SUCCESS' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                          tx.tran_status === 'PENDING' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 
                          'text-rose-500 bg-rose-500/10 border-rose-500/20'
                       }`}>
                         {tx.ref_tran_id && <div className="w-1 h-1 rounded-full bg-current animate-pulse" title="Referenced/Reversal" />}
                         {tx.tran_status}
                       </span>
                       {tx.remark && (
                         <span className="text-[9px] text-muted-foreground/60 italic truncate max-w-[100px] font-medium" title={tx.remark}>
                           "{tx.remark}"
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
         <button className="text-[10px] font-black text-primary/70 uppercase tracking-widest hover:text-primary transition-colors">View Complete Audit Log →</button>
      </div>
    </div>
  );
}
