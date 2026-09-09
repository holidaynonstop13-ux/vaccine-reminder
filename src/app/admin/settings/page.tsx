"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";

export default function SettingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState({
    clinic_name: "",
    message_template: "",
    overdue_threshold_days: "3",
    auto_send_enabled: "true",
    vaccine_list: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setValues(data.settings);
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen bg-[#F3F7F5]">
      <AdminSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onChildren={() => router.push("/admin")}
        onUsers={() => router.push("/admin/users")}
        onSettings={() => {}}
        onLogout={handleLogout}
        activeItem="settings"
      />

      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-1.5 text-sm text-[#5B7B73] hover:text-[#1E3D36] mb-4"
          >
            <ArrowLeft size={16} /> กลับไปหน้าข้อมูลเด็ก
          </button>

          <h1 className="text-2xl font-semibold text-[#152D28] tracking-tight mb-6">ตั้งค่าระบบ</h1>

          {loading ? (
            <p className="text-sm text-[#5B7B73]">กำลังโหลด...</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5ECE9] p-6 space-y-6">
              <div>
                <span className="text-sm text-[#1E3D36] font-medium">ชื่อคลินิก/สถานที่</span>
                <input
                  value={values.clinic_name}
                  onChange={(e) => setValues({ ...values, clinic_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                />
                <p className="text-xs text-[#8FAAA2] mt-1">ใช้แทน {"{clinicName}"} ในข้อความแจ้งเตือน</p>
              </div>

              <div>
                <span className="text-sm text-[#1E3D36] font-medium">ข้อความแจ้งเตือน</span>
                <textarea
                  value={values.message_template}
                  onChange={(e) => setValues({ ...values, message_template: e.target.value })}
                  rows={7}
                  className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                />
                <p className="text-xs text-[#8FAAA2] mt-1">
                  ตัวแปรที่ใช้ได้: {"{childName}"} {"{vaccineName}"} {"{appointmentDate}"} {"{clinicName}"}
                </p>
              </div>

              <div>
                <span className="text-sm text-[#1E3D36] font-medium">รายชื่อวัคซีน (บรรทัดละ 1 ชื่อ)</span>
                <textarea
                  value={values.vaccine_list}
                  onChange={(e) => setValues({ ...values, vaccine_list: e.target.value })}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                />
                <p className="text-xs text-[#8FAAA2] mt-1">
                  รายชื่อนี้จะขึ้นเป็นเมนูให้เลือกตอนลงวันนัด/ชื่อวัคซีนของเด็กแต่ละคน
                </p>
              </div>

              <div>
                <span className="text-sm text-[#1E3D36] font-medium">
                  จำนวนวันหลังเลยนัด ที่ยังถือว่า &quot;ล่าช้า&quot; ก่อนเปลี่ยนเป็น &quot;ขาดนัด&quot;
                </span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={values.overdue_threshold_days}
                  onChange={(e) => setValues({ ...values, overdue_threshold_days: e.target.value })}
                  className="mt-1 w-24 rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#F7FAF9] border border-[#E5ECE9] px-4 py-3">
                <div>
                  <p className="text-sm text-[#1E3D36] font-medium">เปิดใช้งานการส่งแจ้งเตือนอัตโนมัติทุกวัน</p>
                  <p className="text-xs text-[#8FAAA2] mt-0.5">
                    ปิดชั่วคราวได้ เช่น ช่วงคลินิกหยุด (ปุ่ม &quot;ส่งแจ้งเตือนตอนนี้&quot; ยังใช้ได้ตามปกติ)
                  </p>
                </div>
                <button
                  onClick={() =>
                    setValues({
                      ...values,
                      auto_send_enabled: values.auto_send_enabled === "true" ? "false" : "true",
                    })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    values.auto_send_enabled === "true" ? "bg-[#2F6F62]" : "bg-[#D8E5E0]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      values.auto_send_enabled === "true" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-lg bg-[#F7FAF9] border border-[#E5ECE9] px-4 py-3">
                <p className="text-sm text-[#1E3D36] font-medium">เวลาส่งอัตโนมัติ: 07:00 น. ทุกวัน</p>
                <p className="text-xs text-[#8FAAA2] mt-0.5">
                  เปลี่ยนเวลานี้ต้องแจ้งผู้พัฒนาระบบ เนื่องจากข้อจำกัดของแพ็กเกจ Vercel ที่ใช้อยู่
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                {saved && <span className="text-sm text-[#2F6F62]">บันทึกแล้ว</span>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
