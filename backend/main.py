from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import psycopg2.extras
import hashlib
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TULI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

cloudinary.config(
    cloud_name="daxhjv2lt",
    api_key="293552771997197",
    api_secret="sQXIy0tkDChOeewN4kuDSIMD1gk"
)

DATABASE_URL = os.getenv("DATABASE_URL")

# ── Database setup ──────────────────────────────────────────────────────────

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sellers (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            shop_name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            location TEXT NOT NULL,
            password TEXT NOT NULL,
            shop_type TEXT DEFAULT 'product',
            subscription_expires TIMESTAMP,
            last_seen TIMESTAMP,
            logo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url TEXT;
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            seller_id INTEGER NOT NULL REFERENCES sellers(id),
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            food_category TEXT,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS product_images (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id),
            url TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            room_id TEXT NOT NULL,
            seller_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            is_seller INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id),
            seller_id INTEGER NOT NULL REFERENCES sellers(id),
            buyer_name TEXT NOT NULL,
            original_price TEXT NOT NULL,
            final_price TEXT NOT NULL,
            delivery_address TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    cur.close()
    conn.close()

init_db()

# ── Schemas ─────────────────────────────────────────────────────────────────

class SellerRegister(BaseModel):
    name: str
    shop_name: str
    phone: str
    email: Optional[str] = None
    location: str
    password: str
    shop_type: str = 'product'

class SellerLogin(BaseModel):
    phone: str
    password: str

class ProductCreate(BaseModel):
    seller_id: int
    name: str
    category: str
    price: str
    location: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    extra_images: Optional[list[str]] = []
    food_category: Optional[str] = None

class MessageCreate(BaseModel):
    room_id: str
    sender: str
    message: str
    is_seller: bool = False

class OrderCreate(BaseModel):
    product_id: int
    seller_id: int
    buyer_name: str
    original_price: str
    final_price: str
    delivery_address: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

# ── Helpers ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def fetchone(cur):
    row = cur.fetchone()
    if not row:
        return None
    cols = [desc[0] for desc in cur.description]
    return dict(zip(cols, row))

def fetchall(cur):
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    return [dict(zip(cols, row)) for row in rows]

# ── Upload Routes ─────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(contents, folder="tuli", resource_type="image")
        return {"url": result["secure_url"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-multiple")
async def upload_multiple(files: list[UploadFile] = File(...)):
    urls = []
    for file in files:
        contents = await file.read()
        result = cloudinary.uploader.upload(contents, folder="tuli", resource_type="image")
        urls.append(result["secure_url"])
    return {"urls": urls}

# ── Seller Routes ────────────────────────────────────────────────────────────

@app.post("/sellers/{seller_id}/ping")
def ping_seller(seller_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE sellers SET last_seen = CURRENT_TIMESTAMP WHERE id = %s", (seller_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "ok"}

@app.get("/sellers/{seller_id}/status")
def seller_status(seller_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT last_seen FROM sellers WHERE id = %s", (seller_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row or not row[0]:
        return {"online": False}
    from datetime import datetime
    diff = (datetime.utcnow() - row[0]).total_seconds()
    return {"online": diff < 120}

@app.post("/sellers/register")
def register_seller(data: SellerRegister):
    from datetime import datetime, timedelta
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM sellers WHERE phone = %s", (data.phone,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Phone number already registered")
    sub_expires = None
    if data.shop_type == 'service':
        sub_expires = datetime.utcnow() + timedelta(days=30)
    cur.execute(
        "INSERT INTO sellers (name, shop_name, phone, email, location, password, shop_type, subscription_expires) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id, name, shop_name, phone, location, shop_type, subscription_expires, logo_url",
        (data.name, data.shop_name, data.phone, data.email, data.location, hash_password(data.password), data.shop_type, sub_expires)
    )
    seller = fetchone(cur)
    conn.commit()
    cur.close()
    conn.close()
    return seller

@app.post("/sellers/login")
def login_seller(data: SellerLogin):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, shop_name, phone, location, shop_type, subscription_expires, logo_url FROM sellers WHERE phone = %s AND password = %s",
        (data.phone, hash_password(data.password))
    )
    seller = fetchone(cur)
    cur.close()
    conn.close()
    if not seller:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    return seller

# ── Product Routes ───────────────────────────────────────────────────────────

@app.get("/products")
def get_products(seller_id: Optional[int] = None, category: Optional[str] = None):
    conn = get_db()
    cur = conn.cursor()
    query = """
        SELECT p.*, s.shop_name, s.phone as seller_phone, s.last_seen
        FROM products p JOIN sellers s ON p.seller_id = s.id
        WHERE p.active = 1
    """
    params = []
    if seller_id:
        query += " AND p.seller_id = %s"
        params.append(seller_id)
    if category and category != "All":
        query += " AND p.category = %s"
        params.append(category)
    query += " ORDER BY p.created_at DESC"
    cur.execute(query, params)
    rows = fetchall(cur)
    result = []
    for p in rows:
        cur.execute("SELECT url FROM product_images WHERE product_id = %s", (p['id'],))
        imgs = [r[0] for r in cur.fetchall()]
        p['images'] = ([p['image_url']] if p['image_url'] else []) + imgs
        result.append(p)
    cur.close()
    conn.close()
    return result

@app.post("/products")
def add_product(data: ProductCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM sellers WHERE id = %s", (data.seller_id,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Seller not found")
    cur.execute(
        "INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
        (data.seller_id, data.name, data.category, data.price, data.location, data.description, data.image_url, data.food_category)
    )
    product = fetchone(cur)
    for url in (data.extra_images or []):
        cur.execute("INSERT INTO product_images (product_id, url) VALUES (%s,%s)", (product['id'], url))
    conn.commit()
    cur.close()
    conn.close()
    return product

@app.patch("/products/{product_id}/image")
def update_product_image(product_id: int, data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE products SET image_url = %s WHERE id = %s", (data.get('image_url'), product_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "updated"}

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM product_images WHERE product_id = %s", (product_id,))
    cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product removed"}

# ── Restaurant Routes ─────────────────────────────────────────────────────────

@app.get("/restaurants")
def get_restaurants():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.id, s.shop_name, s.location, s.last_seen, s.logo_url,
               COUNT(p.id) as item_count,
               MAX(p.image_url) as cover_image
        FROM sellers s
        LEFT JOIN products p ON p.seller_id = s.id AND p.active = 1 AND p.category = 'Restaurant & Food'
        WHERE s.shop_type = 'service'
        GROUP BY s.id
    """)
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows

@app.get("/restaurants/{seller_id}/menu")
def get_menu(seller_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, shop_name, location, last_seen, logo_url FROM sellers WHERE id = %s", (seller_id,))
    seller = fetchone(cur)
    if not seller:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    cur.execute("""
        SELECT p.*, s.shop_name, s.last_seen
        FROM products p JOIN sellers s ON p.seller_id = s.id
        WHERE p.seller_id = %s AND p.active = 1 AND p.category = 'Restaurant & Food'
        ORDER BY p.food_category, p.name
    """, (seller_id,))
    items = fetchall(cur)
    result = []
    for p in items:
        cur.execute("SELECT url FROM product_images WHERE product_id = %s", (p['id'],))
        imgs = [r[0] for r in cur.fetchall()]
        p['images'] = ([p['image_url']] if p['image_url'] else []) + imgs
        result.append(p)
    cur.close()
    conn.close()
    return {"restaurant": seller, "menu": result}

@app.get("/debug-env")
def debug_env():
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "api_secret_len": len(os.getenv("CLOUDINARY_API_SECRET") or ''),
        "api_secret_start": (os.getenv("CLOUDINARY_API_SECRET") or '')[:4]
    }

@app.get("/shops")
def get_shops():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.id, s.shop_name, s.location, s.last_seen, s.logo_url,
               COUNT(p.id) as product_count,
               MAX(p.image_url) as cover_image
        FROM sellers s
        LEFT JOIN products p ON p.seller_id = s.id AND p.active = 1 AND p.image_url IS NOT NULL AND p.image_url != ''
        WHERE s.shop_type = 'product'
        GROUP BY s.id
    """)
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows

@app.get("/shops/{seller_id}")
def get_shop(seller_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, shop_name, location, last_seen, logo_url FROM sellers WHERE id = %s", (seller_id,))
    seller = fetchone(cur)
    if not seller:
        raise HTTPException(status_code=404, detail="Shop not found")
    cur.execute("""
        SELECT p.*, s.shop_name, s.last_seen FROM products p
        JOIN sellers s ON p.seller_id = s.id
        WHERE p.seller_id = %s AND p.active = 1 ORDER BY p.created_at DESC
    """, (seller_id,))
    products = fetchall(cur)
    for p in products:
        cur.execute("SELECT url FROM product_images WHERE product_id = %s", (p['id'],))
        imgs = [r[0] for r in cur.fetchall()]
        p['images'] = ([p['image_url']] if p['image_url'] else []) + imgs
    cur.close()
    conn.close()
    return {"shop": seller, "products": products}

@app.post("/sellers/{seller_id}/logo")
async def update_logo(seller_id: int, file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(contents, folder="tuli", resource_type="image")
        logo_url = result["secure_url"]
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE sellers SET logo_url = %s WHERE id = %s", (logo_url, seller_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"logo_url": logo_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def root():
    return {"message": "TULI API is running"}

# ── Order Routes ────────────────────────────────────────────────────────────

@app.post("/orders")
def create_order(data: OrderCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO orders (product_id, seller_id, buyer_name, original_price, final_price, delivery_address) VALUES (%s,%s,%s,%s,%s,%s) RETURNING *",
        (data.product_id, data.seller_id, data.buyer_name, data.original_price, data.final_price, data.delivery_address)
    )
    order = fetchone(cur)
    conn.commit()
    cur.close()
    conn.close()
    return order

@app.get("/orders/seller/{seller_id}")
def get_seller_orders(seller_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT o.*, p.name as product_name, p.image_url
        FROM orders o JOIN products p ON o.product_id = p.id
        WHERE o.seller_id = %s
        ORDER BY o.created_at DESC
    """, (seller_id,))
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows

@app.get("/orders/buyer/{buyer_name}")
def get_buyer_orders(buyer_name: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT o.*, p.name as product_name, s.shop_name
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN sellers s ON o.seller_id = s.id
        WHERE o.buyer_name = %s
        ORDER BY o.created_at DESC
    """, (buyer_name,))
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows

@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, data: OrderStatusUpdate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE orders SET status = %s WHERE id = %s", (data.status, order_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "updated"}

# ── Chat Routes ────────────────────────────────────────────────────────────

@app.post("/chat")
def send_message(data: MessageCreate):
    parts = data.room_id.split('_')
    seller_id, product_id = int(parts[0]), int(parts[1])
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO messages (room_id, seller_id, product_id, sender, message, is_seller) VALUES (%s,%s,%s,%s,%s,%s)",
        (data.room_id, seller_id, product_id, data.sender, data.message, int(data.is_seller))
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"status": "sent"}

@app.get("/chat/{room_id}")
def get_messages(room_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM messages WHERE room_id = %s ORDER BY created_at ASC", (room_id,))
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows

@app.get("/chat/buyer/{buyer_name}")
def get_buyer_chats(buyer_name: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT m.room_id, m.seller_id, m.product_id, p.name as product_name, s.shop_name,
               (SELECT message FROM messages WHERE room_id = m.room_id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT is_seller FROM messages WHERE room_id = m.room_id ORDER BY created_at DESC LIMIT 1) as last_is_seller,
               (SELECT COUNT(*) FROM messages WHERE room_id = m.room_id AND is_seller = 1) as seller_msg_count
        FROM messages m
        JOIN products p ON m.product_id = p.id
        JOIN sellers s ON m.seller_id = s.id
        WHERE m.is_seller = 0 AND m.sender = %s
        GROUP BY m.room_id, m.seller_id, m.product_id, p.name, s.shop_name
        ORDER BY MAX(m.created_at) DESC
    """, (buyer_name,))
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows

@app.get("/chat/seller/{seller_id}")
def get_seller_chats(seller_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT m.room_id, m.seller_id, m.product_id, p.name as product_name,
               MIN(CASE WHEN m.is_seller = 0 THEN m.sender END) as buyer_name,
               (SELECT message FROM messages WHERE room_id = m.room_id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT is_seller FROM messages WHERE room_id = m.room_id ORDER BY created_at DESC LIMIT 1) as last_is_seller,
               (SELECT COUNT(*) FROM messages WHERE room_id = m.room_id AND is_seller = 0) as buyer_msg_count
        FROM messages m
        JOIN products p ON m.product_id = p.id
        WHERE m.seller_id = %s
        GROUP BY m.room_id, m.seller_id, m.product_id, p.name
        ORDER BY MAX(m.created_at) DESC
    """, (seller_id,))
    rows = fetchall(cur)
    cur.close()
    conn.close()
    return rows
