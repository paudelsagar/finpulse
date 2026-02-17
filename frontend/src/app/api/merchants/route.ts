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

  // Calculate Start Time matching dashboard logic
  const now = Date.now();
  let startTime = now - 15 * 60 * 1000; 
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
  
  const isoStart = new Date(startTime).toISOString();
  const isoEnd = new Date(endTime).toISOString();

  try {
    const results = await client.search({
      index: 'es_entity_flows',
      size: 0,
      aggs: {
        by_id: {
          filter: {
            bool: {
              must: [
                { match_all: {} },
                { range: { ts: { gte: isoStart, lte: isoEnd } } }
              ]
            }
          },
          aggs: {
            ids: {
              terms: {
                field: 'entityId.keyword',
                size: 1000
              },
              aggs: {
                name: { terms: { field: 'entityName.keyword', size: 1 } },
                flows: {
                  terms: { field: 'flow_type.keyword' },
                  aggs: {
                    total: { sum: { field: 'amount' } },
                    tx_count: { value_count: { field: 'entityId.keyword' } }
                  }
                }
              }
            }
          }
        }
      }
    });

    const aggs = results.aggregations as any;
    const merchants = aggs.by_id.ids.buckets
      .filter((b: any) => b.key.startsWith('m_'))
      .map((b: any) => {
        const flows = b.flows.buckets;
        const credit = flows.find((f: any) => f.key === 'CREDIT')?.total.value || 0;
        const debit = Math.abs(flows.find((f: any) => f.key === 'DEBIT')?.total.value || 0);
        
        return {
          id: b.key,
          name: b.name.buckets[0]?.key || 'Unknown Merchant',
          total_revenue: credit,
          total_debit: debit,
          net_flow: credit - debit,
          tx_count: b.flows.buckets.reduce((acc: number, f: any) => acc + f.tx_count.value, 0),
          customer_count: 0
        };
      });

    const totalRevenue = merchants.reduce((acc: number, m: any) => acc + m.total_revenue, 0);
    const total = merchants.length;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const startIndex = (page - 1) * limit;
    const paginatedMerchants = merchants.slice(startIndex, startIndex + limit);

    const rankings = {
      top_by_volume: [...merchants]
        .sort((a,b) => b.net_flow - a.net_flow)
        .slice(0, 5)
        .map(m => ({ id: m.id, name: m.name, value: m.net_flow })),
      top_by_count: [...merchants]
        .sort((a,b) => b.tx_count - a.tx_count)
        .slice(0, 5)
        .map(m => ({ id: m.id, name: m.name, value: m.tx_count })),
      top_by_revenue: [...merchants]
        .sort((a,b) => b.total_revenue - a.total_revenue)
        .slice(0, 5)
        .map(m => ({ id: m.id, name: m.name, value: m.total_revenue }))
    };

    return NextResponse.json({
      data: paginatedMerchants,
      total_revenue: totalRevenue,
      total: total,
      page: page,
      limit: limit,
      rankings: rankings
    });
  } catch (error) {
    console.error("Merchant List Error:", error);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}
