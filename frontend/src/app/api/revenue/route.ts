import { formatLocalDate } from '@/lib/utils';
import { Client } from '@elastic/elasticsearch';
import { NextResponse } from 'next/server';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '30d';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  // Calculate Start Time
  const now = Date.now();
  let startTime = now - 30 * 24 * 60 * 60 * 1000;
  let endTime = now;
  let interval = '1d';

  if (range === '7d') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
    interval = '1d';
  } else if (range === '24h') {
    startTime = now - 24 * 60 * 60 * 1000;
    interval = '1h';
  } else if (range === 'custom') {
    if (startDate) startTime = new Date(startDate).getTime();
    if (endDate) endTime = new Date(endDate).getTime();
    
    const duration = endTime - startTime;
    if (duration < 2 * 60 * 60 * 1000) interval = '5m';
    else if (duration < 24 * 60 * 60 * 1000) interval = '30m';
    else if (duration < 7 * 24 * 60 * 60 * 1000) interval = '4h';
    else if (duration < 30 * 24 * 60 * 60 * 1000) interval = '1d';
    else interval = '7d';
  }

  const localStart = formatLocalDate(new Date(startTime));
  const localEnd = formatLocalDate(new Date(endTime));

  try {
    const results = await client.search({
      index: 'es_transactions',
      size: 0,
      query: {
        range: {
          ts: { gte: localStart, lte: localEnd }
        }
      },
      aggs: {
        total_revenue: { sum: { field: 'amount' } },
        avg_transaction: { avg: { field: 'amount' } },
        revenue_over_time: {
          date_histogram: {
            field: 'ts',
            fixed_interval: interval
          },
          aggs: {
            revenue: { sum: { field: 'amount' } }
          }
        },
        revenue_by_category: {
          terms: { field: 'category', size: 10 },
          aggs: {
            revenue: { sum: { field: 'amount' } }
          }
        },
        revenue_by_type: {
          terms: { field: 'type', size: 10 },
          aggs: {
            revenue: { sum: { field: 'amount' } }
          }
        },
        top_merchants: {
          terms: { 
            field: 'targetName', 
            size: 5,
            order: { revenue: "desc" }
          },
          aggs: {
            revenue: { sum: { field: 'amount' } }
          }
        }
      }
    });

    const aggs = results.aggregations as any;

    return NextResponse.json({
      total: aggs.total_revenue.value,
      average: aggs.avg_transaction.value,
      trends: aggs.revenue_over_time.buckets.map((b: any) => ({
        time: b.key_as_string,
        amount: b.revenue.value
      })),
      categories: aggs.revenue_by_category.buckets.map((b: any) => ({
        name: b.key,
        value: b.revenue.value
      })),
      methods: aggs.revenue_by_type.buckets.map((b: any) => ({
        name: b.key,
        value: b.revenue.value
      })),
      top_merchants: aggs.top_merchants.buckets.map((b: any) => ({
        name: b.key,
        revenue: b.revenue.value
      }))
    });
  } catch (error) {
    console.error("Revenue API Error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue stats" }, { status: 500 });
  }
}
