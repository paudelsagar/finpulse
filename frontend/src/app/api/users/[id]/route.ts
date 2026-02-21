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
  const userId = id;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'all';
  const customStart = searchParams.get('startDate') || '';
  const customEnd = searchParams.get('endDate') || '';

  // Calculate time range
  const now = Date.now();
  let startTime = 0;
  let endTime = now;
  let histogramInterval = '1h';

  switch (range) {
    case '5m':   startTime = now - 5 * 60 * 1000;   histogramInterval = '10s'; break;
    case '15m':  startTime = now - 15 * 60 * 1000;   histogramInterval = '1m';  break;
    case '1h':   startTime = now - 60 * 60 * 1000;   histogramInterval = '2m';  break;
    case '24h':  startTime = now - 24 * 60 * 60 * 1000;   histogramInterval = '30m'; break;
    case '7d':   startTime = now - 7 * 24 * 60 * 60 * 1000;   histogramInterval = '4h';  break;
    case '30d':  startTime = now - 30 * 24 * 60 * 60 * 1000;  histogramInterval = '12h'; break;
    case '3M':   startTime = now - 90 * 24 * 60 * 60 * 1000;  histogramInterval = '1d';  break;
    case '6M':   startTime = now - 180 * 24 * 60 * 60 * 1000; histogramInterval = '1d';  break;
    case '365d': startTime = now - 365 * 24 * 60 * 60 * 1000; histogramInterval = '1d';  break;
    case '3y':   startTime = now - 3 * 365 * 24 * 60 * 60 * 1000; histogramInterval = '7d'; break;
    case 'all':  startTime = 0; histogramInterval = '1h'; break;
    case 'custom': {
      if (customStart) startTime = new Date(customStart).getTime();
      if (customEnd) endTime = new Date(customEnd).getTime();
      histogramInterval = '1h';
      break;
    }
  }

  try {
    // Build query: entity match + time range
    const entityQuery: any = {
      bool: {
        must: [
          {
            bool: {
              should: [
                { term: { "user_id": userId } },
                { term: { "merchant_id": userId } }
              ],
              minimum_should_match: 1
            }
          }
        ]
      }
    };

    // Add time filter (skip if 'all' with startTime=0)
    if (startTime > 0) {
      entityQuery.bool.must.push({
        range: { ts: { gte: formatLocalDate(new Date(startTime)), lte: formatLocalDate(new Date(endTime)) } }
      });
    }

    // 1. Fetch Recent Transactions
    const recentTx = await client.search({
      index: 'es_transactions',
      query: entityQuery,
      sort: [{ "ts": "desc" }],
      size: 50
    });

    // 2. Full Analytics Aggregation
    const analytics = await client.search({
      index: 'es_transactions',
      size: 0,
      query: entityQuery,
      aggs: {
        // Core KPIs
        total_amount: { sum: { field: 'amount' } },
        avg_amount: { avg: { field: 'amount' } },
        max_amount: { max: { field: 'amount' } },
        min_amount: { min: { field: 'amount' } },
        tx_count: { value_count: { field: 'tran_id' } },

        // Credit vs Debit split
        by_credit: {
          terms: { field: 'is_credit' },
          aggs: {
            volume: { sum: { field: 'amount' } },
            count: { value_count: { field: 'tran_id' } }
          }
        },

        // Category Breakdown
        by_category: {
          terms: { field: 'merchant_category', size: 15 },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        },

        // Transaction Type Breakdown
        by_tran_type: {
          terms: { field: 'tran_type', size: 10 },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        },

        // Payment Method Breakdown
        by_payment_method: {
          terms: { field: 'payment_method', size: 10 },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        },

        // Channel Breakdown
        by_channel: {
          terms: { field: 'channel', size: 10 },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        },

        // Status Distribution
        by_status: {
          terms: { field: 'tran_status', size: 10 },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        },

        // Volume Over Time
        spend_over_time: {
          date_histogram: {
            field: 'ts',
            fixed_interval: histogramInterval,
            min_doc_count: 0
          },
          aggs: {
            volume: { sum: { field: 'amount' } },
            credit_vol: {
              filter: { term: { is_credit: true } },
              aggs: { vol: { sum: { field: 'amount' } } }
            },
            debit_vol: {
              filter: { term: { is_credit: false } },
              aggs: { vol: { sum: { field: 'amount' } } }
            }
          }
        },

        // Top Merchants
        top_merchants: {
          terms: { field: 'merchant_id', size: 10 },
          aggs: {
            volume: { sum: { field: 'amount' } },
            category: { terms: { field: 'merchant_category', size: 1 } }
          }
        },

        // Currencies
        currencies: {
          terms: { field: 'currency', size: 5 }
        }
      }
    });

    const aggs = analytics.aggregations as any;

    // Compute credit/debit totals
    const creditBucket = aggs.by_credit.buckets.find((b: any) => b.key === 1 || b.key_as_string === 'true');
    const debitBucket = aggs.by_credit.buckets.find((b: any) => b.key === 0 || b.key_as_string === 'false');

    const totalCredit = creditBucket?.volume?.value || 0;
    const totalDebit = debitBucket?.volume?.value || 0;
    const creditCount = creditBucket?.count?.value || 0;
    const debitCount = debitBucket?.count?.value || 0;

    // Success rate
    const successBucket = aggs.by_status.buckets.find((b: any) => b.key === 'SUCCESS');
    const totalTx = aggs.tx_count.value || 1;
    const successRate = successBucket ? (successBucket.doc_count / totalTx) * 100 : 0;

    return NextResponse.json({
      id: userId,
      name: `User ${userId}`,
      summary: {
        total_volume: aggs.total_amount.value,
        avg_amount: aggs.avg_amount.value,
        max_amount: aggs.max_amount.value,
        min_amount: aggs.min_amount.value,
        tx_count: aggs.tx_count.value,
        total_credit: totalCredit,
        total_debit: totalDebit,
        credit_count: creditCount,
        debit_count: debitCount,
        net_flow: totalCredit - totalDebit,
        success_rate: successRate,
        currencies: aggs.currencies.buckets.map((b: any) => b.key),
      },
      charts: {
        by_category: aggs.by_category.buckets.map((b: any) => ({
          name: b.key,
          value: b.volume.value,
          count: b.doc_count,
        })),
        by_tran_type: aggs.by_tran_type.buckets.map((b: any) => ({
          name: b.key,
          value: b.volume.value,
          count: b.doc_count,
        })),
        by_payment_method: aggs.by_payment_method.buckets.map((b: any) => ({
          name: b.key,
          value: b.volume.value,
          count: b.doc_count,
        })),
        by_channel: aggs.by_channel.buckets.map((b: any) => ({
          name: b.key,
          value: b.volume.value,
          count: b.doc_count,
        })),
        by_status: aggs.by_status.buckets.map((b: any) => ({
          name: b.key,
          value: b.volume.value,
          count: b.doc_count,
        })),
        spend_over_time: aggs.spend_over_time.buckets.map((b: any) => ({
          date: b.key_as_string,
          volume: b.volume.value,
          credit: b.credit_vol.vol.value,
          debit: b.debit_vol.vol.value,
        })),
        top_merchants: aggs.top_merchants.buckets.map((b: any) => ({
          id: b.key,
          volume: b.volume.value,
          count: b.doc_count,
          category: b.category.buckets[0]?.key || 'Unknown',
        })),
      },
      transactions: recentTx.hits.hits.map(h => h._source)
    });

  } catch (error) {
    console.error("User Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
