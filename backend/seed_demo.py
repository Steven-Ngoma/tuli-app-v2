"""
Run once to seed a demo seller + driver into Supabase.
  cd backend
  python seed_demo.py
"""
import psycopg2
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

def h(pw): return hashlib.sha256(pw.encode()).hexdigest()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

# Seller: Mama Grace's Kitchen at Kamwala Market, Lusaka
cur.execute("""
    INSERT INTO sellers (name, shop_name, phone, email, location, seller_lat, seller_lng, password, shop_type)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (phone) DO UPDATE SET
        seller_lat = EXCLUDED.seller_lat,
        seller_lng = EXCLUDED.seller_lng,
        shop_name  = EXCLUDED.shop_name
    RETURNING id, name, shop_name, phone, seller_lat, seller_lng
""", (
    "Grace Banda",
    "Mama Grace's Kitchen",
    "0971000001",
    "grace@tuli.zm",
    "Kamwala Market, Lusaka",
    -15.4167,
    28.2833,
    h("seller123"),
    "product"
))
seller = cur.fetchone()
seller_id = seller[0]
print("[OK] Seller  -> id=%s  name=%s  phone=%s  lat=%s  lng=%s" % (seller[0], seller[1], seller[3], seller[4], seller[5]))

# Product
cur.execute("SELECT id, name FROM products WHERE seller_id = %s LIMIT 1", (seller_id,))
row = cur.fetchone()
if not row:
    cur.execute("""
        INSERT INTO products (seller_id, name, category, price, location, description)
        VALUES (%s,%s,%s,%s,%s,%s) RETURNING id, name
    """, (seller_id, "Tomatoes (5kg bag)", "Fresh Produce", "K35",
          "Kamwala Market, Lusaka", "Fresh tomatoes from the farm"))
    row = cur.fetchone()
    print("[OK] Product -> id=%s  %s  K35" % (row[0], row[1]))
else:
    print("[i]  Product already exists -> id=%s  %s" % (row[0], row[1]))
product_id = row[0]

# Driver: Chanda Mwale
cur.execute("""
    INSERT INTO drivers (name, phone, zone, vehicle, password)
    VALUES (%s,%s,%s,%s,%s)
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, phone, zone, vehicle
""", (
    "Chanda Mwale",
    "0972000001",
    "Lusaka Central",
    "Motorbike",
    h("driver123")
))
driver = cur.fetchone()
print("[OK] Driver  -> id=%s  name=%s  phone=%s  zone=%s" % (driver[0], driver[1], driver[2], driver[3]))

# Confirmed order so driver can accept it immediately
cur.execute("""
    INSERT INTO orders (product_id, seller_id, buyer_name, original_price, final_price, delivery_address, status)
    VALUES (%s,%s,%s,%s,%s,%s,'confirmed')
    RETURNING id
""", (
    product_id,
    seller_id,
    "Steven Ngoma",
    "K35",
    "K55",
    "Cairo Road, Lusaka"
))
order_id = cur.fetchone()[0]
print("[OK] Order   -> id=%s  buyer=Steven Ngoma  delivery=Cairo Road, Lusaka  status=confirmed" % order_id)

conn.commit()
cur.close()
conn.close()

print("")
print("-----------------------------------------")
print("Login credentials:")
print("  Seller  phone: 0971000001   password: seller123")
print("  Driver  phone: 0972000001   password: driver123")
print("-----------------------------------------")
