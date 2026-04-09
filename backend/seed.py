import cloudinary
import cloudinary.uploader
import os
import psycopg2
import io
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def upload_image(path):
    img = Image.open(path)
    img.thumbnail((1200, 1200))
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    buf.seek(0)
    result = cloudinary.uploader.upload(buf, folder='tuli')
    return result['secure_url']

print('Uploading images to Cloudinary...')

chicken = 'https://res.cloudinary.com/daxhjv2lt/image/upload/v1774699114/tuli/gpbqs8cwpkltovzyz9rp.jpg'
print('Chicken already uploaded')

fries = upload_image(r'C:\Users\Steven Ngoma\Pictures\fries.jpg')
print('Fries done:', fries)

couch = upload_image(r'C:\Users\Steven Ngoma\Pictures\couch1.jpg')
print('Couch done:', couch)

shoe = upload_image(r'C:\Users\Steven Ngoma\Pictures\shoe one.jpg')
print('Shoe done:', shoe)

tv = upload_image(r'C:\Users\Steven Ngoma\Pictures\television-houseplants-room-scene-generative-ai.jpg')
print('TV done:', tv)

print('Adding products to database...')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute('INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
    (1, 'Grilled Chicken', 'Restaurant & Food', 'K85', 'Lusaka - Kamwala', 'Juicy grilled chicken', chicken, 'Main Course'))

cur.execute('INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
    (1, 'Chips & Fries', 'Restaurant & Food', 'K45', 'Lusaka - Kamwala', 'Crispy golden fries', fries, 'Sides'))

cur.execute('INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
    (1, 'Modern Couch', 'Home Goods', 'K2500', 'Lusaka - Kamwala', '3 seater modern couch', couch, None))

cur.execute('INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
    (1, 'Sneaker Shoe', 'Shoes', 'K350', 'Lusaka - Kamwala', 'Stylish sneakers size 40-45', shoe, None))

cur.execute('INSERT INTO products (seller_id, name, category, price, location, description, image_url, food_category) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',
    (1, 'Smart TV', 'Electronics', 'K4500', 'Lusaka - Kamwala', '43 inch smart TV', tv, None))

conn.commit()
cur.close()
conn.close()
print('Done! All 5 products added successfully.')
