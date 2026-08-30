"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Bell,
  UserPlus,
  ShieldPlus,
  LogOut,
  X,
  Pencil,
  Trash2,
  Unlink,
  Plus,
  Send,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

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

const BADGE_STYLE: Record<Patient["badge"], { label: string; dot: string; className: string }> = {
  normal: { label: "ปกติ", dot: "bg-[#2F6F62]", className: "bg-[#E4F3EC] text-[#2F6F62]" },
  warning: { label: "ใกล้นัด", dot: "bg-[#C6892B]", className: "bg-[#FCF1D9] text-[#946B1C]" },
  urgent: { label: "ขาดนัด", dot: "bg-[#C24E36]", className: "bg-[#FBE4E0] text-[#B3452E]" },
};

export default function AdminPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notifyResult, setNotifyResult] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [drawerPatientId, setDrawerPatientId] = useState<string | null>(null);

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

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      return fullName.includes(q) || (p.queue_code ?? "").toLowerCase().includes(q);
    });
  }, [patients, search]);

  const drawerPatient = patients.find((p) => p.id === drawerPatientId) ?? null;

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
    <main className="min-h-screen bg-[#F3F7F5]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#152D28] tracking-tight">
              ระบบจัดการวัคซีน
            </h1>
            <p className="text-sm text-[#5B7B73] mt-0.5">เด็กทั้งหมด {patients.length} คน</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <IconButton onClick={handleNotifyNow} disabled={notifying} icon={<Bell size={16} />} primary>
              {notifying ? "กำลังส่ง..." : "ส่งแจ้งเตือนตอนนี้"}
            </IconButton>
            <IconButton onClick={() => setShowForm((v) => !v)} icon={<UserPlus size={16} />}>
              เพิ่มเด็ก
            </IconButton>
            <IconButton onClick={() => setShowUserForm((v) => !v)} icon={<ShieldPlus size={16} />}>
              ผู้ใช้แอดมิน
            </IconButton>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-[#5B7B73] hover:text-[#1E3D36] px-3 py-2"
            >
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </div>

        {notifyResult && (
          <div className="mb-4 rounded-xl bg-white px-4 py-3 text-sm text-[#1E3D36] shadow-sm border border-[#E5ECE9]">
            {notifyResult}
          </div>
        )}

        {showUserForm && (
          <form
            onSubmit={handleAddUser}
            className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-[#E5ECE9] flex gap-3 items-end flex-wrap"
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
          <form onSubmit={handleAdd} className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-[#E5ECE9] grid grid-cols-2 gap-3">
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

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FAAA2]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเด็กหรือรหัสคิว..."
            className="w-full rounded-xl border border-[#E5ECE9] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1E3D36] placeholder:text-[#A9BDB6] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5ECE9] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F7FAF9] text-[#5B7B73] text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">ชื่อเด็ก</th>
                <th className="px-5 py-3 font-medium">รหัสคิว</th>
                <th className="px-5 py-3 font-medium">สถานะ</th>
                <th className="px-5 py-3 font-medium">LINE</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#5B7B73]">
                    กำลังโหลด...
                  </td>
                </tr>
              )}
              {!loading && filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#5B7B73]">
                    {search ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีข้อมูลเด็ก"}
                  </td>
                </tr>
              )}
              {filteredPatients.map((p) => {
                const badge = BADGE_STYLE[p.badge];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setDrawerPatientId(p.id)}
                    className="border-t border-[#EFF4F2] cursor-pointer hover:bg-[#FAFCFB] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-[#1E3D36] font-medium">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-5 py-3.5 text-[#1E3D36]">{p.queue_code ?? "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.linked ? (
                        <span className="text-[#2F6F62] font-medium">เชื่อมแล้ว</span>
                      ) : (
                        <span className="text-[#A9BDB6]">ยังไม่เชื่อม</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#A9BDB6]">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PatientDrawer
        patient={drawerPatient}
        open={drawerPatientId !== null}
        onClose={() => setDrawerPatientId(null)}
        onChanged={loadPatients}
      />
    </main>
  );
}

function IconButton({
  children,
  icon,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg text-sm font-medium px-3.5 py-2 disabled:opacity-60 transition-colors ${
        primary
          ? "bg-[#2F6F62] text-white hover:bg-[#285F54]"
          : "border border-[#D8E5E0] text-[#2F6F62] hover:bg-[#EEF5F2]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function PatientDrawer({
  patient,
  open,
  onClose,
  onChanged,
}: {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-[#0F241F]/35 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {patient && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#152D28]">
                  {patient.first_name} {patient.last_name}
                </h2>
                <p className="text-sm text-[#5B7B73] mt-0.5">รหัสคิว: {patient.queue_code ?? "-"}</p>
              </div>
              <button onClick={onClose} className="text-[#8FAAA2] hover:text-[#1E3D36] p-1">
                <X size={20} />
              </button>
            </div>
            <PatientDetail patient={patient} onChanged={onChanged} onDeleted={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}

function PatientDetail({
  patient,
  onChanged,
  onDeleted,
}: {
  patient: Patient;
  onChanged: () => void;
  onDeleted: () => void;
}) {
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

  useEffect(() => {
    setEdit({
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      guardianName: patient.guardian_name,
      guardianPhone: patient.guardian_phone,
      queueCode: patient.queue_code ?? "",
    });
    setEditing(false);
  }, [patient]);

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
    onDeleted();
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
    <div className="space-y-6">
      {!editing ? (
        <div className="rounded-xl bg-[#F7FAF9] border border-[#E5ECE9] p-4">
          <div className="text-sm text-[#5B7B73] space-y-0.5 mb-3">
            <div>ผู้ปกครอง: {patient.guardian_name} · {patient.guardian_phone}</div>
            <div>วันเกิด: {patient.date_of_birth}</div>
            <div>
              LINE:{" "}
              {patient.linked ? (
                <span className="text-[#2F6F62] font-medium">เชื่อมแล้ว</span>
              ) : (
                <span className="text-[#A9BDB6]">ยังไม่เชื่อม</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SmallButton onClick={() => setEditing(true)} icon={<Pencil size={14} />}>
              แก้ไขข้อมูล
            </SmallButton>
            {patient.linked && (
              <SmallButton onClick={unlinkLine} icon={<Unlink size={14} />} tone="warning">
                ยกเลิกเชื่อม LINE
              </SmallButton>
            )}
            <SmallButton onClick={deletePatient} icon={<Trash2 size={14} />} tone="danger">
              ลบเด็กคนนี้
            </SmallButton>
          </div>
        </div>
      ) : (
        <form onSubmit={saveEdit} className="grid grid-cols-2 gap-3 bg-[#F7FAF9] border border-[#E5ECE9] rounded-xl p-4">
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
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#152D28]">นัดหมาย</span>
          <SmallButton onClick={() => setShowAddAppt((v) => !v)} icon={<Plus size={14} />}>
            เพิ่มนัดใหม่
          </SmallButton>
        </div>

        {showAddAppt && (
          <form onSubmit={addAppointment} className="flex gap-2 items-end flex-wrap mb-3 bg-[#F7FAF9] border border-[#E5ECE9] rounded-xl p-3">
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
            <div key={a.id} className="border border-[#E5ECE9] rounded-xl p-3">
              <div className="text-sm text-[#1E3D36] mb-2">
                <div className="font-medium">{a.appointment_date} · {a.vaccine_name}</div>
                <div className="text-[#5B7B73] text-xs mt-0.5">
                  {STATUS_LABEL[a.status] ?? a.status}
                  {a.received_date && ` · รับแล้วเมื่อ ${a.received_date}`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.status !== "completed" && (
                  <SmallButton onClick={() => markReceived(a.id)} icon={<CheckCircle2 size={14} />}>
                    ได้รับแล้ว
                  </SmallButton>
                )}
                <SmallButton onClick={() => resendNotify(a.id)} icon={<Send size={14} />}>
                  ส่งแจ้งเตือนซ้ำ
                </SmallButton>
                <SmallButton onClick={() => deleteAppointment(a.id)} icon={<Trash2 size={14} />} tone="danger">
                  ลบ
                </SmallButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SmallButton({
  children,
  icon,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[#B3452E] hover:bg-[#FBE4E0]"
      : tone === "warning"
      ? "text-[#946B1C] hover:bg-[#FCF1D9]"
      : "text-[#2F6F62] hover:bg-[#E4F3EC]";
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg text-xs font-medium px-2.5 py-1.5 transition-colors ${toneClass}`}
    >
      {icon}
      {children}
    </button>
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
