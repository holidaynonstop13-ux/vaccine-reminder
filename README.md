# Vaccine Reminder (LINE OA)

ระบบแจ้งเตือนผู้ปกครองผ่าน LINE OA เมื่อถึงวันนัดพาเด็กมารับวัคซีน

## สถานะปัจจุบัน

- [x] สร้างโปรเจค Next.js + Tailwind + TypeScript
- [x] ติดตั้ง Supabase client และ LINE SDK
- [ ] ออกแบบตารางฐานข้อมูล (patients, appointments, line_links)
- [x] หน้า LIFF สำหรับผู้ปกครองผูกบัญชี LINE (`/link`)
- [x] Cron job ตรวจสอบนัดหมายรายวันและส่งข้อความแจ้งเตือน (`/api/cron/notify-appointments`, รันทุก 07:00 น.)
- [ ] ปุ่มยืนยัน/ขอเลื่อนนัดผ่าน Quick Reply

## Setup (local dev)

1. `npm install`
2. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าจริง
3. `npm run dev`

## Stack

- Next.js 15 (App Router, TypeScript, Tailwind)
- Supabase (Postgres + Auth)
- LINE Messaging API + LIFF
- Deploy: Vercel
