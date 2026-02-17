"""
FinPulse Flink Processor
------------------------
This module defines the Flink streaming job for the FinPulse analytics platform.
It performs ingestion from Kafka, executes real-time transformations, and sinks
data into multiple Elasticsearch indices for downstream visualization.
"""

import json
import os

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import DataTypes, EnvironmentSettings, StreamTableEnvironment
from pyflink.table.expressions import col, lit


def log_processing():
    """
    Configure and execute the Flink streaming pipeline.

    This function initializes the StreamExecutionEnvironment and TableEnvironment,
    sets up the necessary Kafka and Elasticsearch connectors, defines the SQL
    transformations for raw transactions, high-value alerts, and entity flows,
    and finally submits the job to the Flink cluster.

    Notes
    -----
    The processor relies on external JAR files for Kafka and Elasticsearch
    connectors, which are expected to be located in '/opt/flink/lib_extra'.

    The following sinks are populated:
    - es_transactions: Raw transaction records.
    - es_high_value: Transactions exceeding a specific value threshold.
    - es_entity_flows: Bidirectional credit/debit records per entity.
    """
    # 1. Setup Environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(1)

    # Use Table Environment (SQL API is easier for JSON/Kafka/ES)
    settings = EnvironmentSettings.new_instance().in_streaming_mode().build()
    t_env = StreamTableEnvironment.create(env, environment_settings=settings)

    # 2. Add Jars (Loaded from /opt/flink/lib_extra in Docker)
    kafka_jar = os.environ.get("KAFKA_JAR", "flink-sql-connector-kafka-3.0.1-1.18.jar")
    es_jar = os.environ.get(
        "ES_JAR", "flink-sql-connector-elasticsearch7-3.0.1-1.17.jar"
    )

    jar_path = (
        f"file:///opt/flink/lib_extra/{kafka_jar};file:///opt/flink/lib_extra/{es_jar}"
    )

    t_env.get_config().get_configuration().set_string(
        "pipeline.jars",
        jar_path,
    )

    # 3. Infrastructure Configuration
    kafka_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
    es_hosts = os.environ.get("ELASTICSEARCH_HOSTS", "http://elasticsearch:9200")

    # 3. Define Source Table (Kafka)
    t_env.execute_sql(
        """
        CREATE TABLE transactions (
            transactionId STRING,
            sourceId STRING,
            sourceName STRING,
            targetId STRING,
            targetName STRING,
            amount DECIMAL(12, 2),
            currency STRING,
            ts_str STRING, -- Raw string from JSON
            `type` STRING,
            category STRING,
            ts AS TO_TIMESTAMP(ts_str, 'yyyy-MM-dd HH:mm:ss'), -- Convert to TIMESTAMP
            WATERMARK FOR ts AS ts - INTERVAL '5' SECOND -- Handle out-of-order events
        ) WITH (
            'connector' = 'kafka',
            'topic' = 'fin_v1',
            'properties.bootstrap.servers' = '{kafka_servers}',
            'properties.group.id' = 'flink-processor-group-v2',
            'scan.startup.mode' = 'earliest-offset',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """.format(
            kafka_servers=kafka_servers
        )
    )

    # 4. Define Sink Table (Elasticsearch) - Raw Transactions
    t_env.execute_sql(
        """
        CREATE TABLE es_transactions (
            transactionId STRING,
            sourceId STRING,
            sourceName STRING,
            targetId STRING,
            targetName STRING,
            amount DECIMAL(10, 2),
            currency STRING,
            ts STRING,
            `type` STRING,
            category STRING
        ) WITH (
            'connector' = 'elasticsearch-7',
            'hosts' = '{es_hosts}',
            'index' = 'es_transactions'
        )
    """.format(
            es_hosts=es_hosts
        )
    )

    # 5. Define Sink Table (Elasticsearch) - Aggregated High Value Alerts
    # We will just sink high value transactions to a separate index for now
    t_env.execute_sql(
        """
        CREATE TABLE es_high_value (
            transactionId STRING,
            sourceName STRING,
            targetName STRING,
            amount DECIMAL(10, 2),
            ts STRING
        ) WITH (
            'connector' = 'elasticsearch-7',
            'hosts' = '{es_hosts}',
            'index' = 'es_high_value'
        )
    """.format(
            es_hosts=es_hosts
        )
    )

    # 6. Define Sink Table (Elasticsearch) - Entity Flows (Debits/Credits)
    t_env.execute_sql(
        """
        CREATE TABLE es_entity_flows (
            entityId STRING,
            entityName STRING,
            amount DECIMAL(10, 2),
            flow_type STRING, -- 'DEBIT' or 'CREDIT'
            ts STRING,
            transactionId STRING
        ) WITH (
            'connector' = 'elasticsearch-7',
            'hosts' = '{es_hosts}',
            'index' = 'es_entity_flows'
        )
    """.format(
            es_hosts=es_hosts
        )
    )

    # 7. Define Sink Table (Elasticsearch) - Daily Rollups
    t_env.execute_sql(
        """
        CREATE TABLE es_daily_stats (
            window_start TIMESTAMP(3),
            total_volume DECIMAL(12, 2),
            tx_count BIGINT,
            avg_amount DECIMAL(12, 2),
            unique_users BIGINT
        ) WITH (
            'connector' = 'elasticsearch-7',
            'hosts' = '{es_hosts}',
            'index' = 'es_daily_stats'
        )
    """.format(
            es_hosts=es_hosts
        )
    )

    # 8. Define Sink Table (Elasticsearch) - Monthly Rollups
    t_env.execute_sql(
        """
        CREATE TABLE es_monthly_stats (
            window_start TIMESTAMP(3),
            total_volume DECIMAL(12, 2),
            tx_count BIGINT,
            avg_amount DECIMAL(12, 2),
            unique_users BIGINT
        ) WITH (
            'connector' = 'elasticsearch-7',
            'hosts' = '{es_hosts}',
            'index' = 'es_monthly_stats'
        )
    """.format(
            es_hosts=es_hosts
        )
    )

    statement_set = t_env.create_statement_set()

    # Define proctime transactions table for windowing
    # Note: Using watermarks would be better for event-time, but sticking to proctime for consistency for now
    # However, for 10-year historical backfill, we MUST use Event Time.
    # Let's refactor the source to include Watermarks.

    statement_set.add_insert_sql(
        """
        INSERT INTO es_transactions
        SELECT 
            transactionId, 
            sourceId, 
            sourceName, 
            targetId, 
            targetName, 
            amount, 
            currency, 
            ts_str, 
            `type`, 
            category
        FROM transactions
    """
    )

    statement_set.add_insert_sql(
        """
        INSERT INTO es_high_value
        SELECT 
            transactionId, 
            sourceName, 
            targetName, 
            amount, 
            ts_str
        FROM transactions
        WHERE amount > 5000
    """
    )

    statement_set.add_insert_sql(
        """
        INSERT INTO es_entity_flows
        SELECT sourceId, sourceName, -amount, 'DEBIT', ts_str, transactionId
        FROM transactions
        UNION ALL
        SELECT targetId, targetName, amount, 'CREDIT', ts_str, transactionId
        FROM transactions
    """
    )

    # 10. Daily Rollups
    statement_set.add_insert_sql(
        """
        INSERT INTO es_daily_stats
        SELECT 
            TUMBLE_START(ts, INTERVAL '1' DAY) as window_start,
            SUM(amount) as total_volume,
            COUNT(*) as tx_count,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT sourceId) as unique_users
        FROM transactions
        GROUP BY TUMBLE(ts, INTERVAL '1' DAY)
    """
    )

    # 11. Monthly Rollups
    statement_set.add_insert_sql(
        """
        INSERT INTO es_monthly_stats
        SELECT 
            TUMBLE_START(ts, INTERVAL '30' DAY) as window_start,
            SUM(amount) as total_volume,
            COUNT(*) as tx_count,
            AVG(amount) as avg_amount,
            COUNT(DISTINCT sourceId) as unique_users
        FROM transactions
        GROUP BY TUMBLE(ts, INTERVAL '30' DAY)
    """
    )

    print("Submitting Flink Job...")
    statement_set.execute()


if __name__ == "__main__":
    log_processing()
