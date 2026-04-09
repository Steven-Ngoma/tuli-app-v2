import psycopg2, os, cloudinary, cloudinary.uploader, io
from PIL import Image
from dotenv import load_dotenv
load_dotenv()

cloudinary.config(cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'), api_key=os.getenv('CLOUDINARY_API_KEY'), api_secret=os.getenv('CLOUDINARY_API_SECRET'))

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Check food products
cur.execute("SELECT id, name, image_url, seller_id FROM products WHERE active=1 AND category='Restaurant & Food'")
foods = cur.fetchall()
print('Food products:', foods)

# Upload fries image for service sellers that have no product images
def upload(path):
    img = Image.open(path)
    img.thumbnail((1200, 1200))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    buf.seek(0)
    return cloudinary.uploader.upload(buf, folder='tuli')['secure_url']

# Add food products to service sellers 2, 3, 5 if they have none
cur.execute("SELECT id FROM products WHERE seller_id=2 AND active=1")
if not cur.fetchone():
    chicken_url = 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg'
    fries_url = 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699820/tuli/sink7xjuf7luiucslnng.jpg'
    cur.execute("INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (2, 'Grilled Chicken', 'Restaurant & Food', 'K85', 'Lusaka', 'Juicy grilled chicken', chicken_url, 'Main Course'))
    cur.execute("INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (2, 'Chips & Fries', 'Restaurant & Food', 'K45', 'Lusaka', 'Crispy golden fries', fries_url, 'Sides'))
    print('Added products to Flavour foods')

cur.execute("SELECT id FROM products WHERE seller_id=3 AND active=1")
if not cur.fetchone():
    chicken_url = 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg'
    cur.execute("INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (3, 'Special Chicken', 'Restaurant & Food', 'K90', 'Lusaka', 'Special grilled chicken', chicken_url, 'Main Course'))
    print('Added products to Day flavors')

cur.execute("SELECT id FROM products WHERE seller_id=5 AND active=1")
if not cur.fetchone():
    fries_url = 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699820/tuli/sink7xjuf7luiucslnng.jpg'
    cur.execute("INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (5, 'Special Fries', 'Restaurant & Food', 'K50', 'Lusaka', 'Crispy special fries', fries_url, 'Sides'))
    print('Added products to Lover Flavours')

conn.commit()
cur.close()
conn.close()
print('Done!')
