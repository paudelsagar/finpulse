import { queryClickHouse } from '@/lib/clickhouse';
import { formatLocalDate } from '@/lib/utils';
import { Client } from '@elastic/elasticsearch';
import { NextResponse } from 'next/server';

const esPort = process.env.ES_PORT || '9200';
const esUrl = process.env.ELASTICSEARCH_URL || `http://127.0.0.1:${esPort}`;

const client = new Client({
  node: esUrl
});

function getHeatmapConfig(range: string) {
    // Determine Heatmap Grid Strategy
    switch (range) {
        case '5m': return { interval: '10s', range: 'now-5m', format: 'yyyy-MM-dd HH:mm:ss' }; // Granular for 5m
        case '15m': return { interval: '1m', range: 'now-15m', format: 'yyyy-MM-dd HH:mm:ss' };
        case '1h': return { interval: '1m', range: 'now-1h', format: 'yyyy-MM-dd HH:mm:ss' };
        case '24h': return { interval: '1h', range: 'now-24h', format: 'yyyy-MM-dd HH:mm' };
        case '7d': return { interval: '1d', range: 'now-7d/d', format: 'yyyy-MM-dd HH:mm' }; // Less granular for 7d overview
        case '30d': return { interval: '1d', range: 'now-30d/d', format: 'yyyy-MM-dd HH:mm' };
        case '3M': return { interval: '1d', range: 'now-90d/d', format: 'yyyy-MM-dd' };
        case '6M': return { interval: '7d', range: 'now-180d/d', format: 'yyyy-MM-dd' };
        case '365d': return { interval: '7d', range: 'now-365d/d', format: 'yyyy-MM-dd' };
        case '3y': return { interval: '30d', range: 'now-3y/y', format: 'yyyy-MM-dd' };
        case 'all': return { interval: '30d', range: 'now-10y', format: 'yyyy-MM-dd' };
        default: return { interval: '1d', range: 'now-30d/d', format: 'yyyy-MM-dd HH:mm' };
    }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '15m';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const tab = searchParams.get('tab') || 'overview';

  // Calculate Start Time
  const now = Date.now();
  let startTime = now - 15 * 60 * 1000; // default 15m
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
        // Global independent stats (e.g. Heatmap always shows last 60d)
        // Global independent stats
        activity_context: {
           filter: {
             range: {
               ts: { gte: getHeatmapConfig(range).range }
             }
           },
           aggs: {
             heatmap: {
                date_histogram: {
                  field: 'ts',
                  fixed_interval: getHeatmapConfig(range).interval,
                  format: getHeatmapConfig(range).format
                },
                aggs: {
                  volume: { sum: { field: 'amount' } }
                }
             }
           }
        },

        // Global KPIs (Always needed)
        total_volume: { sum: { field: 'amount' } },
        active_users: { cardinality: { field: 'user_id' } },
        tps_window: {
          filter: {
            range: {
              ts: { gte: "now-1m" }
            }
          }
        },

        // Overview Tab
        ...(tab === 'overview' ? {
             volume_over_time: {
                date_histogram: {
                  field: 'ts',
                  fixed_interval: interval
                },
                aggs: {
                  volume: { sum: { field: 'amount' } },
                  avg_amount: { avg: { field: 'amount' } },
                  statuses: {
                    filters: {
                      filters: {
                        success: { term: { tran_status: 'SUCCESS' } },
                        failed: { term: { tran_status: 'FAILED' } }
                      }
                    }
                  }
                }
             },
             // Small Alert Fetch
        } : {}),

        // Network Health Tab
        ...(tab === 'network' ? {
            rail_reliability: {
              terms: { field: 'payment_method' },
              aggs: {
                success_count: { filter: { term: { tran_status: 'SUCCESS' } } },
                failed_count: { filter: { term: { tran_status: 'FAILED' } } }
              }
            },
            by_channel: { 
              terms: { field: 'channel' },
              aggs: {
                statuses: {
                  terms: { field: 'tran_status' }
                }
              }
            },
            by_status: { terms: { field: 'tran_status' } },
            by_type: { 
              terms: { field: 'tran_type' },
              aggs: {
                total_spent: { sum: { field: 'amount' } }
              }
            },
            reversal_stats: {
              filter: { exists: { field: 'ref_tran_id' } },
              aggs: {
                total_reversals: { sum: { field: 'amount' } }
              }
            }
        } : {}),

        // Financials Tab
        ...(tab === 'financials' ? {
             volume_over_time: {
                date_histogram: {
                  field: 'ts',
                  fixed_interval: interval
                },
                aggs: {
                   liquidity: { sum: { field: 'balance' } },
                   flows: {
                    filters: {
                      filters: {
                        credits: { term: { is_credit: true } },
                        debits: { term: { is_credit: false } }
                      }
                    },
                    aggs: {
                      volume: { sum: { field: 'amount' } }
                    }
                  }
                }
             },
             amount_distribution: {
              range: {
                field: 'amount',
                ranges: [
                  { to: 100, key: "Small (0-100)" },
                  { from: 100, to: 1000, key: "Medium (100-1K)" },
                  { from: 1000, to: 10000, key: "Large (1K-10K)" },
                  { from: 10000, key: "Whale (10K+)" }
                ]
              }
            },
            by_currency: { terms: { field: 'currency' } },
            reversal_stats: {
              filter: { exists: { field: 'ref_tran_id' } },
              aggs: {
                total_reversals: { sum: { field: 'amount' } }
              }
            }
        } : {}),

        // Demographics Tab
        ...(tab === 'demographics' ? {
             volume_over_time: {
                date_histogram: {
                  field: 'ts',
                  fixed_interval: interval
                },
                aggs: {
                   active_users: { cardinality: { field: 'user_id' } }
                }
             },
             top_mcc: {
              terms: {
                field: 'mcc_code',
                size: 10,
                order: { _count: "desc" }
              },
              aggs: {
                 avg_amount: { avg: { field: 'amount' } },
                 total_volume: { sum: { field: 'amount' } }
              }
            },
            top_recipients: {
              terms: {
                field: 'counterparty_user_id',
                size: 5,
                order: { _count: "desc" },
                missing: "Merchant/System"
              }
            },
            top_accounts: {
              terms: {
                field: 'account_id',
                size: 5,
                order: { _count: "desc" }
              }
            }
        } : {}),

        // Executive Tab
        ...(tab === 'executive' ? {
             merchant_integrity: {
              terms: { field: 'merchant_id', size: 50 },
              aggs: {
                total_volume: { sum: { field: 'amount' } },
                success_count: { filter: { term: { tran_status: 'SUCCESS' } } }
              }
            },
            by_type: { 
              terms: { field: 'tran_type' },
              aggs: {
                total_spent: { sum: { field: 'amount' } }
              }
            },
            top_remarks: {
              terms: { 
                field: 'remark.keyword', 
                size: 15,
                exclude: [".*", "payment", "for", "the", "and", "with", "from"] 
              }
            },
            top_merchants_by_volume: { 
              terms: { 
                field: 'merchant_id', 
                size: 5,
                order: { total_spent: "desc" }
              },
              aggs: {
                total_spent: { sum: { field: 'amount' } }
              }
            },
            top_merchants_by_count: { 
              terms: { 
                field: 'merchant_id', 
                size: 5,
                order: { _count: "desc" }
              },
              aggs: {
                total_spent: { sum: { field: 'amount' } }
              }
            }
        } : {})
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
    // 4. Get High Value Alerts
    const highValueAlerts = await client.search({
      index: 'es_high_value',
      sort: [{ 'tran_date': 'desc' }],
      size: 5,
      query: {
         range: {
             tran_date: { gte: localStart }
         }
      }
    });

    const tps = (aggregations.tps_window?.doc_count || 0) / 60;

    // 5. IF range >= 30d, supplement with ClickHouse for deep history (Optional refinement)
    // For now, we use ES as primary, but if the range is '365d' or 'all', 
    // we could swap specific aggregations here.
    if (range === '6M' || range === '365d' || range === '3y' || range === 'all') {
       try {
         const chStats = await getStatsFromClickHouse(localStart, localEnd, interval);
         // Merge or overwrite specific expensive stats
         if (aggregations.volume_over_time) {
            aggregations.volume_over_time.buckets = chStats.volume_over_time;
         }
       } catch (e) {
         console.error("ClickHouse supplement failed, falling back to ES only:", e);
       }
    }

    return NextResponse.json({
      recent: recentTx.hits.hits.map(h => h._source),
      stats: aggregations,
      total_count: (aggs.hits.total as any).value || 0,
      active_users: aggregations.active_users?.value || 0,
      tps: parseFloat(tps.toFixed(2)),
      last_event_ts: (recentTx.hits.hits[0]?._source as any)?.ts || null,
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

async function getStatsFromClickHouse(start: string, end: string, interval: string) {
  // Map Flink interval to ClickHouse toStartOf* functions
  let timeFunc = 'toStartOfMinute';
  if (interval.includes('h')) timeFunc = 'toStartOfHour';
  if (interval.includes('d')) timeFunc = 'toStartOfDay';

  const query = `
    SELECT 
        ${timeFunc}(ts) as key_as_string,
        sum(amount) as volume
    FROM transactions
    WHERE ts >= '${start}' AND ts <= '${end}'
    GROUP BY key_as_string
    ORDER BY key_as_string ASC
  `;
  
  const rows = await queryClickHouse<any>(query);
  return {
    volume_over_time: rows.map((r: { key_as_string: string; volume: string }) => ({
      key_as_string: r.key_as_string,
      volume: { value: parseFloat(r.volume) }
    }))
  };
}
