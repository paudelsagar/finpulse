#!/bin/bash

# Realtime Analytics Manager
# Usage: ./run.sh [COMMAND]

# Directories for logs and pids
mkdir -p logs pids

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

function wait_for_es {
    echo "Waiting for Elasticsearch to be ready..."
    MAX_RETRIES=30
    COUNT=0
    until curl -s http://localhost:9200 >/dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
        sleep 2
        COUNT=$((COUNT + 1))
    done
    if [ $COUNT -eq $MAX_RETRIES ]; then echo "ES Timeout"; exit 1; fi
    echo "Elasticsearch is up."
}

function wait_for_kafka {
    echo "Waiting for Kafka to be ready..."
    MAX_RETRIES=30
    COUNT=0
    until docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list >/dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
        sleep 2
        COUNT=$((COUNT + 1))
    done
    if [ $COUNT -eq $MAX_RETRIES ]; then echo "Kafka Timeout"; exit 1; fi
    echo "Kafka is up."
}

function wait_for_clickhouse {
    echo "Waiting for ClickHouse to be ready..."
    MAX_RETRIES=30
    COUNT=0
    until curl -s http://localhost:8123/ping | grep -q "Ok" || [ $COUNT -eq $MAX_RETRIES ]; do
        sleep 2
        COUNT=$((COUNT + 1))
    done
    if [ $COUNT -eq $MAX_RETRIES ]; then echo "ClickHouse Timeout"; exit 1; fi
    echo "ClickHouse is up."
}

function wait_for_flink {
    echo "Waiting for Flink JobManager to be ready..."
    MAX_RETRIES=30
    COUNT=0
    until curl -s http://localhost:8081 >/dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
        sleep 2
        COUNT=$((COUNT + 1))
    done
    if [ $COUNT -eq $MAX_RETRIES ]; then echo "Flink Timeout"; exit 1; fi
    echo "Flink JobManager is up."
}


function show_help {
    echo "Realtime Analytics Manager"
    echo "Usage: ./run.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start Infra, Submit Job, Start Gen & UI (Same as 'all')"
    echo "  stop        Stop all processes and infrastructure"
    echo "  restart     Stop then Start"
    echo "  status      Check status of processes"
    echo "  clean-start Stop, Wipe Data (Volumes), then Start"
    echo "  logs [svc]  Tail logs for 'gen' or 'ui'"
    echo ""
    echo "  infra       Start Docker infrastructure only"
    echo "  job         Submit Flink processing job only"
    echo "  gen         Start Mock Data Generator only"
    echo "  ui          Start Next.js Dashboard only"
    echo ""
}

# Helper to stop processes safely
function stop_process {
    PID_FILE=$1
    NAME=$2
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null; then
            kill $PID 2>/dev/null
            echo "$NAME stopped (PID: $PID)."
        else
            echo "$NAME was not running (Stale PID)."
        fi
        rm "$PID_FILE"
    fi
    # Fallback to pkill just in case
    pkill -f "$3" 2>/dev/null
}

if [ "$1" == "infra" ]; then
    echo "Starting Docker Infrastructure..."
    docker compose up -d
    echo "Infrastructure started."

elif [ "$1" == "stop" ]; then
    echo "Stopping components..."
    
    stop_process "pids/datagen.pid" "Data Generator" "main.py"
    stop_process "pids/backfill.pid" "Backfill Generator" "backfill.py"
    stop_process "pids/frontend.pid" "Dashboard" "next-server"

    echo "Stopping Docker Infrastructure..."
    docker compose down
    echo "All stopped."

elif [ "$1" == "clean-start" ]; then
    $0 stop
    echo "Wiping Docker volumes..."
    docker compose down -v
    echo "Data wiped."
    $0 start

elif [ "$1" == "restart" ]; then
    $0 stop
    $0 start

elif [ "$1" == "job" ]; then
    echo "Submitting Flink Job..."
    docker exec jobmanager ./bin/flink run -py /opt/flink/backend/flink-processor/processor.py -d
    echo "Job submitted."

elif [ "$1" == "gen" ]; then
    echo "Starting Data Generator (Background)..."
    cd backend/datagen
    
    # Activate venv if needed
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    # Run in background with host-reachable broker
    nohup env KAFKA_BROKER=localhost:9092 python3 -u main.py > ../../logs/datagen.log 2>&1 &
    PID=$!
    echo $PID > ../../pids/datagen.pid
    echo "Data Generator started (PID: $PID). Logs: logs/datagen.log"
    cd ../..

elif [ "$1" == "backfill" ]; then
    echo "Starting Backfill Generator (Background)..."
    cd backend/datagen
    
    # Activate venv if needed
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    # Run in background with host-reachable broker
    nohup env KAFKA_BROKER=localhost:9092 python3 -u backfill.py > logs/backfill.log 2>&1 &
    PID=$!
    echo $PID > ../../pids/backfill.pid
    echo "Backfill Generator started (PID: $PID). Logs: logs/backfill.log"
    cd ../..

elif [ "$1" == "ui" ]; then
    echo "Starting Dashboard (Background)..."
    cd frontend
    
    # Run in background
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    PID=$!
    echo $PID > ../pids/frontend.pid
    echo "Dashboard started (PID: $PID). Logs: logs/frontend.log"
    cd ..

elif [ "$1" == "all" ] || [ "$1" == "start" ]; then
    # Ensure Jars exist
    if [ ! "$(ls -A jars/*.jar 2>/dev/null)" ]; then
        echo "Flink Jars missing. Downloading..."
        python3 download_jars.py
    fi

    $0 infra
    wait_for_es
    wait_for_kafka
    wait_for_flink
    
    echo "Preparing Kafka topics..."
    docker exec kafka kafka-topics --create --if-not-exists --topic ${KAFKA_TOPIC:-fin-v1} --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
    docker exec kafka kafka-topics --create --if-not-exists --topic ${KAFKA_TOPIC:-fin-v1}-normalized --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
    
    echo "Preparing Elasticsearch indices..."
    # Transactions Index
    curl -X PUT "http://localhost:9200/es_transactions" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "tran_date": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "ts": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "amount": { "type": "float" },
          "balance": { "type": "float" },
          "merchant_category": { "type": "keyword" },
          "tran_type": { "type": "keyword" },
          "currency": { "type": "keyword" },
          "user_id": { "type": "keyword" },
          "account_id": { "type": "keyword" },
          "counterparty_user_id": { "type": "keyword" },
          "counterparty_account_id": { "type": "keyword" },
          "merchant_id": { "type": "keyword" },
          "payment_method": { "type": "keyword" },
          "mcc_code": { "type": "keyword" },
          "channel": { "type": "keyword" },
          "tran_status": { "type": "keyword" },
          "ref_tran_id": { "type": "keyword" },
          "is_credit": { "type": "boolean" },
          "created_at": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "tran_id": { "type": "keyword" },
           "remark": { 
             "type": "text",
             "fields": {
               "keyword": { "type": "keyword", "ignore_above": 256 }
             }
           }
        }
      }
    }' 2>/dev/null

    # High Value Alerts Index
    curl -X PUT "http://localhost:9200/es_high_value" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "tran_date": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "amount": { "type": "float" },
          "user_id": { "type": "keyword" },
          "tran_id": { "type": "keyword" }
        }
      }
    }' 2>/dev/null

    # Entity Flows Index
    curl -X PUT "http://localhost:9200/es_entity_flows" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "tran_date": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "amount": { "type": "float" },
          "entity_id": { "type": "keyword" },
          "flow_type": { "type": "keyword" },
          "tran_id": { "type": "keyword" }
        }
      }
    }' 2>/dev/null

    # Daily Rollup Index
    curl -X PUT "http://localhost:9200/es_daily_stats" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "window_start": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "total_volume": { "type": "float" },
          "tx_count": { "type": "long" },
          "avg_amount": { "type": "float" },
          "unique_users": { "type": "long" }
        }
      }
    }' 2>/dev/null

    # Monthly Rollup Index
    curl -X PUT "http://localhost:9200/es_monthly_stats" -H 'Content-Type: application/json' -d'
    {
      "mappings": {
        "properties": {
          "window_start": { "type": "date", "format": "yyyy-MM-dd HH:mm:ss||strict_date_optional_time||epoch_millis" },
          "total_volume": { "type": "float" },
          "tx_count": { "type": "long" },
          "avg_amount": { "type": "float" },
          "unique_users": { "type": "long" }
        }
      }
    }' 2>/dev/null
    
    wait_for_clickhouse

    echo "Preparing ClickHouse tables..."
    # Create finpulse database and transactions table
    docker exec clickhouse clickhouse-client --query "CREATE DATABASE IF NOT EXISTS finpulse"
    docker exec clickhouse clickhouse-client --query "
    CREATE TABLE IF NOT EXISTS finpulse.transactions (
        tran_id String,
        tran_date String,
        user_id String,
        account_id String,
        counterparty_user_id String,
        counterparty_account_id String,
        merchant_id String,
        merchant_category String,
        mcc_code String,
        tran_type String,
        payment_method String,
        amount Decimal(12, 2),
        balance Decimal(12, 2),
        currency String,
        remark String,
        channel String,
        tran_status String,
        ref_tran_id String,
        is_credit UInt8,
        created_at String,
        ts DateTime64(3)
    ) ENGINE = MergeTree()
    ORDER BY (ts, tran_id)"

    # Create Kafka Engine Table
    docker exec clickhouse clickhouse-client --query "
    CREATE TABLE IF NOT EXISTS finpulse.kafka_transactions (
        tran_id String,
        tran_date String,
        user_id String,
        account_id String,
        counterparty_user_id String,
        counterparty_account_id String,
        merchant_id String,
        merchant_category String,
        mcc_code String,
        tran_type String,
        payment_method String,
        amount Decimal(12, 2),
        balance Decimal(12, 2),
        currency String,
        remark String,
        channel String,
        tran_status String,
        ref_tran_id String,
        is_credit UInt8,
        created_at String,
        ts DateTime64(3)
    ) ENGINE = Kafka
    SETTINGS kafka_broker_list = '${KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}',
             kafka_topic_list = '${KAFKA_TOPIC:-fin-v1}-normalized',
             kafka_group_name = 'clickhouse-group',
             kafka_format = 'JSONEachRow',
             kafka_num_consumers = 1"

    # Create Materialized View to sync Kafka -> Transactions
    docker exec clickhouse clickhouse-client --query "
    CREATE MATERIALIZED VIEW IF NOT EXISTS finpulse.kafka_to_transactions TO finpulse.transactions AS
    SELECT * FROM finpulse.kafka_transactions"

    echo ""
    
    $0 job
    $0 gen
    $0 ui
    echo "Full stack is running properly."

elif [ "$1" == "status" ]; then
    echo "--- Status ---"
    
    if [ -f pids/datagen.pid ] && ps -p $(cat pids/datagen.pid) > /dev/null; then
        echo "Data Generator: RUNNING (PID: $(cat pids/datagen.pid))"
    else
        echo "Data Generator: STOPPED"
    fi

    if [ -f pids/frontend.pid ] && ps -p $(cat pids/frontend.pid) > /dev/null; then
        echo "Dashboard:      RUNNING (PID: $(cat pids/frontend.pid))"
    else
        echo "Dashboard:      STOPPED"
    fi

    echo ""
    echo "Docker Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "flink|kafka|es|zoo|clickhouse"

elif [ "$1" == "logs" ]; then
    if [ "$2" == "gen" ]; then
        tail -f logs/datagen.log
    elif [ "$2" == "ui" ]; then
        tail -f logs/frontend.log
    else
        echo "Usage: ./run.sh logs [gen|ui]"
    fi

else
    show_help
fi
