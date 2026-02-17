import json
import os
import random
import time
from datetime import datetime, timedelta, timezone

from faker import Faker
from kafka import KafkaProducer

# Configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
TOPIC_NAME = os.getenv("TOPIC_NAME", "fin_v1")

fake = Faker()

# Pre-defined Merchants
MERCHANTS = [
    {"id": "m_uber", "name": "Uber", "category": "Transport"},
    {"id": "m_starbucks", "name": "Starbucks", "category": "Food & Drink"},
    {"id": "m_amazon", "name": "Amazon", "category": "Shopping"},
    {"id": "m_netflix", "name": "Netflix", "category": "Entertainment"},
    {"id": "m_apple", "name": "Apple Store", "category": "Electronics"},
]

USERS = [{"id": f"u_{i}", "name": fake.name()} for i in range(1, 101)]


def create_producer():
    attempt = 0
    while attempt < 10:
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
            print(f"Connected to Kafka at {KAFKA_BROKER}")
            return producer
        except Exception as e:
            print(f"Waiting for Kafka... ({e})")
            time.sleep(5)
            attempt += 1
    print("Could not connect to Kafka")
    return None


def backfill(years=10):
    producer = create_producer()
    if not producer:
        return

    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=years * 365)

    current_date = start_date
    print(f"Starting backfill from {start_date} to {end_date}...")

    # For historical data, we'll send daily aggregates or a subset of transactions
    # To avoid overloading Kafka in a demo, we'll send 10 transactions per day
    while current_date < end_date:
        for _ in range(10):
            tx_type = random.choices(["P2P", "P2M"], weights=[0.4, 0.6])[0]
            sender = random.choice(USERS)

            if tx_type == "P2P":
                receiver = random.choice([u for u in USERS if u["id"] != sender["id"]])
                category = "Transfer"
                target_name = receiver["name"]
                target_id = receiver["id"]
            else:
                merchant = random.choice(MERCHANTS)
                category = merchant["category"]
                target_name = merchant["name"]
                target_id = merchant["id"]

            amount = round(random.lognormvariate(3, 1), 2)
            if random.random() < 0.01:
                amount = round(random.uniform(5001, 15000), 2)

            tx = {
                "transactionId": fake.uuid4(),
                "sourceId": sender["id"],
                "sourceName": sender["name"],
                "targetId": target_id,
                "targetName": target_name,
                "amount": amount,
                "currency": "USD",
                "ts_str": current_date.strftime("%Y-%m-%d %H:%M:%S"),
                "type": tx_type,
                "category": category,
            }
            producer.send(TOPIC_NAME, tx)

        if current_date.day == 1:
            print(f"Processed month: {current_date.strftime('%Y-%m')}")
            producer.flush()  # Flush periodically

        current_date += timedelta(days=1)

    producer.flush()
    producer.close()
    print("Backfill complete.")


if __name__ == "__main__":
    backfill(years=10)
