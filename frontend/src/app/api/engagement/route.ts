import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d';

  // Mock Data Generation
  const generateTrend = (points: number, base: number, volatility: number) => {
    return Array.from({ length: points }).map((_, i) => ({
      date: new Date(Date.now() - (points - i - 1) * 86400000).toISOString(),
      value: Math.max(0, Math.floor(base + (Math.random() - 0.5) * volatility)),
    }));
  };

  const dau = generateTrend(30, 4500, 500);
  const wau = generateTrend(30, 12000, 1000); // Smoothed for demo
  const mau = generateTrend(30, 35000, 2000);

  const retentionCurve = [100, 85, 75, 68, 62, 58, 55, 53, 51, 50, 49, 48, 47, 46]; // Day 0 to 14

  const churnRate = generateTrend(12, 5, 2).map((d, i) => ({
    date: new Date(Date.now() - (12 - i - 1) * 30 * 86400000).toISOString(), // Monthly
    value: Math.max(2, d.value / 1000) // Small %
  }));

  const transactionFrequency = [
    { range: '1', count: 5000 },
    { range: '2-5', count: 12000 },
    { range: '6-10', count: 8000 },
    { range: '11-20', count: 4000 },
    { range: '21-50', count: 1500 },
    { range: '50+', count: 500 },
  ];

  const featureUsage = [
    { feature: 'P2P Transfer', usage: 45 },
    { feature: 'Bill Pay', usage: 25 },
    { feature: 'Merchant Pay', usage: 20 },
    { feature: 'Savings', usage: 10 },
  ];

  const chartData = {
    engagement: {
      dau,
      wau,
      mau,
      frequency: transactionFrequency,
      feature_usage: featureUsage,
      avg_transactions: generateTrend(30, 12, 3),
    },
    retention: {
      curve: retentionCurve.map((v, i) => ({ day: i, wau_pct: v })),
      churn_rate: churnRate,
      inactivity_funnel: [
        { stage: 'Active (T)', count: 10000, fill: '#10b981' },
        { stage: 'No Txn (T+7)', count: 3500, fill: '#f59e0b' },
        { stage: 'No Txn (T+30)', count: 1200, fill: '#ef4444' },
        { stage: 'Churned', count: 800, fill: '#7f1d1d' },
      ],
      cohorts: Array.from({length: 6}).map((_, i) => ({
          month: new Date(Date.now() - (5-i)*30*24*3600*1000).toLocaleDateString('en-US', {month: 'short'}),
          retention: [100, 90-i*2, 80-i*3, 70-i*4, 60-i*5, 50-i*4].slice(0, 6-i + 1) // strictly synthetic decay
      }))
    },
    insights: {
      rfm: Array.from({length: 50}).map(() => ({
          r: Math.floor(Math.random() * 5) + 1,
          f: Math.floor(Math.random() * 5) + 1,
          m: Math.floor(Math.random() * 5) + 1,
          count: Math.floor(Math.random() * 500)
      })),
      churn_risk: [
         { name: 'Low Risk', value: 65, fill: '#10b981' },
         { name: 'Medium Risk', value: 25, fill: '#f59e0b' },
         { name: 'High Risk', value: 10, fill: '#ef4444' },
      ],
      velocity_drop: generateTrend(30, 0, 5).map(d => ({ ...d, value: d.value - 2.5 })) // negative trend simulation
    }
  };

  return NextResponse.json(chartData);
}
