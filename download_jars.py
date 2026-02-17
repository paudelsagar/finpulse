import os
import urllib.request

JARS = [
    # Kafka Connector
    "https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-kafka/3.0.1-1.18/flink-sql-connector-kafka-3.0.1-1.18.jar",
    # Elasticsearch 7 Connector (Matched to Flink 1.18)
    "https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-elasticsearch7/3.0.0-1.18/flink-sql-connector-elasticsearch7-3.0.0-1.18.jar",
]


os.makedirs("jars", exist_ok=True)

for url in JARS:
    filename = os.path.join("jars", url.split("/")[-1])
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, filename)
        print(f"Saved to {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")
