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

  try {
    // 1. Fetch User Summary & Recent Transactions
    const recentTx = await client.search({
      index: 'es_transactions',
      query: {
        term: { "sourceId": userId }
      },
      sort: [{ "ts": "desc" }],
      size: 50
    });

    // 2. Aggregate Analytics for this User
    const analytics = await client.search({
      index: 'es_transactions',
      size: 0,
      query: {
        term: { "sourceId": userId }
      },
      aggs: {
        total_spent: { sum: { field: 'amount' } },
        avg_spent: { avg: { field: 'amount' } },
        tx_count: { value_count: { field: 'transactionId' } },
        by_category: {
          terms: { field: 'category', size: 10 },
          aggs: {
             volume: { sum: { field: 'amount' } }
          }
        },
        spend_over_time: {
          date_histogram: {
            field: 'ts',
            fixed_interval: '1d',
            min_doc_count: 0
          },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        }
      }
    });

    const aggs = analytics.aggregations as any;
    
    // Get user name from first transaction
    const userName = (recentTx.hits.hits[0]?._source as any)?.sourceName || 'Unknown User';

    return NextResponse.json({
      id: userId,
      name: userName,
      summary: {
        total_spent: aggs.total_spent.value,
        avg_spent: aggs.avg_spent.value,
        tx_count: aggs.tx_count.value
      },
      charts: {
        by_category: aggs.by_category.buckets.map((b: any) => ({
          name: b.key,
          value: b.volume.value
        })),
        spend_over_time: aggs.spend_over_time.buckets.map((b: any) => ({
          date: b.key_as_string,
          volume: b.volume.value
        }))
      },
      transactions: recentTx.hits.hits.map(h => h._source)
    });

  } catch (error) {
    console.error("User Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
