# Utility Management System (Web Report)

ระบบบริหารจัดการและติดตามข้อมูลการใช้พลังงาน สิ่งแวดล้อม และระบบบำบัดน้ำเสียโรงงาน (Plant Utility & Energy Management Platform) พัฒนาด้วย Next.js และ React

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- **Energy & Utility Dashboard:** แดชบอร์ดวิเคราะห์และสรุปผลสถิติการใช้พลังงานแบบเรียลไทม์ (ไฟฟ้า PEA, โซลาร์เซลล์ Solar, น้ำมันเตา, ก๊าซชีวภาพ Biogas) พร้อมกราฟแนวโน้มและการเปรียบเทียบช่วงเวลา
- **Interactive Wastewater Schematic (Plant Mockup):** แผนผังจำลองระบบบ่อบำบัดน้ำเสียและบ่อก๊าซชีวภาพแบบ Vector Digital Twin แสดงแนวท่อและทิศทางการไหลของกระบวนการบำบัด พร้อมคลิกดูพารามิเตอร์ตรวจวัด (COD, pH, Flow, SV60)
- **Data Entry & Approval Workflow:** ระบบบันทึกข้อมูลประจำวัน/ประจำเดือน และระบบส่งขออนุมัติแยกตามหมวดหมู่ (Category Submissions)
- **Sludge Cost Saving Calculator:** ระบบคำนวณเปรียบเทียบต้นทุนและส่วนประหยัดค่าใช้จ่ายในการบริหารจัดการตะกอน (Sludge Management)
- **Monthly Report & Excel Export:** ระบบสร้างรายงานสรุปผลประจำเดือน และฟังก์ชัน Export ข้อมูลเป็นไฟล์ Excel (`.xlsx`) และรูปภาพ A4
- **Role-based Access Control:** แบ่งสิทธิ์การใช้งานระหว่างเจ้าหน้าที่บันทึกข้อมูล (Data Entry / Reporter), ผู้อนุมัติ (Approver) และผู้ดูแลระบบ (Admin)

---

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** Next.js 16 (App Router / Turbopack)
- **UI Library:** React 19, Tailwind CSS 4, Lucide React Icons
- **Data Visualization:** Recharts, Modern-Screenshot
- **Database & Auth:** Supabase (PostgreSQL & Supabase Auth)
- **Export Utility:** SheetJS (xlsx)

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` สำหรับเชื่อมต่อกับระบบฐานข้อมูล Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```

เปิดเว็บเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### 4. Build สำหรับ Production
```bash
npm run build
npm run start
```
