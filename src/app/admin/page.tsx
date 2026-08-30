"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  appointment_date: string;
  vaccine_name: string;
  status: string;
  received_date: string | null;
};

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  guardian_name: string;
  guardian_phone: string;
  queue_code: string | null;
  date_of_birth: string;
  linked: boolean;
  appointments: Appointment[];
  badge: "urgent" | "warning" | "normal";
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "รอแจ้งเตือน",
  confirmed: "ยืนยันแล้ว",
  notified: "แจ้งเตือนแล้ว",
  postponed: "ขอเลื่อนนัด",
  completed: "รับวัคซีนแล้ว",
};

const BADGE_STYLE: Record<Patient["badge"], { label: string; className: string }> = {
  normal: { label: "ปกติ", className: "bg-[#E4F3EC] text-[#2F6F62]" },
  warning: { label: "ใกล้นัด/ต้องติดตาม", className: "bg-[#FCF1D9] text-[#946B1C]" },
  urgent: { label: "ขาดนัด/เร่งติดตาม", className: "bg-[#FBE4E0] text-[#B3452E]" },
};

export default function AdminPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notifyResult, setNotifyResult] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    queueCode: "",
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
      queueCode: "",
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[#1E3D36]">
              ระบบจัดการคนไข้และนัดหมาย
            </h1>
            <p className="text-sm text-[#5B7B73]">รายชื่อเด็ก {patients.length} คน</p>
          </div>
          <div className="flex gap-2 flex-wrap">
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

        {notifyResult && (
          <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm text-[#1E3D36] shadow-sm">
            {notifyResult}
          </div>
        )}

        {showUserForm && (
          <form
            onSubmit={handleAddUser}
            className="mb-6 bg-white rounded-2xl p-5 shadow-sm flex gap-3 items-end flex-wrap"
          >
            <Input label="ชื่อผู้ใช้ใหม่" value={newUser.username} onChange={(v) => setNewUser({ ...newUser, username: v })} />
            <Input label="รหัสผ่าน (8 ตัวขึ้นไป)" type="password" value={newUser.password} onChange={(v) => setNewUser({ ...newUser, password: v })} />
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

        {showForm && (
          <form onSubmit={handleAdd} className="mb-6 bg-white rounded-2xl p-5 shadow-sm grid grid-cols-2 gap-3">
            <Input label="ชื่อเด็ก" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Input label="นามสกุลเด็ก" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Input label="วันเกิด" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <Input label="ชื่อผู้ปกครอง" value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} />
            <Input label="เบอร์โทรผู้ปกครอง" value={form.guardianPhone} onChange={(v) => setForm({ ...form, guardianPhone: v })} />
            <Input label="รหัสคิว (เช่น A01)" value={form.queueCode} onChange={(v) => setForm({ ...form, queueCode: v.toUpperCase() })} />
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
                <th className="px-4 py-3">รหัสคิว</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">LINE</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#5B7B73]">
                    กำลังโหลด...
                  </td>
                </tr>
              )}
              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#5B7B73]">
                    ยังไม่มีข้อมูลเด็ก
                  </td>
                </tr>
              )}
              {patients.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  expanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  onChanged={loadPatients}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function PatientRow({
  patient,
  expanded,
  onToggle,
  onChanged,
}: {
  patient: Patient;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const badge = BADGE_STYLE[patient.badge];

  return (
    <>
      <tr className="border-t border-[#EAF2EF] cursor-pointer hover:bg-[#FAFCFB]" onClick={onToggle}>
        <td className="px-4 py-3 text-[#1E3D36]">
          {patient.first_name} {patient.last_name}
        </td>
        <td className="px-4 py-3 text-[#1E3D36] font-medium">{patient.queue_code ?? "-"}</td>
        <td className="px-4 py-3">
          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </td>
        <td className="px-4 py-3">
          {patient.linked ? (
            <span className="text-[#2F6F62] font-medium">เชื่อมแล้ว</span>
          ) : (
            <span className="text-[#A9BDB6]">ยังไม่เชื่อม</span>
          )}
        </td>
        <td className="px-4 py-3 text-[#5B7B73]">{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr className="border-t border-[#EAF2EF] bg-[#FAFCFB]">
          <td colSpan={5} className="px-4 py-4">
            <PatientDetail patient={patient} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

function PatientDetail({ patient, onChanged }: { patient: Patient; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth,
    guardianName: patient.guardian_name,
    guardianPhone: patient.guardian_phone,
    queueCode: patient.queue_code ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showAddAppt, setShowAddAppt] = useState(false);
  const [newAppt, setNewAppt] = useState({ appointmentDate: "", vaccineName: "" });

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      setSaving(false);
      return;
    }
    setEditing(false);
    setSaving(false);
    onChanged();
  }

  async function deletePatient() {
    if (!confirm(`ลบข้อมูล ${patient.first_name} ${patient.last_name} ทั้งหมด (รวมนัดหมายและการเชื่อม LINE)?`)) return;
    await fetch(`/api/admin/patients/${patient.id}`, { method: "DELETE" });
    onChanged();
  }

  async function unlinkLine() {
    if (!confirm("ยกเลิกการเชื่อมบัญชี LINE ของเด็กคนนี้?")) return;
    await fetch(`/api/admin/line-links/${patient.id}`, { method: "DELETE" });
    onChanged();
  }

  async function addAppointment(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, ...newAppt }),
    });
    setNewAppt({ appointmentDate: "", vaccineName: "" });
    setShowAddAppt(false);
    onChanged();
  }

  async function markReceived(apptId: string) {
    const today = new Date().toISOString().slice(0, 10);
    await fetch(`/api/admin/appointments/${apptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", receivedDate: today }),
    });
    onChanged();
  }

  async function resendNotify(apptId: string) {
    const res = await fetch(`/api/admin/appointments/${apptId}/notify`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "ส่งไม่สำเร็จ");
    else alert("ส่งแจ้งเตือนสำเร็จ");
  }

  async function deleteAppointment(apptId: string) {
    if (!confirm("ลบนัดหมายนี้?")) return;
    await fetch(`/api/admin/appointments/${apptId}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="space-y-4">
      {!editing ? (
        <div className="flex items-start justify-between">
          <div className="text-sm text-[#5B7B73]">
            <div>ผู้ปกครอง: {patient.guardian_name} · {patient.guardian_phone}</div>
            <div>วันเกิด: {patient.date_of_birth}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-sm text-[#2F6F62] font-medium">
              แก้ไขข้อมูล
            </button>
            {patient.linked && (
              <button onClick={unlinkLine} className="text-sm text-[#946B1C] font-medium">
                ยกเลิกเชื่อม LINE
              </button>
            )}
            <button onClick={deletePatient} className="text-sm text-[#B3452E] font-medium">
              ลบเด็กคนนี้
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={saveEdit} className="grid grid-cols-2 gap-3 bg-white rounded-xl p-4">
          <Input label="ชื่อเด็ก" value={edit.firstName} onChange={(v) => setEdit({ ...edit, firstName: v })} />
          <Input label="นามสกุลเด็ก" value={edit.lastName} onChange={(v) => setEdit({ ...edit, lastName: v })} />
          <Input label="วันเกิด" type="date" value={edit.dateOfBirth} onChange={(v) => setEdit({ ...edit, dateOfBirth: v })} />
          <Input label="ชื่อผู้ปกครอง" value={edit.guardianName} onChange={(v) => setEdit({ ...edit, guardianName: v })} />
          <Input label="เบอร์โทรผู้ปกครอง" value={edit.guardianPhone} onChange={(v) => setEdit({ ...edit, guardianPhone: v })} />
          <Input label="รหัสคิว" value={edit.queueCode} onChange={(v) => setEdit({ ...edit, queueCode: v.toUpperCase() })} />
          {error && <p className="col-span-2 text-sm text-[#B3452E]">{error}</p>}
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-[#5B7B73] px-3 py-2">
              ยกเลิก
            </button>
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

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#1E3D36]">นัดหมาย</span>
          <button onClick={() => setShowAddAppt((v) => !v)} className="text-sm text-[#2F6F62] font-medium">
            + เพิ่มนัดใหม่
          </button>
        </div>

        {showAddAppt && (
          <form onSubmit={addAppointment} className="flex gap-2 items-end flex-wrap mb-3 bg-white rounded-xl p-3">
            <Input label="วันนัด" type="date" value={newAppt.appointmentDate} onChange={(v) => setNewAppt({ ...newAppt, appointmentDate: v })} />
            <Input label="ชื่อวัคซีน" value={newAppt.vaccineName} onChange={(v) => setNewAppt({ ...newAppt, vaccineName: v })} />
            <button type="submit" className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2.5">
              บันทึก
            </button>
          </form>
        )}

        <div className="space-y-2">
          {patient.appointments.length === 0 && (
            <p className="text-sm text-[#A9BDB6]">ยังไม่มีนัดหมาย</p>
          )}
          {patient.appointments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-[#1E3D36]">
                {a.appointment_date} · {a.vaccine_name} ·{" "}
                <span className="text-[#5B7B73]">{STATUS_LABEL[a.status] ?? a.status}</span>
                {a.received_date && (
                  <span className="text-[#2F6F62]"> · รับแล้วเมื่อ {a.received_date}</span>
                )}
              </div>
              <div className="flex gap-3">
                {a.status !== "completed" && (
                  <button onClick={() => markReceived(a.id)} className="text-sm text-[#2F6F62] font-medium">
                    ทำเครื่องหมายว่าได้รับแล้ว
                  </button>
                )}
                <button onClick={() => resendNotify(a.id)} className="text-sm text-[#2F6F62] font-medium">
                  ส่งแจ้งเตือนซ้ำ
                </button>
                <button onClick={() => deleteAppointment(a.id)} className="text-sm text-[#B3452E] font-medium">
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
