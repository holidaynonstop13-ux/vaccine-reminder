# Vaccine Reminder (LINE OA)

ระบบแจ้งเตือนผู้ปกครองผ่าน LINE OA เมื่อถึงวันนัดพาเด็กมารับวัคซีน

## สถานะปัจจุบัน

- [x] สร้างโปรเจค Next.js + Tailwind + TypeScript
- [x] ติดตั้ง Supabase client และ LINE SDK
- [ ] ออกแบบตารางฐานข้อมูล (patients, appointments, line_links)
- [x] หน้า LIFF สำหรับผู้ปกครองผูกบัญชี LINE (`/link`)
- [x] Cron job ตรวจสอบนัดหมายรายวันและส่งข้อความแจ้งเตือน (`/api/cron/notify-appointments`, รันทุก 07:00 น.)
- [x] หน้า Admin จัดการคนไข้ + ปุ่มส่งแจ้งเตือนตอนนี้ (`/admin`, ล็อกด้วยระบบล็อกอินของตัวเอง)
- [x] แถบสีสถานะเด็ก (ปกติ/ใกล้นัด/ขาดนัด) คำนวณอัตโนมัติจากวันนัด
- [x] แก้ไข/ลบข้อมูลเด็ก, เพิ่มนัดใหม่, มาร์กรับวัคซีนแล้ว, ยกเลิกเชื่อม LINE
- [x] ส่งแจ้งเตือนซ้ำรายบุคคลได้ไม่จำกัดจำนวนครั้ง (สำหรับติดตามเร่งด่วน)
- [ ] ปุ่มยืนยัน/ขอเลื่อนนัดผ่าน Quick Reply (จากฝั่งผู้ปกครอง)

## Setup (local dev)

1. `npm install`
2. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจริง
3. `npm run dev`

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind)
- Supabase (Postgres + Auth)
- LINE Messaging API + LIFF
- Deploy: Vercel
