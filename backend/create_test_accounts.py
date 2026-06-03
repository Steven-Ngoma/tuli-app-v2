import psycopg2
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

def h(p): return hashlib.sha256(p.encode()).hexdigest()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Test Seller — Market Vendor
cur.execute("SELECT id FROM sellers WHERE phone = %s", ('0971000001',))
if not cur.fetchone():
    cur.execute("""
        INSERT INTO sellers (name, shop_name, phone, email, location, password, shop_type)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, ('Chanda Mwale', 'Chanda Fresh Market', '0971000001', None, 'Lusaka - Kamwala Market', h('test1234'), 'product'))
    print("Test seller created")
else:
    print("Test seller already exists")

# Test Driver — Motorbike
cur.execute("SELECT id FROM drivers WHERE phone = %s", ('0972000001',))
if not cur.fetchone():
    cur.execute("""
        INSERT INTO drivers (name, phone, zone, vehicle, password, online)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, ('Bwalya Tembo', '0972000001', 'Lusaka Central', 'Motorbike', h('driver1234'), 1))
    print("Test driver created")
else:
    print("Test driver already exists")

conn.commit()
cur.close()
conn.close()
print("\n--- LOGIN DETAILS ---")
print("SELLER  | Phone: 0971000001 | Password: test1234")
print("DRIVER  | Phone: 0972000001 | Password: driver1234")
