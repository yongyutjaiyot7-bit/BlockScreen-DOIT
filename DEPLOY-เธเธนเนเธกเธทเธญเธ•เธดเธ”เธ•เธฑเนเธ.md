# คู่มือติดตั้ง BLOCK SCREEN บน Docker / Portainer (องค์กร)

ระบบ QR Code stock บล็อกสกรีน — ติดตั้งบน Debian + Docker + Portainer

---

## สิ่งที่ต้องมี
- เครื่อง server (VM/มินิพีซี/NAS) ที่ลง **Docker + Portainer** เรียบร้อยแล้ว ✅
- ไฟล์โปรเจกต์นี้ (ทั้งโฟลเดอร์)

---

## วิธีที่ 1 — ติดตั้งผ่าน Portainer (แนะนำ)

### A. อัปโหลดโปรเจกต์ขึ้นเครื่อง server
คัดลอกทั้งโฟลเดอร์โปรเจกต์ไปไว้บนเครื่อง server เช่น `/opt/blockscreen`
```bash
# ตัวอย่าง (บนเครื่อง server)
sudo mkdir -p /opt/blockscreen
# แล้วก๊อปไฟล์โปรเจกต์ทั้งหมดไปไว้ในนั้น (scp / USB / git)
```

### B. สร้าง Stack ใน Portainer
1. เปิด Portainer → เลือก environment **Docker Standalone** → **Start Wizard** (ตามภาพที่คุณเห็น เลือก Docker Standalone → เชื่อม local socket)
2. เมนูซ้าย **Stacks** → **+ Add stack**
3. ตั้งชื่อ: `blockscreen`
4. เลือกวิธีใดวิธีหนึ่ง:
   - **Upload**: อัปโหลดไฟล์ `docker-compose.yml` จากโปรเจกต์
   - **Web editor**: วางเนื้อหาไฟล์ `docker-compose.yml` แต่ต้องเปลี่ยน `build: .` เป็น image ที่ build ไว้ (ดูวิธีที่ 2)
5. กด **Deploy the stack**
6. รอสักครู่ให้ build เสร็จ → เข้าใช้งานที่ **http://\<IP เครื่อง\>:3000**

> ข้อมูลจะถูกเก็บถาวรใน Docker volume ชื่อ `blockscreen-data` (ไม่หายเมื่อ restart/อัปเดต)

---

## วิธีที่ 2 — ผ่าน command line (ถ้าถนัด terminal)

```bash
cd /opt/blockscreen

# build + รัน (HTTP)
docker compose up -d --build

# ดู log
docker compose logs -f

# หยุด / เริ่มใหม่
docker compose down
docker compose up -d
```
เข้าใช้งานที่ `http://<IP เครื่อง>:3000`

---

## เปิดใช้งานบนมือถือพนักงาน

### Android (ผ่าน HTTP ได้เลย)
1. ต่อ Wi-Fi องค์กรเดียวกับ server
2. เปิด Chrome → `http://<IP เครื่อง>:3000`
3. เมนู ⋮ → **เพิ่มลงในหน้าจอหลัก** → ได้ไอคอนแอป + กล้องสแกน QR ใช้ได้

### iOS (ต้องใช้ HTTPS — ดูหัวข้อถัดไป)
กล้องบน iPhone ทำงานเฉพาะผ่าน HTTPS → ใช้ stack แบบ HTTPS

---

## เพิ่ม HTTPS (จำเป็นสำหรับ iOS + กล้องสแกน QR)

ใช้ไฟล์ `docker-compose.https.yml` (มี Caddy ออกใบรับรองให้อัตโนมัติ)

1. แก้ไฟล์ `Caddyfile` → เปลี่ยน `blockscreen.company.local` เป็นชื่อโดเมนภายในของคุณ
2. ตั้ง DNS ภายใน (หรือแก้ไฟล์ hosts ที่มือถือ/เครื่องลูก) ให้ชื่อนั้นชี้มาที่ IP ของ server
3. Deploy:
   ```bash
   docker compose -f docker-compose.https.yml up -d --build
   ```
   หรือใน Portainer ให้ใช้ไฟล์ `docker-compose.https.yml` แทน
4. เข้าใช้งานที่ `https://blockscreen.company.local`

> โดเมนภายใน (`.local`) จะใช้ใบรับรองจาก Caddy internal CA — เครื่องลูกต้อง "เชื่อถือ" (trust) root cert ก่อน
> ถ้ามี **โดเมนจริง** + เปิดพอร์ต 80/443 ออกอินเทอร์เน็ต → Caddy จะขอใบรับรอง Let's Encrypt (ฟรี) ให้อัตโนมัติ ไม่ต้อง trust เอง

---

## การสำรอง / กู้คืนข้อมูล

ข้อมูลทั้งหมดอยู่ใน volume `blockscreen-data` (ไฟล์ `blockscreen.db`)

```bash
# สำรอง (backup)
docker run --rm -v blockscreen-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/blockscreen-backup-$(date +%F).tar.gz -C /data .

# กู้คืน (restore)
docker run --rm -v blockscreen-data:/data -v $(pwd):/backup alpine \
  sh -c "cd /data && tar xzf /backup/blockscreen-backup-XXXX.tar.gz"
```

---

## อัปเดตเวอร์ชันแอป
```bash
cd /opt/blockscreen
# นำโค้ดใหม่มาวางทับ แล้ว:
docker compose up -d --build
```
ข้อมูลใน volume ไม่หาย

---

## หมายเหตุเรื่องฐานข้อมูล
ปัจจุบันใช้ **sql.js (ไฟล์เดียว)** — เหมาะกับผู้ใช้พร้อมกันระดับปานกลาง (~10–20 คน)
ถ้าองค์กรใหญ่/คนใช้พร้อมกันเยอะ แนะนำอัปเกรดเป็น **PostgreSQL** (แจ้งผู้พัฒนาเพื่อปรับให้)
