import json
import os
import random
import time
import uuid
from datetime import datetime, timedelta

from faker import Faker
from kafka import KafkaProducer

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
TOPIC_NAME = os.getenv("KAFKA_TOPIC", "fin-transaction")

fake = Faker()

TRAN_TYPES = ["P2P", "P2M", "M2P", "B2B", "SELF"]
PAYMENT_METHODS = ["QR", "IBFT", "WALLET", "BANK_TRANSFER", "CARD"]
CHANNELS = ["Mobile", "Web", "POS", "API"]
CURRENCIES = ["NPR", "USD"]
MERCHANTS = [
    {"id": "600123456", "cat": "TRAVEL", "mcc": "4121"},
    {"id": "600654321", "cat": "FOOD", "mcc": "5812"},
    {"id": "600987654", "cat": "GROCERY", "mcc": "5411"},
]

USERS = [
    f"9841{str(i).zfill(6)}" for i in range(1, 100)
]  # Smaller pool for backfill speed


def create_producer():
    try:
        return KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER],
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
        )
    except Exception as e:
        print(f"Error connecting to Kafka: {e}")
        return None


def main():
    producer = create_producer()
    if not producer:
        return

    end_date = datetime.now()
    start_date = end_date - timedelta(days=3 * 365)  # 3 Years ago

    print(f"Backfilling data from {start_date} to {end_date}...")

    current_date = start_date
    current_date_ts = int(current_date.timestamp())
    end_date_ts = int(end_date.timestamp())

    tx_count = 0
    batch = []

    # Iterate day by day
    while current_date < end_date:
        # Generate 3-8 txs per day
        daily_txs = random.randint(3, 8)

        for _ in range(daily_txs):
            tx_time = current_date + timedelta(seconds=random.randint(0, 86400))
            if tx_time > end_date:
                break

            user_id = random.choice(USERS)
            tran_type = random.choice(TRAN_TYPES)
            amount = round(random.uniform(10, 5000), 2)

            tx = {
                "tran_id": str(uuid.uuid4()),
                "tran_date": tx_time.strftime("%Y-%m-%d %H:%M:%S"),
                "user_id": user_id,
                "account_id": f"01{user_id[4:]}",
                "counterparty_user_id": random.choice(USERS),
                "counterparty_account_id": "0199999999",
                "tran_type": tran_type,
                "payment_method": random.choice(PAYMENT_METHODS),
                "merchant_id": MERCHANTS[0]["id"] if tran_type == "P2M" else None,
                "merchant_category": (
                    MERCHANTS[0]["cat"] if tran_type == "P2M" else None
                ),
                "mcc_code": MERCHANTS[0]["mcc"] if tran_type == "P2M" else None,
                "is_credit": False,
                "amount": float(amount),
                "balance": 10000.0,
                "currency": "NPR",
                "remark": "Backfill",
                "channel": random.choice(CHANNELS),
                "tran_status": "SUCCESS",
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            producer.send(TOPIC_NAME, tx)
            tx_count += 1

        current_date += timedelta(days=1)

        if tx_count % 1000 == 0:
            print(f"Sent {tx_count} transactions... (Current: {current_date.date()})")
            producer.flush()

    producer.flush()
    print(f"Backfill complete! Sent {tx_count} transactions.")
    producer.close()


if __name__ == "__main__":
    main()
