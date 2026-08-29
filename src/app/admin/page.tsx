"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  appointment_date: string;
  vaccine_name: string;
  status: string;
};

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  guardian_name: string;
  guardian_phone: string;
  linked: boolean;
  appointments: Appointment[];
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "รอแจ้งเตือน",
  confirmed: "ยืนยันแล้ว",
  notified: "แจ้งเตือนแล้ว",
  postponed: "ขอเลื่อนนัด",
  completed: "รับวัคซีนแล้ว",
};

export default function AdminPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notifyResult, setNotifyResult] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);

  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [userError, setUserError] = useState("");
  const [userSaving, setUserSaving] = useState(false);
  const [userSuccess, setUserSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    guardianName: "",
    guardianPhone: "",
    appointmentDate: "",
    vaccineName: "",
  });

  async function loadPatients() {
    setLoading(true);
    const res = await fetch("/api/admin/patients");
    const data = await res.json();
    setPatients(data.patients ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const res = await fetch("/api/admin/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setFormError(data.error ?? "บันทึกไม่สำเร็จ");
      setSaving(false);
      return;
    }

    setForm({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      guardianName: "",
      guardianPhone: "",
      appointmentDate: "",
      vaccineName: "",
    });
    setShowForm(false);
    setSaving(false);
    loadPatients();
  }

  async function handleNotifyNow() {
    setNotifying(true);
    setNotifyResult(null);
    const res = await fetch("/api/admin/notify-now", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setNotifyResult(`เกิดข้อผิดพลาด: ${data.error}`);
    } else if (data.total === 0) {
      setNotifyResult("ไม่มีนัดหมายวันนี้");
    } else {
      setNotifyResult(
        `ส่งสำเร็จ ${data.sent} ราย · ไม่ได้ผูกบัญชี ${data.skippedNoLink} ราย · ล้มเหลว ${data.failed} ราย`
      );
    }
    setNotifying(false);
    loadPatients();
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setUserSaving(true);
    setUserError("");
    setUserSuccess("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();

    if (!res.ok) {
      setUserError(data.error ?? "เพิ่มผู้ใช้ไม่สำเร็จ");
      setUserSaving(false);
      return;
    }

    setUserSuccess(`เพิ่มผู้ใช้ "${newUser.username}" สำเร็จ`);
    setNewUser({ username: "", password: "" });
    setUserSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#F3F7F5] px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[#1E3D36]">
              ระบบจัดการคนไข้และนัดหมาย
            </h1>
            <p className="text-sm text-[#5B7B73]">
              รายชื่อเด็ก {patients.length} คน
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleNotifyNow}
              disabled={notifying}
              className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
            >
              {notifying ? "กำลังส่ง..." : "ส่งแจ้งเตือนตอนนี้"}
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg border border-[#2F6F62] text-[#2F6F62] text-sm font-medium px-4 py-2"
            >
              + เพิ่มเด็ก
            </button>
            <button
              onClick={() => setShowUserForm((v) => !v)}
              className="rounded-lg border border-[#2F6F62] text-[#2F6F62] text-sm font-medium px-4 py-2"
            >
              + ผู้ใช้แอดมิน
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg text-[#5B7B73] text-sm font-medium px-3 py-2"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {showUserForm && (
          <form
            onSubmit={handleAddUser}
            className="mb-6 bg-white rounded-2xl p-5 shadow-sm flex gap-3 items-end flex-wrap"
          >
            <Input
              label="ชื่อผู้ใช้ใหม่"
              value={newUser.username}
              onChange={(v) => setNewUser({ ...newUser, username: v })}
            />
            <Input
              label="รหัสผ่าน (8 ตัวขึ้นไป)"
              type="password"
              value={newUser.password}
              onChange={(v) => setNewUser({ ...newUser, password: v })}
            />
            <button
              type="submit"
              disabled={userSaving}
              className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2.5 disabled:opacity-60"
            >
              {userSaving ? "กำลังบันทึก..." : "เพิ่มผู้ใช้"}
            </button>
            {userError && <p className="w-full text-sm text-[#B3452E]">{userError}</p>}
            {userSuccess && <p className="w-full text-sm text-[#2F6F62]">{userSuccess}</p>}
          </form>
        )}

        {notifyResult && (
          <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm text-[#1E3D36] shadow-sm">
            {notifyResult}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-6 bg-white rounded-2xl p-5 shadow-sm grid grid-cols-2 gap-3"
          >
            <Input label="ชื่อเด็ก" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Input label="นามสกุลเด็ก" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Input label="วันเกิด" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <Input label="ชื่อผู้ปกครอง" value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} />
            <Input label="เบอร์โทรผู้ปกครอง" value={form.guardianPhone} onChange={(v) => setForm({ ...form, guardianPhone: v })} />
            <Input label="วันนัดฉีดวัคซีน" type="date" value={form.appointmentDate} onChange={(v) => setForm({ ...form, appointmentDate: v })} />
            <Input label="ชื่อวัคซีน" value={form.vaccineName} onChange={(v) => setForm({ ...form, vaccineName: v })} />

            {formError && <p className="col-span-2 text-sm text-[#B3452E]">{formError}</p>}

            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#EAF2EF] text-[#1E3D36] text-left">
              <tr>
                <th className="px-4 py-3">ชื่อเด็ก</th>
                <th className="px-4 py-3">ผู้ปกครอง</th>
                <th className="px-4 py-3">ผูกบัญชี LINE</th>
                <th className="px-4 py-3">นัดหมาย</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[#5B7B73]">
                    กำลังโหลด...
                  </td>
                </tr>
              )}
              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[#5B7B73]">
                    ยังไม่มีข้อมูลเด็ก
                  </td>
                </tr>
              )}
              {patients.map((p) => (
                <tr key={p.id} className="border-t border-[#EAF2EF]">
                  <td className="px-4 py-3 text-[#1E3D36]">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-4 py-3 text-[#5B7B73]">
                    {p.guardian_name}
                    <br />
                    {p.guardian_phone}
                  </td>
                  <td className="px-4 py-3">
                    {p.linked ? (
                      <span className="text-[#2F6F62] font-medium">เชื่อมแล้ว</span>
                    ) : (
                      <span className="text-[#A9BDB6]">ยังไม่เชื่อม</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5B7B73]">
                    {p.appointments.length === 0 && "-"}
                    {p.appointments.map((a) => (
                      <div key={a.id}>
                        {a.appointment_date} · {a.vaccine_name} ·{" "}
                        <span className="text-[#1E3D36]">
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-[#1E3D36] font-medium">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
      />
    </label>
  );
}
