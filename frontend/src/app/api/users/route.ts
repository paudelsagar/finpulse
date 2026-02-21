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

  // Calculate Start Time matching dashboard logic
  const now = Date.now();
  let startTime = now - 15 * 60 * 1000; 
  let endTime = now;
  let interval = '1m'; // Default interval

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
        // For custom range, interval needs to be determined dynamically or set to a default
        // For simplicity, let's keep a default or calculate based on duration if needed.
        // For now, we'll keep the last set interval or a sensible default.
        // A more robust solution would calculate interval based on (endTime - startTime)
        interval = '1h'; // Default for custom, can be refined
        break;
    }
  }
  
  const localStart = formatLocalDate(new Date(startTime));
  const localEnd = formatLocalDate(new Date(endTime));

  try {
    const results = await client.search({
      index: 'es_entity_flows',
      size: 0,
      query: { 
        range: { tran_date: { gte: localStart, lte: localEnd } }
      },
      aggs: {
        unique_users: {
          terms: {
            field: 'entity_id',
            size: 5000 
          },
          aggs: {
            flows: {
              terms: { field: 'flow_type' },
              aggs: {
                total: { sum: { field: 'amount' } }
              }
            }
          }
        }
      }
    });

    const aggs = results.aggregations as any;
    const allUsers = aggs.unique_users.buckets.map((b: any) => {
        const flows = b.flows.buckets;
        const credit = flows.find((f: any) => f.key === 'CREDIT')?.total.value || 0;
        const debit = Math.abs(flows.find((f: any) => f.key === 'DEBIT')?.total.value || 0);

        return {
            id: b.key,
            name: `User ${b.key}`,
            total_spent: debit,
            total_received: credit,
            tx_count: b.doc_count
        };
    });

    const paginatedUsers = allUsers.slice(skip, skip + limit);

    // Add Trend Aggregation (scoped by time)
    const trendResults = await client.search({
      index: 'es_entity_flows',
      size: 0,
      query: {
        range: { tran_date: { gte: localStart, lte: localEnd } }
      },
      aggs: {
        activity_trend: {
          date_histogram: {
            field: 'tran_date',
            fixed_interval: interval,
            min_doc_count: 0,
            extended_bounds: {
              min: localStart,
              max: localEnd
            }
          },
          aggs: {
            volume: { sum: { field: 'amount' } }
          }
        }
      }
    });

    const trendAggs = trendResults.aggregations as any;

    const globalStats = allUsers.reduce((acc: any, u: any) => ({
        total_spent: acc.total_spent + u.total_spent,
        total_received: acc.total_received + u.total_received,
        total_txs: acc.total_txs + u.tx_count
    }), { total_spent: 0, total_received: 0, total_txs: 0 });

    const topSpender = allUsers.length > 0 
        ? [...allUsers].sort((a,b) => b.total_spent - a.total_spent)[0]
        : null;

    const rankings = {
        top_by_volume: [...allUsers]
            .sort((a,b) => b.total_spent - a.total_spent)
            .slice(0, 5)
            .map(u => ({ id: u.id, name: u.name, value: u.total_spent })),
        top_by_count: [...allUsers]
            .sort((a,b) => b.tx_count - a.tx_count)
            .slice(0, 5)
            .map(u => ({ id: u.id, name: u.name, value: u.tx_count })),
        top_by_revenue: [...allUsers]
            .sort((a,b) => b.total_received - a.total_received)
            .slice(0, 5)
            .map(u => ({ id: u.id, name: u.name, value: u.total_received }))
    };

    return NextResponse.json({
      data: paginatedUsers,
      total: allUsers.length,
      page,
      limit,
      totalPages: Math.ceil(allUsers.length / limit),
      global: {
        ...globalStats,
        avg_tx: globalStats.total_txs > 0 ? globalStats.total_spent / globalStats.total_txs : 0,
        top_spender: topSpender?.name || 'N/A'
      },
      rankings,
      trend: trendAggs.activity_trend.buckets.map((b: any) => ({
        time: b.key_as_string,
        amount: b.volume.value,
        count: b.doc_count
      }))
    });
  } catch (error) {
    console.error("User List Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
