import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';

  // Helper to generate time-series data
  const generateTrend = (points: number, baseVolume: number, baseCount: number) => {
    return Array.from({ length: points }).map((_, i) => {
      const date = new Date();
      if (range === '1h' || range === '15m') {
          date.setMinutes(date.getMinutes() - (points - i - 1) * (range === '15m' ? 1 : 5));
      } else if (range === '24h') {
          date.setHours(date.getHours() - (points - i - 1));
      } else {
          date.setDate(date.getDate() - (points - i - 1));
      }
      
      const volatility = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
      const pointVolume = Math.floor(baseVolume * volatility);
      const pointCount = Math.floor(baseCount * volatility * 1.5);

      return {
        date: date.toISOString(),
        volume: pointVolume,
        count: pointCount,
        // Flow
        credit_volume: Math.floor(pointVolume * 0.42),
        debit_volume: Math.floor(pointVolume * 0.58),
        credit_count: Math.floor(pointCount * 0.45),
        debit_count: Math.floor(pointCount * 0.55),
        // Status
        success_volume: Math.floor(pointVolume * 0.95),
        pending_volume: Math.floor(pointVolume * 0.04),
        failed_volume: Math.floor(pointVolume * 0.01),
        success_count: Math.floor(pointCount * 0.94),
        pending_count: Math.floor(pointCount * 0.04),
        failed_count: Math.floor(pointCount * 0.02),
        // Channel
        online_volume: Math.floor(pointVolume * 0.50),
        instore_volume: Math.floor(pointVolume * 0.30),
        mobile_volume: Math.floor(pointVolume * 0.20),
        online_count: Math.floor(pointCount * 0.55),
        instore_count: Math.floor(pointCount * 0.25),
        mobile_count: Math.floor(pointCount * 0.20),
        // Type
        payment_volume: Math.floor(pointVolume * 0.70),
        transfer_volume: Math.floor(pointVolume * 0.25),
        refund_volume: Math.floor(pointVolume * 0.05),
        payment_count: Math.floor(pointCount * 0.75),
        transfer_count: Math.floor(pointCount * 0.20),
        refund_count: Math.floor(pointCount * 0.05),
        // Method
        card_volume: Math.floor(pointVolume * 0.40),
        wallet_volume: Math.floor(pointVolume * 0.40),
        bank_volume: Math.floor(pointVolume * 0.20),
        card_count: Math.floor(pointCount * 0.35),
        wallet_count: Math.floor(pointCount * 0.45),
        bank_count: Math.floor(pointCount * 0.20),
      };
    });
  };

  // Determine points based on range
  let points = 24;
  let baseVolume = 50000;
  let baseCount = 120;

  if (range === '7d') { points = 7; baseVolume = 4500000; baseCount = 8000; }
  if (range === '30d') { points = 30; baseVolume = 4200000; baseCount = 7500; }

  const trend = generateTrend(points, baseVolume / points, baseCount / points);

  // Summaries
  const totalVolume = trend.reduce((acc, curr) => acc + curr.volume, 0);
  const totalCount = trend.reduce((acc, curr) => acc + curr.count, 0);
  
  const data = {
    last_event_ts: new Date().toISOString(),
    summary: {
      total_volume: totalVolume,
      total_count: totalCount,
      success_rate: 98.2,
      avg_ticket_size: Math.floor(totalVolume / totalCount),
      failed_volume: Math.floor(totalVolume * 0.018),
      peak_tps: Math.floor(Math.random() * 50 + 120)
    },
    trend,
    status_distribution: [
      { name: 'Success', value: totalCount * 0.98, fill: '#10b981' }, // emerald-500
      { name: 'Pending', value: totalCount * 0.015, fill: '#f59e0b' }, // amber-500
      { name: 'Failed', value: totalCount * 0.005, fill: '#ef4444' }   // red-500
    ],
    payment_methods: [
      { name: 'Wallet P2P', value: 45, fill: '#3b82f6' }, // blue-500
      { name: 'QR Scan', value: 30, fill: '#8b5cf6' },   // violet-500
      { name: 'Card', value: 15, fill: '#ec4899' },      // pink-500
      { name: 'Bank Transfer', value: 10, fill: '#06b6d4' } // cyan-500
    ],
    failure_reasons: [
      { reason: 'Insuff. Funds', count: 142 },
      { reason: 'Timeout', count: 89 },
      { reason: 'Inv. PIN', count: 34 },
      { reason: 'Limit Exceeded', count: 21 },
    ],
    channel_distribution: [
      { name: 'Online', value: totalVolume * 0.45, fill: '#3b82f6' },
      { name: 'In-Store', value: totalVolume * 0.35, fill: '#10b981' },
      { name: 'Mobile', value: totalVolume * 0.20, fill: '#f59e0b' }
    ],
    category_performance: [
      { category: 'Retail', volume: totalVolume * 0.30, count: Math.floor(totalCount * 0.25) },
      { category: 'Travel', volume: totalVolume * 0.25, count: Math.floor(totalCount * 0.15) },
      { category: 'Dining', volume: totalVolume * 0.15, count: Math.floor(totalCount * 0.30) },
      { category: 'Utilities', volume: totalVolume * 0.10, count: Math.floor(totalCount * 0.10) },
      { category: 'Entmt', volume: totalVolume * 0.20, count: Math.floor(totalCount * 0.20) }
    ]
  };

  return NextResponse.json(data);
}
