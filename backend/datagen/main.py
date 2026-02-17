import json
import os
import random
import time
from datetime import datetime, timezone

from faker import Faker
from kafka import KafkaProducer

# Configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
TOPIC_NAME = os.getenv("TOPIC_NAME", "fin_v1")
SLEEP_TIME = float(os.getenv("SLEEP_TIME", "0.01"))  # 100 tx/sec default

fake = Faker()

# Pre-defined Merchants for P2M
MERCHANTS = [
    {"id": "m_uber", "name": "Uber", "category": "Transport"},
    {"id": "m_starbucks", "name": "Starbucks", "category": "Food & Drink"},
    {"id": "m_amazon", "name": "Amazon", "category": "Shopping"},
    {"id": "m_netflix", "name": "Netflix", "category": "Entertainment"},
    {"id": "m_spotify", "name": "Spotify", "category": "Entertainment"},
    {"id": "m_apple", "name": "Apple Store", "category": "Electronics"},
    {"id": "m_walmart", "name": "Walmart", "category": "Shopping"},
    {"id": "m_mcdonalds", "name": "McDonalds", "category": "Food & Drink"},
    {"id": "m_airbnb", "name": "Airbnb", "category": "Travel"},
]

# Pre-defined Users Pool (Simulating active user base)
USERS = [{"id": f"u_{i}", "name": fake.name()} for i in range(1, 1001)]


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
    raise Exception("Could not connect to Kafka")


def generate_transaction():
    tx_type = random.choices(["P2P", "P2M"], weights=[0.4, 0.6])[0]

    sender = random.choice(USERS)

    if tx_type == "P2P":
        receiver = random.choice([u for u in USERS if u["id"] != sender["id"]])
        category = "Transfer"
        target_name = receiver["name"]
        target_id = receiver["id"]
    else:  # P2M
        merchant = random.choice(MERCHANTS)
        category = merchant["category"]
        target_name = merchant["name"]
        target_id = merchant["id"]

    # Weighted amount generation
    # Most transactions are small, some are large
    amount = round(random.lognormvariate(3, 1), 2)
    if amount < 1:
        amount = 1.00
    if amount > 5000:
        amount = 5000.00

    # Simulate high value fraud/alerts more frequently for demo
    if random.random() < 0.02:
        amount = round(random.uniform(5001, 25000), 2)

    return {
        "transactionId": fake.uuid4(),
        "sourceId": sender["id"],
        "sourceName": sender["name"],
        "targetId": target_id,
        "targetName": target_name,
        "amount": amount,
        "currency": "USD",
        "ts_str": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "type": tx_type,
        "category": category,
    }


def main():
    producer = create_producer()
    print(f"Starting data generation to topic '{TOPIC_NAME}'...")

    try:
        while True:
            tx = generate_transaction()
            producer.send(TOPIC_NAME, tx)
            producer.flush()
            print(
                f"Sent: {tx['type']} ${tx['amount']} -> {tx['targetName']} ts={tx['ts_str']}"
            )
            time.sleep(SLEEP_TIME)
    except KeyboardInterrupt:
        print("\nStopping data generator...")
        producer.close()


if __name__ == "__main__":
    main()
