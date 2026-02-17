import { formatLocalDate } from '@/lib/utils';
import { Client } from '@elastic/elasticsearch';
import { NextResponse } from 'next/server';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '15m';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  // Calculate Start Time
  const now = Date.now();
  let startTime = now - 15 * 60 * 1000; // default 15m
  let endTime = now;
  let interval = '1m';

  switch (range) {
    case '15m': startTime = now - 15 * 60 * 1000; interval = '1m'; break;
    case '1h': startTime = now - 60 * 60 * 1000; interval = '2m'; break;
    case '24h': startTime = now - 24 * 60 * 60 * 1000; interval = '30m'; break;
    case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; interval = '4h'; break;
    case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; interval = '12h'; break;
    case '365d': startTime = now - 365 * 24 * 60 * 60 * 1000; interval = '1d'; break;
    case 'all': startTime = 0; interval = '7d'; break;
    case 'custom': {
        if (startDate) startTime = new Date(startDate).getTime();
        if (endDate) endTime = new Date(endDate).getTime();
        
        const duration = endTime - startTime;
        if (duration < 2 * 60 * 60 * 1000) interval = '5m';
        else if (duration < 24 * 60 * 60 * 1000) interval = '30m';
        else if (duration < 7 * 24 * 60 * 60 * 1000) interval = '4h';
        else if (duration < 30 * 24 * 60 * 60 * 1000) interval = '1d';
        else interval = '7d';
        break;
    }
  }
  
  const localStart = formatLocalDate(new Date(startTime));
  const localEnd = formatLocalDate(new Date(endTime));

  try {
    // 1. Get Recent Transactions (Filtered by time)
    const recentTx = await client.search({
      index: 'es_transactions',
      sort: [{ 'ts': 'desc' }],
      size: 10,
      query: {
         range: {
             ts: { gte: localStart }
         }
      }
    });

    // 2. Aggregations (Enhanced for new charts)
    const aggs = await client.search({
      index: 'es_transactions',
      size: 0, 
      track_total_hits: true,
      query: {
         range: {
             ts: { gte: localStart, lte: localEnd }
         }
      },
      aggs: {
        total_volume: { sum: { field: 'amount' } },
        active_users: { cardinality: { field: 'sourceId' } },
        tps_window: {
          filter: {
            range: {
              ts: { gte: "now-1m" }
            }
          }
        },
        by_type: { 
          terms: { field: 'type' },
          aggs: {
            total_spent: { sum: { field: 'amount' } }
          }
        },
        by_currency: { terms: { field: 'currency' } },
        top_merchants_by_volume: { 
          terms: { 
            field: 'targetName', 
            size: 5,
            order: { total_spent: "desc" }
          },
          aggs: {
            total_spent: { sum: { field: 'amount' } }
          }
        },
        top_merchants_by_count: { 
          terms: { 
            field: 'targetName', 
            size: 5,
            order: { _count: "desc" }
          },
          aggs: {
            total_spent: { sum: { field: 'amount' } }
          }
        },
        hourly_activity: {
          terms: {
            script: {
              source: "doc['ts'].size() > 0 ? doc['ts'].value.hour : 0",
              lang: "painless"
            },
            size: 24
          }
        },
        volume_over_time: {
           date_histogram: {
             field: 'ts',
             fixed_interval: interval
           },
           aggs: {
             volume: { sum: { field: 'amount' } },
             avg_amount: { avg: { field: 'amount' } }
           }
        },
        by_category: {
          terms: { field: 'category', size: 20 },
          aggs: {
              total_volume: { sum: { field: 'amount' } },
              tx_count: { value_count: { field: 'transactionId' } },
              avg_amount: { avg: { field: 'amount' } },
              max_amount: { max: { field: 'amount' } }
          }
        }
      }
    });

    const aggregations = aggs.aggregations as any;
    const formattedCatStats = aggregations.by_category?.buckets.map((b: any) => ({
        category: b.key,
        total_volume: b.total_volume.value,
        tx_count: b.tx_count.value,
        avg_amount: b.avg_amount.value,
        max_amount: b.max_amount.value,
        window_end: formatLocalDate(new Date())
    })) || [];

    // 4. Get High Value Alerts
    const highValueAlerts = await client.search({
      index: 'es_high_value',
      sort: [{ 'ts': 'desc' }],
      size: 5,
      query: {
         range: {
             ts: { gte: localStart }
         }
      }
    });

    const tps = (aggregations.tps_window?.doc_count || 0) / 60;

    return NextResponse.json({
      recent: recentTx.hits.hits.map(h => h._source),
      stats: aggregations,
      total_count: (aggs.hits.total as any).value || 0,
      active_users: aggregations.active_users?.value || 0,
      tps: parseFloat(tps.toFixed(2)),
      category_stats: formattedCatStats,
      alerts: highValueAlerts.hits.hits.map(h => h._source)
    });
  } catch (error) {
    console.error("ES Error:", error);
    // Return mock data if ES is down/empty for UI dev
    return NextResponse.json({ 
        recent: [], 
        stats: { total_volume: { value: 0 } }, 
        total_count: 0,
        active_users: 0,
        tps: 0,
        error: "Failed to fetch from ES" 
    }, { status: 500 });
  }
}
