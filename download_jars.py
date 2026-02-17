import os
import urllib.request

from dotenv import load_dotenv

# Load configuration from .env
load_dotenv()

# Get JAR names from environment variables
KAFKA_JAR = os.getenv("KAFKA_JAR", "flink-sql-connector-kafka-3.0.1-1.18.jar")
ES_JAR = os.getenv("ES_JAR", "flink-sql-connector-elasticsearch7-3.0.1-1.17.jar")


def get_download_url(jar_name):
    # Determine which connector group it belongs to
    if "kafka" in jar_name:
        connector = "flink-sql-connector-kafka"
    elif "elasticsearch7" in jar_name:
        connector = "flink-sql-connector-elasticsearch7"
    else:
        return None

    # Extract version (assumes format connector-name-version.jar)
    version = jar_name.replace(f"{connector}-", "").replace(".jar", "")
    return f"https://repo.maven.apache.org/maven2/org/apache/flink/{connector}/{version}/{jar_name}"


JARS_MAPPING = {
    KAFKA_JAR: get_download_url(KAFKA_JAR),
    ES_JAR: get_download_url(ES_JAR),
}

os.makedirs("jars", exist_ok=True)

for jar_name, url in JARS_MAPPING.items():
    if not url:
        print(f"Skipping unknown JAR: {jar_name}")
        continue

    filename = os.path.join("jars", jar_name)
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, filename)
        print(f"Saved to {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")
