#!/bin/bash

# Realtime Analytics Manager
# Usage: ./run.sh [COMMAND]

# Directories for logs and pids
mkdir -p logs pids

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

function show_help {
    echo "Realtime Analytics Manager"
    echo "Usage: ./run.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  infra       Start Docker infrastructure (Kafka, Flink, ES) in background"
    echo "  job         Submit Flink processing job"
    echo "  gen         Start Mock Data Generator (Background + Log)"
    echo "  ui          Start Next.js Dashboard (Background + Log)"
    echo "  all         Start Infra, Submit Job, Start Gen & UI"
    echo "  stop        Stop all processes and infrastructure"
    echo "  status      Check status of processes"
    echo "  logs [svc]  Tail logs for 'gen' or 'ui'"
    echo ""
}

if [ "$1" == "infra" ] || [ "$1" == "all" ] && [ "$1" == "infra" ]; then
    echo "Starting Docker Infrastructure..."
    docker compose up -d
    echo "Infrastructure started."

elif [ "$1" == "stop" ]; then
    echo "Stopping components..."
    
    # Stop Generator
    if [ -f pids/datagen.pid ]; then
        kill $(cat pids/datagen.pid) 2>/dev/null
        rm pids/datagen.pid
        echo "Data Generator stopped."
    fi

    # Stop UI
    if [ -f pids/frontend.pid ]; then
        kill $(cat pids/frontend.pid) 2>/dev/null
        rm pids/frontend.pid
        echo "Dashboard stopped."
    fi

    echo "Stopping Docker Infrastructure..."
    docker compose down
    echo "All stopped."

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

    # Run in background
    nohup python3 -u main.py > ../../logs/datagen.log 2>&1 &
    PID=$!
    echo $PID > ../../pids/datagen.pid
    echo "Data Generator started (PID: $PID). Logs: logs/datagen.log"
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

elif [ "$1" == "all" ]; then
    ./run.sh infra
    wait_for_es
    wait_for_kafka
    
    echo "Preparing Kafka topics..."
    docker exec kafka kafka-topics --create --if-not-exists --topic transactions --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
    
    echo ""
    
    ./run.sh job
    ./run.sh gen
    ./run.sh ui
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
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "flink|kafka|es|zoo"

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
