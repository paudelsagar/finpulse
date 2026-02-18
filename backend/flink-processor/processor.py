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
from pyflink.table import EnvironmentSettings, StreamTableEnvironment


class FlinkProcessor:
    """
    A Flink streaming job for the FinPulse analytics platform.

    This class encapsulates the logic for ingesting transaction data from Kafka,
    normalizing it using a configurable schema, and sinking the processed data
    into multiple Elasticsearch indices for real-time visualization.

    Attributes
    ----------
    env : StreamExecutionEnvironment
        The Flink stream execution environment.
    t_env : StreamTableEnvironment
        The Flink table environment for SQL operations.
    kafka_servers : str
        Bootstrap servers for the Kafka cluster (default: 'kafka:29092').
    kafka_topic : str
        Source Kafka topic name (default: 'fin-v1').
    es_hosts : str
        Elasticsearch host URL (default: 'http://elasticsearch:9200').
    field_mapping : dict
        Dictionary defining the mapping from source fields to canonical fields.
    """

    def __init__(self):
        """
        Initialize the FlinkProcessor with environment variables and default state.
        """
        self.env = None
        self.t_env = None
        self.kafka_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
        self.kafka_topic = os.environ.get("KAFKA_TOPIC", "fin-transaction")
        self.normalized_topic = f"{self.kafka_topic}-normalized"
        self.es_hosts = os.environ.get(
            "ELASTICSEARCH_HOSTS", "http://elasticsearch:9200"
        )
        self.field_mapping = {}

    def _setup_environment(self):
        """
        Set up the Flink execution environment and table environment.

        Configures parallelism and loads necessary JAR files for Kafka and
        Elasticsearch connectors from the local filesystem.
        """
        # 1. Setup Environment
        self.env = StreamExecutionEnvironment.get_execution_environment()
        self.env.set_parallelism(1)

        # Use Table Environment (SQL API is easier for JSON/Kafka/ES)
        settings = EnvironmentSettings.new_instance().in_streaming_mode().build()
        self.t_env = StreamTableEnvironment.create(
            self.env, environment_settings=settings
        )

        # 2. Add Jars (Loaded from /opt/flink/lib_extra in Docker)
        kafka_jar = os.environ.get(
            "KAFKA_JAR", "flink-sql-connector-kafka-3.0.1-1.18.jar"
        )
        es_jar = os.environ.get(
            "ES_JAR", "flink-sql-connector-elasticsearch7-3.0.1-1.17.jar"
        )
        jar_path = f"file:///opt/flink/lib_extra/{kafka_jar};file:///opt/flink/lib_extra/{es_jar}"

        self.t_env.get_config().get_configuration().set_string(
            "pipeline.jars",
            jar_path,
        )

    def _load_mapping_config(self):
        """
        Load field mapping configuration from a JSON file.

        Attempts to read 'source_mapping.json'. If the file is not found,
        it falls back to a default identity mapping.
        """
        # Load field mapping configuration
        try:
            # Use absolute path relative to this script file
            script_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(script_dir, "source_mapping.json")

            with open(config_path, "r", encoding="utf-8") as f:
                mapping_config = json.load(f)
                self.field_mapping = mapping_config.get("transaction", {})
        except FileNotFoundError:
            print(
                f"Warning: source_mapping.json not found at {config_path}. Using default identity mapping."
            )
            # Default to new schema fields identity mapping
            self.field_mapping = {
                "tran_id": "tran_id",
                "user_id": "user_id",
                "account_id": "account_id",
                "counterparty_user_id": "counterparty_user_id",
                "counterparty_account_id": "counterparty_account_id",
                "tran_type": "tran_type",
                "payment_method": "payment_method",
                "merchant_id": "merchant_id",
                "merchant_category": "merchant_category",
                "mcc_code": "mcc_code",
                "is_credit": "is_credit",
                "amount": "amount",
                "balance": "balance",
                "currency": "currency",
                "remark": "remark",
                "channel": "channel",
                "tran_status": "tran_status",
                "ref_tran_id": "ref_tran_id",
                "created_at": "created_at",
                "tran_date": "tran_date",
            }

    def _define_source(self):
        """
        Define the Kafka source table using Flink SQL.

        Creates a table named 'transactions' that consumes JSON data from
        the configured Kafka topic.
        """
        # 3. Define Raw Source Table (Kafka) - Source of truth
        self.t_env.execute_sql(
            """
            CREATE TABLE raw_transactions (
                tran_id STRING,
                tran_date STRING,
                user_id STRING,
                account_id STRING,
                counterparty_user_id STRING,
                counterparty_account_id STRING,
                tran_type STRING,
                payment_method STRING,
                merchant_id STRING,
                merchant_category STRING,
                mcc_code STRING,
                is_credit BOOLEAN,
                amount DECIMAL(12, 2),
                balance DECIMAL(12, 2),
                currency STRING,
                remark STRING,
                channel STRING,
                tran_status STRING,
                ref_tran_id STRING,
                created_at STRING,
                ts AS TO_TIMESTAMP(tran_date, 'yyyy-MM-dd HH:mm:ss'),
                WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
            ) WITH (
                'connector' = 'kafka',
                'topic' = '{kafka_topic}',
                'properties.bootstrap.servers' = '{kafka_servers}',
                'properties.group.id' = 'flink-processor-producer-group',
                'scan.startup.mode' = 'earliest-offset',
                'format' = 'json',
                'json.fail-on-missing-field' = 'false',
                'json.ignore-parse-errors' = 'true'
            )
        """.format(
                kafka_servers=self.kafka_servers, kafka_topic=self.kafka_topic
            )
        )

        # 3.1 Define Normalized Source Table (Kafka) - Consumer source for ES
        self.t_env.execute_sql(
            """
            CREATE TABLE normalized_source (
                tran_id STRING,
                tran_date STRING,
                user_id STRING,
                account_id STRING,
                counterparty_user_id STRING,
                counterparty_account_id STRING,
                merchant_id STRING,
                merchant_category STRING,
                mcc_code STRING,
                tran_type STRING,
                payment_method STRING,
                amount DECIMAL(12, 2),
                balance DECIMAL(12, 2),
                currency STRING,
                remark STRING,
                channel STRING,
                tran_status STRING,
                ref_tran_id STRING,
                is_credit BOOLEAN,
                created_at STRING,
                ts TIMESTAMP(3),
                WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
            ) WITH (
                'connector' = 'kafka',
                'topic' = '{normalized_topic}',
                'properties.bootstrap.servers' = '{kafka_servers}',
                'properties.group.id' = 'flink-processor-es-consumer-group',
                'scan.startup.mode' = 'earliest-offset',
                'format' = 'json'
            )
        """.format(
                kafka_servers=self.kafka_servers, normalized_topic=self.normalized_topic
            )
        )

    def _create_normalization_view(self):
        """
        Create a temporary view for normalized transactions.

        Dynamically builds a SQL SELECT query based on the loaded field mapping.
        """
        # 3.1 Create Canonical View (Normalization Logic)
        select_clauses = []

        for canonical_field, mapping in self.field_mapping.items():
            if isinstance(mapping, str):
                select_clauses.append(f"{mapping} AS {canonical_field}")
            elif isinstance(mapping, dict):
                if "constant" in mapping:
                    val = mapping["constant"]
                    select_clauses.append(f"'{val}' AS {canonical_field}")
                else:
                    source = mapping.get("source", canonical_field)
                    if "default" in mapping:
                        default_val = mapping["default"]
                        select_clauses.append(
                            f"COALESCE({source}, '{default_val}') AS {canonical_field}"
                        )
                    else:
                        select_clauses.append(f"{source} AS {canonical_field}")

        # Ensure 'ts' is always passed through for windowing
        select_clauses.append("ts")

        select_stmt = ", ".join(select_clauses)

        self.t_env.execute_sql(
            f"""
            CREATE TEMPORARY VIEW canonical_transactions AS
            SELECT 
                {select_stmt}
            FROM raw_transactions
            """
        )

    def _define_sinks(self):
        """
        Define Elasticsearch sink tables.
        """
        # 4. Define Sink Table (Elasticsearch) - Extended Transactions
        self.t_env.execute_sql(
            """
            CREATE TABLE es_transactions (
                tran_id STRING,
                tran_date STRING,
                user_id STRING,
                account_id STRING,
                counterparty_user_id STRING,
                counterparty_account_id STRING,
                merchant_id STRING,
                merchant_category STRING,
                mcc_code STRING,
                tran_type STRING,
                payment_method STRING,
                amount DECIMAL(12, 2),
                balance DECIMAL(12, 2),
                currency STRING,
                remark STRING,
                channel STRING,
                tran_status STRING,
                ref_tran_id STRING,
                is_credit BOOLEAN,
                created_at STRING,
                ts TIMESTAMP(3)
            ) WITH (
                'connector' = 'elasticsearch-7',
                'hosts' = '{es_hosts}',
                'index' = 'es_transactions'
            )
        """.format(
                es_hosts=self.es_hosts
            )
        )

        # 5. Define Sink Table (Elasticsearch) - Aggregated High Value Alerts
        # Adapted for new schema: using user_id instead of names
        self.t_env.execute_sql(
            """
            CREATE TABLE es_high_value (
                tran_id STRING,
                user_id STRING,
                amount DECIMAL(12, 2),
                tran_date STRING
            ) WITH (
                'connector' = 'elasticsearch-7',
                'hosts' = '{es_hosts}',
                'index' = 'es_high_value'
            )
        """.format(
                es_hosts=self.es_hosts
            )
        )

        # 6. Define Sink Table (Elasticsearch) - Entity Flows
        # Constructing flows from Payer -> Payee
        self.t_env.execute_sql(
            """
            CREATE TABLE es_entity_flows (
                entity_id STRING,
                amount DECIMAL(12, 2),
                flow_type STRING, -- 'DEBIT' or 'CREDIT'
                tran_date STRING,
                tran_id STRING
            ) WITH (
                'connector' = 'elasticsearch-7',
                'hosts' = '{es_hosts}',
                'index' = 'es_entity_flows'
            )
        """.format(
                es_hosts=self.es_hosts
            )
        )

        # 7. Define Sink Table (Elasticsearch) - Daily Rollups
        self.t_env.execute_sql(
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
                es_hosts=self.es_hosts
            )
        )

        # 8. Define Sink Table (Elasticsearch) - Monthly Rollups
        self.t_env.execute_sql(
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
                es_hosts=self.es_hosts
            )
        )

        # 9. Define Sink Table (Kafka Bridge for ClickHouse)
        # Sinks normalized data to a new topic which ClickHouse consumes natively
        self.t_env.execute_sql(
            """
            CREATE TABLE kafka_normalized (
                tran_id STRING,
                tran_date STRING,
                user_id STRING,
                account_id STRING,
                counterparty_user_id STRING,
                counterparty_account_id STRING,
                merchant_id STRING,
                merchant_category STRING,
                mcc_code STRING,
                tran_type STRING,
                payment_method STRING,
                amount DECIMAL(12, 2),
                balance DECIMAL(12, 2),
                currency STRING,
                remark STRING,
                channel STRING,
                tran_status STRING,
                ref_tran_id STRING,
                is_credit BOOLEAN,
                created_at STRING,
                ts TIMESTAMP(3)
            ) WITH (
                'connector' = 'kafka',
                'topic' = '{normalized_topic}',
                'properties.bootstrap.servers' = '{kafka_servers}',
                'format' = 'json'
            )
        """.format(
                kafka_servers=self.kafka_servers, normalized_topic=self.normalized_topic
            )
        )

    def _define_pipelines(self):
        """
        Define the data processing pipelines.
        """
        statement_set = self.t_env.create_statement_set()

        # --- PHASE 1: Producer (Normalize -> Kafka) ---
        statement_set.add_insert_sql(
            """
            INSERT INTO kafka_normalized
            SELECT 
                tran_id, tran_date, user_id, account_id, counterparty_user_id,
                counterparty_account_id, merchant_id, merchant_category, mcc_code,
                tran_type, payment_method, amount, balance, currency, remark,
                channel, tran_status, ref_tran_id, is_credit, created_at, ts
            FROM canonical_transactions
        """
        )

        # --- PHASE 2: Consumer (Kafka -> Elasticsearch) ---
        # All ES sinks now read from 'normalized_source' instead of 'canonical_transactions'

        statement_set.add_insert_sql(
            """
            INSERT INTO es_transactions
            SELECT 
                tran_id, tran_date, user_id, account_id, counterparty_user_id,
                counterparty_account_id, merchant_id, merchant_category, mcc_code,
                tran_type, payment_method, amount, balance, currency, remark,
                channel, tran_status, ref_tran_id, is_credit, created_at, ts
            FROM normalized_source
        """
        )

        statement_set.add_insert_sql(
            """
            INSERT INTO es_high_value
            SELECT 
                tran_id, user_id, amount, tran_date
            FROM normalized_source
            WHERE amount > 10000
        """
        )

        statement_set.add_insert_sql(
            """
            INSERT INTO es_entity_flows
            SELECT 
                user_id as entity_id, 
                -amount, 
                'DEBIT', 
                tran_date, 
                tran_id
            FROM normalized_source
            UNION ALL
            SELECT 
                COALESCE(merchant_id, counterparty_user_id) as entity_id, 
                amount, 
                'CREDIT', 
                tran_date, 
                tran_id
            FROM normalized_source
            WHERE COALESCE(merchant_id, counterparty_user_id) IS NOT NULL
        """
        )

        statement_set.add_insert_sql(
            """
            INSERT INTO es_daily_stats
            SELECT 
                TUMBLE_START(ts, INTERVAL '1' DAY) as window_start,
                SUM(amount) as total_volume,
                COUNT(*) as tx_count,
                AVG(amount) as avg_amount,
                COUNT(DISTINCT user_id) as unique_users
            FROM normalized_source
            GROUP BY TUMBLE(ts, INTERVAL '1' DAY)
        """
        )

        statement_set.add_insert_sql(
            """
            INSERT INTO es_monthly_stats
            SELECT 
                TUMBLE_START(ts, INTERVAL '30' DAY) as window_start,
                SUM(amount) as total_volume,
                COUNT(*) as tx_count,
                AVG(amount) as avg_amount,
                COUNT(DISTINCT user_id) as unique_users
            FROM normalized_source
            GROUP BY TUMBLE(ts, INTERVAL '30' DAY)
        """
        )

        return statement_set

    def run(self):
        """
        Execute the Flink job.
        """
        self._setup_environment()
        self._load_mapping_config()
        self._define_source()
        self._create_normalization_view()
        self._define_sinks()
        pipeline = self._define_pipelines()

        print("Submitting Flink Job (Extended Schema)...")
        pipeline.execute()


if __name__ == "__main__":
    processor = FlinkProcessor()
    processor.run()
