'use client';

import { formatRichCurrency } from '@/lib/utils';
import { Building, CreditCard, QrCode, Smartphone, Wallet } from 'lucide-react';

interface PaymentMethodGridProps {
  data: any[];
}

export default function PaymentMethodGrid({ data }: PaymentMethodGridProps) {
  const getIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'QR': return <QrCode size={20} />;
      case 'IBFT': return <Building size={20} />;
      case 'CARD': return <CreditCard size={20} />;
      case 'WALLET': return <Smartphone size={20} />;
      default: return <Wallet size={20} />;
    }
  };

  const getColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'QR': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'IBFT': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'CARD': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'WALLET': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Payment Rails</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Protocol Distribution</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {data.map((item) => (
          <div key={item.key} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-3 hover:bg-muted/30 transition-colors">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${getColor(item.key)}`}>
              {getIcon(item.key)}
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.key}</p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1 font-mono tabular-nums tracking-tight">
                {formatRichCurrency(item.total_volume.value, 'USD', 0).slice(0, 2).map((part, i) => (
                   <span key={i} className={i === 0 ? "text-lg font-bold text-foreground" : "text-[10px] font-medium text-muted-foreground"}>
                     {part.value}{part.unit}
                   </span>
                ))}
              </div>
              <p className="text-[10px] font-bold text-primary/70 mt-1">{item.doc_count} TXs</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
