"""
FinPulse Flink Processor
------------------------
This module defines the Flink streaming job for the FinPulse analytics platform.
It performs ingestion from Kafka, executes real-time transformations, and sinks
data into multiple Elasticsearch indices for downstream visualization.
"""

import json
import os
import sys

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
        self.kafka_topic = os.environ.get("KAFKA_TOPIC", "fin-v1")
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

        Notes
        -----
        The JSON structure is expected to have a "transaction" key containing
        the mapping definitions.
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
            self.field_mapping = {
                "transactionId": "transactionId",
                "sourceId": "sourceId",
                "sourceName": "sourceName",
                "targetId": "targetId",
                "targetName": "targetName",
                "amount": "amount",
                "currency": "currency",
                "ts_str": "ts_str",
                "type": "type",
                "category": "category",
            }

    def _define_source(self):
        """
        Define the Kafka source table using Flink SQL.

        Creates a table named 'transactions' that consumes JSON data from
        the configured Kafka topic.
        """
        # 3. Define Source Table (Kafka) - RAW Schema from main.py
        # Must match the fields produced by main.py
        self.t_env.execute_sql(
            """
            CREATE TABLE transactions (
                transactionId STRING,
                sourceId STRING,
                sourceName STRING,
                targetId STRING,
                targetName STRING,
                amount DECIMAL(12, 2),
                currency STRING,
                ts_str STRING,
                type STRING,
                category STRING,
                ts AS TO_TIMESTAMP(ts_str, 'yyyy-MM-dd HH:mm:ss'), -- Convert to TIMESTAMP
                WATERMARK FOR ts AS ts - INTERVAL '5' SECOND -- Handle out-of-order events
            ) WITH (
                'connector' = 'kafka',
                'topic' = '{kafka_topic}',
                'properties.bootstrap.servers' = '{kafka_servers}',
                'properties.group.id' = 'flink-processor-group-v3',
                'scan.startup.mode' = 'earliest-offset',
                'format' = 'json',
                'json.fail-on-missing-field' = 'false',
                'json.ignore-parse-errors' = 'true'
            )
        """.format(
                kafka_servers=self.kafka_servers, kafka_topic=self.kafka_topic
            )
        )

    def _create_normalization_view(self):
        """
        Create a temporary view for normalized transactions.

        Dynamically builds a SQL SELECT query based on the loaded field mapping
        to transform raw data into a canonical format. Handles source aliasing,
        default values, and constants.
        """
        # 3.1 Create Canonical View (Normalization Logic)
        # Dynamically build SELECT clause based on JSON mapping
        select_clauses = []

        for canonical_field, mapping in self.field_mapping.items():
            if isinstance(mapping, str):
                # Compatibility for simple string mapping
                select_clauses.append(f"{mapping} AS {canonical_field}")
            elif isinstance(mapping, dict):
                if "constant" in mapping:
                    # Handle Constant: {"constant": "USD"}
                    val = mapping["constant"]
                    select_clauses.append(f"'{val}' AS {canonical_field}")
                else:
                    # Handle Source Mapping: {"source": "field", "default": "val"}
                    # Default to canonical_field if 'source' is missing but it's a dict
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
            FROM transactions
            """
        )

    def _define_sinks(self):
        """
        Define Elasticsearch sink tables.

        Creates tables for raw transactions, high-value alerts, entity flows,
        daily statistics, and monthly statistics.
        """
        # 4. Define Sink Table (Elasticsearch) - Raw Transactions
        self.t_env.execute_sql(
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
                es_hosts=self.es_hosts
            )
        )

        # 5. Define Sink Table (Elasticsearch) - Aggregated High Value Alerts
        self.t_env.execute_sql(
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
                es_hosts=self.es_hosts
            )
        )

        # 6. Define Sink Table (Elasticsearch) - Entity Flows (Debits/Credits)
        self.t_env.execute_sql(
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

    def _define_pipelines(self):
        """
        Define the data processing pipelines.

        Creates a statement set containing INSERT SQL statements that populate
        the sink tables from the canonical view.

        Returns
        -------
        StatementSet
            The Flink statement set containing the pipeline definitions.
        """
        statement_set = self.t_env.create_statement_set()

        # 9. Insert Statements
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
            FROM canonical_transactions
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
            FROM canonical_transactions
            WHERE amount > 5000
        """
        )

        statement_set.add_insert_sql(
            """
            INSERT INTO es_entity_flows
            SELECT sourceId, sourceName, -amount, 'DEBIT', ts_str, transactionId
            FROM canonical_transactions
            UNION ALL
            SELECT targetId, targetName, amount, 'CREDIT', ts_str, transactionId
            FROM canonical_transactions
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
                COUNT(DISTINCT sourceId) as unique_users
            FROM canonical_transactions
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
                COUNT(DISTINCT sourceId) as unique_users
            FROM canonical_transactions
            GROUP BY TUMBLE(ts, INTERVAL '30' DAY)
        """
        )

        return statement_set

    def run(self):
        """
        Execute the Flink job.

        Orchestrates the setup of the environment, sources, sinks, and pipelines,
        and then submits the job for execution.
        """
        self._setup_environment()
        self._load_mapping_config()
        self._define_source()
        self._create_normalization_view()
        self._define_sinks()
        pipeline = self._define_pipelines()

        print("Submitting Flink Job...")
        pipeline.execute()


if __name__ == "__main__":
    processor = FlinkProcessor()
    processor.run()
