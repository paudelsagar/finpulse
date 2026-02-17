import json
import os

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import DataTypes, EnvironmentSettings, StreamTableEnvironment
from pyflink.table.expressions import col, lit


def log_processing():
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

    # 3. Define Source Table (Kafka)
    t_env.execute_sql(
        """
        CREATE TABLE transactions (
            transactionId STRING,
            sourceId STRING,
            sourceName STRING,
            targetId STRING,
            targetName STRING,
            amount DECIMAL(10, 2),
            currency STRING,
            `timestamp` STRING,
            `type` STRING,
            category STRING,
            proctime AS PROCTIME()
        ) WITH (
            'connector' = 'kafka',
            'topic' = 'transactions',
            'properties.bootstrap.servers' = 'kafka:29092',
            'properties.group.id' = 'flink-processor-group',
            'scan.startup.mode' = 'latest-offset',
            'format' = 'json',
            'json.fail-on-missing-field' = 'false',
            'json.ignore-parse-errors' = 'true'
        )
    """
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
            'hosts' = 'http://elasticsearch:9200',
            'index' = 'es_transactions'
        )
    """
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
            'hosts' = 'http://elasticsearch:9200',
            'index' = 'es_high_value'
        )
    """
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
            'hosts' = 'http://elasticsearch:9200',
            'index' = 'es_entity_flows'
        )
    """
    )

    statement_set = t_env.create_statement_set()

    statement_set.add_insert_sql(
        """
        INSERT INTO es_transactions
        SELECT 
            transactionId, sourceId, sourceName, targetId, targetName, amount, currency, `timestamp`, `type`, category
        FROM transactions
    """
    )

    statement_set.add_insert_sql(
        """
        INSERT INTO es_high_value
        SELECT 
            transactionId, sourceName, targetName, amount, `timestamp`
        FROM transactions
    """
    )

    statement_set.add_insert_sql(
        """
        INSERT INTO es_entity_flows
        SELECT sourceId, sourceName, amount * -1, 'DEBIT', `timestamp`, transactionId
        FROM transactions
        UNION ALL
        SELECT targetId, targetName, amount, 'CREDIT', `timestamp`, transactionId
        FROM transactions
    """
    )

    print("Submitting Flink Job...")
    statement_set.execute()


if __name__ == "__main__":
    log_processing()
