import { Client } from '@elastic/elasticsearch';
import { NextResponse } from 'next/server';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const range = searchParams.get('range') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const skip = (page - 1) * limit;

  // Calculate Start Time from range if provided
  let isoRangeStart = '';
  if (range && range !== 'all') {
    const now = Date.now();
    let startTime = now - 15 * 60 * 1000; 
    switch (range) {
      case '15m': startTime = now - 15 * 60 * 1000; break;
      case '1h': startTime = now - 60 * 60 * 1000; break;
      case '24h': startTime = now - 24 * 60 * 60 * 1000; break;
      case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
      case '365d': startTime = now - 365 * 24 * 60 * 60 * 1000; break;
    }
    isoRangeStart = new Date(startTime).toISOString();
  }
  const isoRangeEnd = (range === 'custom' && endDate) ? new Date(endDate).toISOString() : new Date().toISOString();

  try {
    const must: any[] = [];
    const filter: any[] = [];

    if (search) {
      must.push({
        bool: {
          should: [
            { match_phrase_prefix: { "transactionId.keyword": search } },
            { match_phrase_prefix: { "sourceName.keyword": search } },
            { match_phrase_prefix: { "targetName.keyword": search } },
            { match_phrase_prefix: { "category.keyword": search } }
          ],
          minimum_should_match: 1
        }
      });
    }

    if (type) {
      filter.push({ term: { "type.keyword": type } });
    }
    if (category) {
      filter.push({ term: { "category.keyword": category } });
    }

    if (isoRangeStart) {
      filter.push({ range: { ts: { gte: isoRangeStart, lte: isoRangeEnd } } });
    } else if (startDate || endDate) {
      const rangeQ: any = {};
      if (startDate) rangeQ.gte = startDate;
      if (endDate) rangeQ.lte = endDate;
      filter.push({ range: { ts: rangeQ } });
    }

    const query = {
      bool: {
        must: must.length > 0 ? must : { match_all: {} },
        filter
      }
    };

    const results = await client.search({
      index: 'es_transactions',
      from: skip,
      size: limit,
      track_total_hits: true,
      query,
      sort: [
        { ts: { order: 'desc' } }
      ],
      aggs: {
        total_volume: { sum: { field: 'amount' } },
        by_type: { terms: { field: 'type.keyword' } },
        available_categories: { terms: { field: 'category.keyword', size: 20 } },
        available_types: { terms: { field: 'type.keyword' } }
      }
    });

    const total = typeof results.hits.total === 'number' 
      ? results.hits.total 
      : results.hits.total?.value || 0;

    const transactions = results.hits.hits.map((hit: any) => ({
      _id: hit._id,
      ...hit._source
    }));

    const stats = results.aggregations as any;

    return NextResponse.json({
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        total_volume: stats.total_volume.value,
        categories: stats.available_categories.buckets.map((b: any) => b.key),
        types: stats.available_types.buckets.map((b: any) => b.key)
      },
      distribution: stats.by_type.buckets.map((b: any) => ({
        name: b.key,
        value: b.doc_count
      }))
    });
  } catch (error) {
    console.error("Transaction List Error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
