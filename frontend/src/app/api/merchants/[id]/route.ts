import { formatLocalDate } from '@/lib/utils';
import { Client } from '@elastic/elasticsearch';
import { NextResponse } from 'next/server';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const merchantId = id;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Build temporal filter
  const filters: any[] = [
    { term: { "targetId": merchantId } }
  ];

  if (startDate || endDate) {
    const rangeFilter: any = {};
    if (startDate) rangeFilter.gte = startDate;
    if (endDate) rangeFilter.lte = endDate;
    filters.push({ range: { ts: rangeFilter } });
  } else if (range && range !== 'all') {
    filters.push({ range: { ts: { gte: `now-${range}` } } });
  }

  // Calculate Start Time matching dashboard logic
  const now = Date.now();
  let startTime = now - 24 * 60 * 60 * 1000; 
  let endTime = now;

  switch (range) {
    case '15m': startTime = now - 15 * 60 * 1000; break;
    case '1h': startTime = now - 60 * 60 * 1000; break;
    case '24h': startTime = now - 24 * 60 * 60 * 1000; break;
    case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
    case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
    case '365d': startTime = now - 365 * 24 * 60 * 60 * 1000; break;
    case 'all': startTime = 0; break;
    case 'custom': {
        if (startDate) startTime = new Date(startDate).getTime();
        if (endDate) endTime = new Date(endDate).getTime();
        break;
    }
  }
  
  const localStart = formatLocalDate(new Date(startTime));
  const localEnd = formatLocalDate(new Date(endTime));

  const query = {
    bool: {
      must: filters
    }
  };

  try {
    // 1. Fetch Merchant Summary & Recent Sales
    const recentSales = await client.search({
      index: 'es_transactions',
      query,
      sort: [{ "ts": "desc" }],
      size: 50
    });

    // 2. Aggregate Analytics for this Merchant
    const analytics = await client.search({
      index: 'es_transactions',
      size: 0,
      query,
      aggs: {
        total_revenue: { sum: { field: 'amount' } },
        avg_sale: { avg: { field: 'amount' } },
        tx_count: { value_count: { field: 'transactionId' } },
        unique_customers: { cardinality: { field: 'sourceId' } },
        revenue_over_time: {
          date_histogram: {
            field: 'ts',
            fixed_interval: range === '15m' || range === '1h' ? '1m' : '1d',
            min_doc_count: 0
          },
          aggs: {
            volume: { sum: { field: 'amount' } },
            count: { value_count: { field: 'transactionId' } }
          }
        },
        hourly_distribution: {
          terms: {
            script: {
              source: "doc['ts'].size() > 0 ? doc['ts'].value.hour : 0",
              lang: "painless"
            },
            size: 24
          }
        },
        top_users: {
          terms: {
            field: 'sourceId',
            size: 50,
            order: { volume: "desc" }
          },
          aggs: {
            volume: { sum: { field: 'amount' } },
            count: { value_count: { field: 'transactionId' } },
            name: { terms: { field: 'sourceName', size: 1 } }
          }
        }
      }
    });

    const aggs = analytics.aggregations as any;

    const extractUserData = (buckets: any[]) => {
      return buckets.map((b: any) => ({
        id: b.key,
        name: b.name.buckets[0]?.key || 'Unknown User',
        volume: b.volume.value,
        count: b.count.value
      }));
    };

    const topUsers = aggs.top_users.buckets;
    const rankings = {
      top_by_volume: extractUserData([...topUsers].sort((a, b) => b.volume.value - a.volume.value).slice(0, 10)),
      top_by_count: extractUserData([...topUsers].sort((a, b) => b.count.value - a.count.value).slice(0, 10)),
      top_by_revenue: extractUserData([...topUsers].sort((a, b) => b.volume.value - a.volume.value).slice(0, 10)) // Same as volume for merchant-user relationship
    };
    
    // Get merchant name from first transaction
    const merchantName = (recentSales.hits.hits[0]?._source as any)?.targetName || 'Unknown Merchant';

    return NextResponse.json({
      id: merchantId,
      name: merchantName,
      summary: {
        total_revenue: aggs.total_revenue.value,
        avg_sale: aggs.avg_sale.value,
        tx_count: aggs.tx_count.value,
        unique_customers: aggs.unique_customers.value
      },
      charts: {
        revenue_over_time: aggs.revenue_over_time.buckets.map((b: any) => ({
          date: b.key_as_string,
          key_as_string: b.key_as_string, // For VolumeChart compat
          value: b.volume.value,           // For VolumeChart compat
          volume: b.volume.value,
          count: b.count.value
        })),
        hourly_distribution: aggs.hourly_distribution.buckets.map((b: any) => ({
          hour: b.key,
          count: b.doc_count
        })).sort((a: any, b: any) => a.hour - b.hour)
      },
      rankings,
      transactions: recentSales.hits.hits.map(h => h._source)
    });

  } catch (error) {
    console.error("Merchant Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch merchant profile" }, { status: 500 });
  }
}
