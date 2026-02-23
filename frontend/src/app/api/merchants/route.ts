import { formatLocalDate } from '@/lib/utils';
import { Client } from '@elastic/elasticsearch';
import { NextResponse } from 'next/server';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const range = searchParams.get('range') || '15m';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const skip = (page - 1) * limit;

  const now = Date.now();
  let startTime = now - 15 * 60 * 1000;
  let endTime = now;
  let interval = '1m';

  switch (range) {
    case '5m': startTime = now - 5 * 60 * 1000; interval = '10s'; break;
    case '15m': startTime = now - 15 * 60 * 1000; interval = '1m'; break;
    case '1h': startTime = now - 60 * 60 * 1000; interval = '2m'; break;
    case '24h': startTime = now - 24 * 60 * 60 * 1000; interval = '30m'; break;
    case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; interval = '4h'; break;
    case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; interval = '12h'; break;
    case '3M': startTime = now - 90 * 24 * 60 * 60 * 1000; interval = '1d'; break;
    case '6M': startTime = now - 180 * 24 * 60 * 60 * 1000; interval = '1d'; break;
    case '365d': startTime = now - 365 * 24 * 60 * 60 * 1000; interval = '1d'; break;
    case '3y': startTime = now - 3 * 365 * 24 * 60 * 60 * 1000; interval = '7d'; break;
    case 'all': startTime = 0; interval = '7d'; break;
    case 'custom': {
      if (startDate) startTime = new Date(startDate).getTime();
      if (endDate) endTime = new Date(endDate).getTime();
      interval = '1h';
      break;
    }
  }

  const localStart = formatLocalDate(new Date(startTime));
  const localEnd = formatLocalDate(new Date(endTime));

  try {
    // Query es_transactions for merchant aggregations
    const results = await client.search({
      index: 'es_transactions',
      size: 0,
      query: {
        bool: {
          must: [
            { exists: { field: 'merchant_id' } },
            { range: { ts: { gte: localStart, lte: localEnd } } }
          ]
        }
      },
      aggs: {
        unique_merchants: {
          terms: { field: 'merchant_id', size: 5000 },
          aggs: {
            revenue: { sum: { field: 'amount' } },
            avg_sale: { avg: { field: 'amount' } },
            category: { terms: { field: 'merchant_category', size: 1 } },
            mcc: { terms: { field: 'mcc_code', size: 1 } }
          }
        },
        // Activity trend
        activity_trend: {
          date_histogram: {
            field: 'ts',
            fixed_interval: interval,
            min_doc_count: 0,
            extended_bounds: { min: localStart, max: localEnd }
          },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        },
        // Category breakdown
        category_breakdown: {
          terms: { field: 'merchant_category', size: 20 },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        }
      }
    });

    const aggs = results.aggregations as any;
    const allMerchants = aggs.unique_merchants.buckets.map((b: any) => ({
      id: b.key,
      name: b.key,
      category: b.category.buckets[0]?.key || 'Unknown',
      mcc_code: b.mcc.buckets[0]?.key || '0000',
      total_revenue: b.revenue.value || 0,
      avg_sale: b.avg_sale.value || 0,
      tx_count: b.doc_count
    }));

    const paginatedMerchants = allMerchants.slice(skip, skip + limit);

    const globalStats = allMerchants.reduce((acc: any, m: any) => ({
      total_revenue: acc.total_revenue + m.total_revenue,
      total_txs: acc.total_txs + m.tx_count
    }), { total_revenue: 0, total_txs: 0 });

    const uniqueCategories = new Set(allMerchants.map((m: any) => m.category));

    const topMerchant = allMerchants.length > 0
      ? [...allMerchants].sort((a: any, b: any) => b.total_revenue - a.total_revenue)[0]
      : null;

    const rankings = {
      top_by_volume: [...allMerchants]
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .slice(0, 5)
        .map((m: any) => ({ id: m.id, name: m.name, category: m.category, value: m.total_revenue })),
      top_by_count: [...allMerchants]
        .sort((a: any, b: any) => b.tx_count - a.tx_count)
        .slice(0, 5)
        .map((m: any) => ({ id: m.id, name: m.name, category: m.category, value: m.tx_count })),
    };

    return NextResponse.json({
      data: paginatedMerchants,
      total: allMerchants.length,
      page,
      limit,
      totalPages: Math.ceil(allMerchants.length / limit),
      global: {
        ...globalStats,
        avg_sale: globalStats.total_txs > 0 ? globalStats.total_revenue / globalStats.total_txs : 0,
        category_count: uniqueCategories.size,
        top_merchant: topMerchant?.name || 'N/A'
      },
      rankings,
      trend: aggs.activity_trend.buckets.map((b: any) => ({
        time: b.key_as_string,
        amount: b.volume.value,
        count: b.doc_count
      })),
      category_breakdown: aggs.category_breakdown.buckets.map((b: any) => ({
        name: b.key,
        value: b.volume.value,
        count: b.doc_count
      }))
    });
  } catch (error) {
    console.error("Merchant List Error:", error);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}
