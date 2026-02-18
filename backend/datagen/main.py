import json
import os
import random
import time
import uuid
from datetime import datetime

from faker import Faker
from kafka import KafkaProducer

# Configuration
KAFKA_BROKER = os.getenv(
    "KAFKA_BROKER", os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
)
TOPIC_NAME = os.getenv("KAFKA_TOPIC", "fin-transaction")
SLEEP_TIME = float(os.getenv("SLEEP_TIME", "0.01"))
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))

fake = Faker()

# Constants / Enums
TRAN_TYPES = ["P2P", "P2M", "M2P", "B2B", "SELF"]
PAYMENT_METHODS = ["QR", "IBFT", "WALLET", "BANK_TRANSFER", "CARD"]
CHANNELS = ["Mobile", "Web", "POS", "API"]
STATUSES = ["SUCCESS", "FAILED", "PENDING", "REVERSED"]
CURRENCIES = ["NPR", "USD"]

MERCHANT_CATEGORIES = [
    "FOOD",
    "GROCERY",
    "TRAVEL",
    "UTILITIES",
    "EDUCATION",
    "HEALTH",
    "ELECTRONICS",
    "FASHION",
    "ENTERTAINMENT",
    "AUTOMOTIVE",
    "CONSTRUCTION",
    "FINANCE",
    "GOVERNMENT",
    "HOSPITALITY",
    "REAL_ESTATE",
    "IT_SERVICES",
    "INSURANCE",
    "NON_PROFIT",
    "RETAIL",
]

# Comprehensive List of Realistic Merchants (Nepal + Intl Context)
MERCHANTS = [
    # TRAVEL
    {"id": "m_uber", "cat": "TRAVEL", "mcc": "4121"},
    {"id": "m_pathao", "cat": "TRAVEL", "mcc": "4121"},
    {"id": "m_indriver", "cat": "TRAVEL", "mcc": "4121"},
    {"id": "m_tootle", "cat": "TRAVEL", "mcc": "4121"},
    {"id": "m_buddha_air", "cat": "TRAVEL", "mcc": "4511"},
    {"id": "m_yeti_airlines", "cat": "TRAVEL", "mcc": "4511"},
    {"id": "m_shree_airlines", "cat": "TRAVEL", "mcc": "4511"},
    {"id": "m_sajha_yatayat", "cat": "TRAVEL", "mcc": "4111"},
    # FOOD
    {"id": "m_starbucks", "cat": "FOOD", "mcc": "5812"},
    {"id": "m_mcdonalds", "cat": "FOOD", "mcc": "5814"},
    {"id": "m_kfc", "cat": "FOOD", "mcc": "5814"},
    {"id": "m_pizza_hut", "cat": "FOOD", "mcc": "5814"},
    {"id": "m_bhoj_deals", "cat": "FOOD", "mcc": "5812"},
    {"id": "m_foodmandu", "cat": "FOOD", "mcc": "5812"},
    {"id": "m_nandos", "cat": "FOOD", "mcc": "5812"},
    {"id": "m_bakery_cafe", "cat": "FOOD", "mcc": "5812"},
    {"id": "m_himalayan_java", "cat": "FOOD", "mcc": "5812"},
    # GROCERY
    {"id": "m_daraz", "cat": "GROCERY", "mcc": "5411"},
    {"id": "m_bhatbhateni", "cat": "GROCERY", "mcc": "5411"},
    {"id": "m_bigmart", "cat": "GROCERY", "mcc": "5411"},
    {"id": "m_kirana", "cat": "GROCERY", "mcc": "5411"},
    {"id": "m_salesberry", "cat": "GROCERY", "mcc": "5411"},
    {"id": "m_kk_mart", "cat": "GROCERY", "mcc": "5411"},
    {"id": "m_local_tarkari", "cat": "GROCERY", "mcc": "5411"},
    # UTILITIES
    {"id": "m_nepal_electric", "cat": "UTILITIES", "mcc": "4900"},
    {"id": "m_khanepani", "cat": "UTILITIES", "mcc": "4900"},
    {"id": "m_worldlink", "cat": "UTILITIES", "mcc": "4814"},
    {"id": "m_vianet", "cat": "UTILITIES", "mcc": "4814"},
    {"id": "m_classic_tech", "cat": "UTILITIES", "mcc": "4814"},
    {"id": "m_ntc_topup", "cat": "UTILITIES", "mcc": "4814"},
    {"id": "m_ncell", "cat": "UTILITIES", "mcc": "4814"},
    {"id": "m_dishhome", "cat": "UTILITIES", "mcc": "4899"},
    # EDUCATION
    {"id": "m_kathmandu_uni", "cat": "EDUCATION", "mcc": "8220"},
    {"id": "m_tribhuvan_uni", "cat": "EDUCATION", "mcc": "8220"},
    {"id": "m_british_college", "cat": "EDUCATION", "mcc": "8220"},
    {"id": "m_deerwalk", "cat": "EDUCATION", "mcc": "8220"},
    {"id": "m_gems_school", "cat": "EDUCATION", "mcc": "8211"},
    {"id": "m_ullens", "cat": "EDUCATION", "mcc": "8211"},
    {"id": "m_udemy", "cat": "EDUCATION", "mcc": "8299"},
    {"id": "m_coursera", "cat": "EDUCATION", "mcc": "8299"},
    # HEALTH
    {"id": "m_norvic", "cat": "HEALTH", "mcc": "8062"},
    {"id": "m_grande", "cat": "HEALTH", "mcc": "8062"},
    {"id": "m_bir_hospital", "cat": "HEALTH", "mcc": "8062"},
    {"id": "m_hamro_patro_health", "cat": "HEALTH", "mcc": "8099"},
    {"id": "m_mediciti", "cat": "HEALTH", "mcc": "8062"},
    {"id": "m_nams", "cat": "HEALTH", "mcc": "8062"},
    {"id": "m_ciwec", "cat": "HEALTH", "mcc": "8062"},
    # ELECTRONICS
    {"id": "m_apple_store", "cat": "ELECTRONICS", "mcc": "5732"},
    {"id": "m_samsung_plaza", "cat": "ELECTRONICS", "mcc": "5732"},
    {"id": "m_logitech", "cat": "ELECTRONICS", "mcc": "5732"},
    {"id": "m_dell_store", "cat": "ELECTRONICS", "mcc": "5732"},
    {"id": "m_oliz_store", "cat": "ELECTRONICS", "mcc": "5732"},
    {"id": "m_neostore", "cat": "ELECTRONICS", "mcc": "5732"},
    # FASHION
    {"id": "m_zara", "cat": "FASHION", "mcc": "5651"},
    {"id": "m_goldstar", "cat": "FASHION", "mcc": "5661"},
    {"id": "m_sonam_gears", "cat": "FASHION", "mcc": "5651"},
    {"id": "m_adidas", "cat": "FASHION", "mcc": "5651"},
    {"id": "m_nike", "cat": "FASHION", "mcc": "5651"},
    {"id": "m_human_fit", "cat": "FASHION", "mcc": "5651"},
    {"id": "m_ufc_gym_gear", "cat": "FASHION", "mcc": "5651"},
    # ENTERTAINMENT
    {"id": "m_netflix", "cat": "ENTERTAINMENT", "mcc": "5735"},
    {"id": "m_qfx_cinemas", "cat": "ENTERTAINMENT", "mcc": "7832"},
    {"id": "m_spotify", "cat": "ENTERTAINMENT", "mcc": "5735"},
    {"id": "m_big_movies", "cat": "ENTERTAINMENT", "mcc": "7832"},
    {"id": "m_playstation", "cat": "ENTERTAINMENT", "mcc": "5816"},
    {"id": "m_steam_games", "cat": "ENTERTAINMENT", "mcc": "5816"},
    {"id": "m_wonderland", "cat": "ENTERTAINMENT", "mcc": "7996"},
    # AUTOMOTIVE
    {"id": "m_sipradi", "cat": "AUTOMOTIVE", "mcc": "5511"},
    {"id": "m_yamaha", "cat": "AUTOMOTIVE", "mcc": "5571"},
    {"id": "m_honda", "cat": "AUTOMOTIVE", "mcc": "5571"},
    {"id": "m_byd_nepal", "cat": "AUTOMOTIVE", "mcc": "5511"},
    {"id": "m_tata_motors", "cat": "AUTOMOTIVE", "mcc": "5511"},
    # CONSTRUCTION
    {"id": "m_sharma_const", "cat": "CONSTRUCTION", "mcc": "1521"},
    {"id": "m_raman_const", "cat": "CONSTRUCTION", "mcc": "1521"},
    {"id": "m_asian_paints", "cat": "CONSTRUCTION", "mcc": "5231"},
    {"id": "m_panchayaka", "cat": "CONSTRUCTION", "mcc": "1521"},
    # FINANCE
    {"id": "m_citizen_inv", "cat": "FINANCE", "mcc": "6211"},
    {"id": "m_nabil_invest", "cat": "FINANCE", "mcc": "6211"},
    {"id": "m_himalayan_cap", "cat": "FINANCE", "mcc": "6211"},
    {"id": "m_ime_pay", "cat": "FINANCE", "mcc": "6012"},
    {"id": "m_esewa", "cat": "FINANCE", "mcc": "6012"},
    {"id": "m_khalti", "cat": "FINANCE", "mcc": "6012"},
    # GOVERNMENT
    {"id": "m_ird_tax", "cat": "GOVERNMENT", "mcc": "9311"},
    {"id": "m_traffic_fine", "cat": "GOVERNMENT", "mcc": "9222"},
    {"id": "m_passport_off", "cat": "GOVERNMENT", "mcc": "9399"},
    {"id": "m_nea_bill", "cat": "GOVERNMENT", "mcc": "4900"},
    # HOSPITALITY
    {"id": "m_marriott", "cat": "HOSPITALITY", "mcc": "7011"},
    {"id": "m_hyatt_regency", "cat": "HOSPITALITY", "mcc": "7011"},
    {"id": "m_dwarikas", "cat": "HOSPITALITY", "mcc": "7011"},
    {"id": "m_oy_rooms", "cat": "HOSPITALITY", "mcc": "7011"},
    {"id": "m_agoda", "cat": "HOSPITALITY", "mcc": "4722"},
    # REAL ESTATE
    {"id": "m_brihat_group", "cat": "REAL_ESTATE", "mcc": "6513"},
    {"id": "m_housing_nepal", "cat": "REAL_ESTATE", "mcc": "6513"},
    # IT SERVICES
    {"id": "m_deerhold", "cat": "IT_SERVICES", "mcc": "7372"},
    {"id": "m_fusemachines", "cat": "IT_SERVICES", "mcc": "7372"},
    {"id": "m_cloudfactory", "cat": "IT_SERVICES", "mcc": "7372"},
    {"id": "m_logpoint", "cat": "IT_SERVICES", "mcc": "7372"},
    # INSURANCE
    {"id": "m_shikhar_ins", "cat": "INSURANCE", "mcc": "6300"},
    {"id": "m_himalayan_re", "cat": "INSURANCE", "mcc": "6300"},
    {"id": "m_life_ins_corp", "cat": "INSURANCE", "mcc": "6300"},
    # NON PROFIT
    {"id": "m_red_cross", "cat": "NON_PROFIT", "mcc": "8398"},
    {"id": "m_maiti_nepal", "cat": "NON_PROFIT", "mcc": "8398"},
    # RETAIL
    {"id": "m_miniso", "cat": "RETAIL", "mcc": "5331"},
    {"id": "m_ikea", "cat": "RETAIL", "mcc": "5712"},
]

# Pre-defined Users Pool for consistency
# Realistic User IDs: 10-digit mobile numbers (Nepal context: 9841xxxxxx)
# Increased to 10k users
USERS = [f"9841{str(i).zfill(6)}" for i in range(1, 10001)]

# Stateful balance tracking
# Initialize users with random starting balance
USER_BALANCES = {u: round(random.uniform(1000, 50000), 2) for u in USERS}


def create_producer():
    attempt = 0
    max_attempts = 30
    while attempt < max_attempts:
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                # Use a default serializer that handles Decimals and Datetimes if needed,
                # but here we convert to str/float before sending.
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            )
            print(f"Connected to Kafka at {KAFKA_BROKER}")
            return producer
        except Exception as e:
            print(f"Waiting for Kafka... ({e})")
            time.sleep(5)
            attempt += 1
    raise Exception("Could not connect to Kafka")


def generate_transaction():
    tran_type = random.choice(TRAN_TYPES)
    user_id = random.choice(USERS)

    # Realistic Account ID: 14-digit bank account number
    # Use a deterministic seed from user_id to keep account ID consistent for a user
    # Format: 001000...
    random.seed(user_id)  # Temp seed for consistency
    account_suffix = str(random.randint(1000000000, 9999999999))
    account_id = f"01{account_suffix}"[:14]
    random.seed()  # Reset seed

    # Initialize defaults
    counterparty_user_id = None
    counterparty_account_id = None
    merchant_id = None
    merchant_category = None
    mcc_code = None

    # Logic based on transaction type
    if tran_type == "P2P":
        counterparty_user_id = random.choice([u for u in USERS if u != user_id])
        # Generate consistent account for counterparty
        random.seed(counterparty_user_id)
        cp_acc_suffix = str(random.randint(1000000000, 9999999999))
        counterparty_account_id = f"01{cp_acc_suffix}"[:14]
        random.seed()

    elif tran_type == "P2M":
        merchant = random.choice(MERCHANTS)
        # Merchant IDs are realistic (PAN/VAT: 9 digits)
        # But we keys in MERCHANTS list are 'm_uber'.
        # Let's keep internal ID map or generate realistic ID on fly but mapping might break if not consistent.
        # Ideally MERCHANTS list should have realistic IDs.
        # For now, let's strip 'm_' and prepend '600' to make it look like PAN if it was numeric,
        # but since it's text 'm_uber', let's just use it?
        # User requested realistic IDs.
        # Let's map 'm_uber' -> '600123456' consistently.
        merchant_id_seed = int(str(hash(merchant["id"]))[-8:])
        merchant_id = f"600{merchant_id_seed}"  # Simulation of 9-digit PAN

        merchant_category = merchant["cat"]
        mcc_code = merchant["mcc"]
        counterparty_account_id = f"02{merchant_id}001"  # Merchant Account

    elif tran_type == "SELF":
        counterparty_user_id = user_id
        # Self transfer to secondary account (e.g. savings)
        random.seed(user_id + "savings")
        saved_suffix = str(random.randint(1000000000, 9999999999))
        counterparty_account_id = f"01{saved_suffix}"[:14]
        random.seed()

    elif tran_type == "B2B":
        # Simplified B2B logic
        merchant = random.choice(MERCHANTS)
        merchant_id_seed = int(str(hash(merchant["id"]))[-8:])
        merchant_id = f"600{merchant_id_seed}"

        merchant_category = merchant["cat"]
        mcc_code = merchant["mcc"]
        counterparty_account_id = f"02{merchant_id}001"

    elif tran_type == "M2P":
        # Merchant refunding a user
        merchant = random.choice(MERCHANTS)
        merchant_id_seed = int(str(hash(merchant["id"]))[-8:])
        merchant_id = f"600{merchant_id_seed}"

        merchant_category = merchant["cat"]
        mcc_code = merchant["mcc"]

        counterparty_user_id = random.choice(USERS)

    # Financials
    # Ensure amount is less than current balance for debits (mostly)
    current_balance = USER_BALANCES[user_id]

    # Determine credit/debit based on flow type usually
    # P2P: Debit sender
    # P2M: Debit sender
    # M2P: Credit user (User receiving refund/payout)
    # SELF: usually neutral or debit one acc/credit another. sticking to simple single-view.

    is_credit = False  # Default: Money leaving user's main wallet
    if tran_type == "M2P":
        is_credit = True
    elif tran_type == "B2B":
        # B2B doesn't involve 'user_id' as main actor usually?
        # But our schema forces user_id. Let's say user initiates B2B payment.
        is_credit = False

    # Random override for variety if not strict
    # But to be historically bound, we should stick to logical flow.
    # Let's say 95% follows logic, 5% is some adjustment/refund.
    if random.random() < 0.05:
        is_credit = not is_credit

    max_spend = current_balance if not is_credit else 50000
    if max_spend < 10:
        max_spend = 10  # Avoid stuck at 0

    amount = round(random.uniform(10, min(5000, max_spend)), 2)

    # Simulate high value
    if random.random() < 0.02 and max_spend > 5000:
        amount = round(random.uniform(5000, min(25000, max_spend)), 2)

    # Update Balance
    if is_credit:
        USER_BALANCES[user_id] = round(current_balance + amount, 2)
    else:
        USER_BALANCES[user_id] = round(current_balance - amount, 2)

    final_balance = USER_BALANCES[user_id]

    status = random.choices(STATUSES, weights=[0.85, 0.1, 0.03, 0.02])[0]

    # Revert balance if failed/reversed?
    # For simplicity of data gen, we can say balance is 'post-transaction attempt'.
    # Or strict: only update if success.
    # Let's keep it simple: Real-time systems often hold balance then release.
    # If FAILED, we should technically revert.
    if status in ["FAILED", "REVERSED"]:
        # Revert the balance change
        if is_credit:
            USER_BALANCES[user_id] = round(final_balance - amount, 2)
        else:
            USER_BALANCES[user_id] = round(final_balance + amount, 2)
        final_balance = USER_BALANCES[user_id]

    ref_tran_id = None
    if status == "REVERSED" or random.random() < 0.01:
        ref_tran_id = str(uuid.uuid4())

    return {
        "tran_id": str(uuid.uuid4()),
        "tran_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_id": user_id,
        "account_id": account_id,
        "counterparty_user_id": counterparty_user_id,
        "counterparty_account_id": counterparty_account_id,
        "tran_type": tran_type,
        "payment_method": random.choice(PAYMENT_METHODS),
        "merchant_id": merchant_id,
        "merchant_category": merchant_category,
        "mcc_code": mcc_code,
        "is_credit": is_credit,
        "amount": float(amount),  # Convert decimal to float for JSON
        "balance": float(final_balance),
        "currency": random.choice(CURRENCIES),
        "remark": fake.sentence(nb_words=3),
        "channel": random.choice(CHANNELS),
        "tran_status": status,
        "ref_tran_id": ref_tran_id,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def main():
    producer = create_producer()
    print(
        f"Starting legacy-compatible schema generator (main1.py) to topic '{TOPIC_NAME}'..."
    )

    try:
        while True:
            batch = [generate_transaction() for _ in range(BATCH_SIZE)]

            for tx in batch:
                producer.send(TOPIC_NAME, tx)

            # Flush only after the batch is sent
            producer.flush()

            # Print only the first transaction of the batch to reduce console spam
            first = batch[0]
            print(
                f"Sent batch of {BATCH_SIZE}: {first['tran_type']} {first['currency']} {first['amount']} | {first['tran_status']} ..."
            )
            time.sleep(SLEEP_TIME)
    except KeyboardInterrupt:
        print("\nStopping data generator...")
        producer.close()


if __name__ == "__main__":
    main()
