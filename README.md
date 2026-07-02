# 📦 Stock QR — Check Stock ด้วย QR Code

โปรแกรมเช็คสต็อกสินค้าด้วย QR Code: สร้าง QR ต่อสินค้าแต่ละชิ้น, สแกนด้วยกล้องมือถือ
เพื่อดูจำนวนคงเหลือ และรับเข้า/เบิกออกได้ทันที

## ฟีเจอร์

- สร้างสินค้าพร้อม SKU, ชื่อ, จำนวน, ตำแหน่งจัดเก็บ
- สร้าง QR Code อัตโนมัติต่อสินค้า (เข้ารหัสด้วย SKU)
- สแกน QR ผ่านกล้องในเบราว์เซอร์ (ใช้ `BarcodeDetector`) หรือพิมพ์ SKU เอง
- เช็คจำนวนคงเหลือ + สถานะ "มีสินค้า / สินค้าหมด"
- ปรับสต็อก (+/-) พร้อมบันทึกประวัติการเคลื่อนไหว (movements)
- กันสต็อกติดลบ

## การติดตั้งและรัน

```bash
npm install
npm start
# เปิด http://localhost:3000
```

> หมายเหตุ: การสแกนกล้องต้องใช้ `https` หรือ `localhost` ตามข้อกำหนดของเบราว์เซอร์

## ทดสอบ

```bash
npm test
```

## API

| Method | Path | คำอธิบาย |
| ------ | ---- | -------- |
| GET  | `/api/products` | รายการสินค้าทั้งหมด |
| POST | `/api/products` | เพิ่มสินค้า `{ sku, name, quantity, location }` |
| GET  | `/api/products/:id` | รายละเอียดสินค้า + ประวัติ |
| GET  | `/api/check/:sku` | เช็คสต็อกจาก SKU (ใช้กับการสแกน QR) |
| POST | `/api/adjust` | ปรับสต็อก `{ sku หรือ id, delta, reason }` |
| GET  | `/api/qrcode/:sku` | รูป QR Code (PNG) ของสินค้า |

## โครงสร้าง

```
src/
  server.js   Express API + serve หน้าเว็บ
  db.js       SQLite (better-sqlite3) + business logic
public/
  index.html  หน้าเว็บ
  app.js       ตัวสแกน QR + เรียก API
  style.css
test/
  api.test.js เทสต์ผ่าน node:test
```
