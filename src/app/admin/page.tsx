"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  UserPlus,
  Upload,
  X,
  Pencil,
  Trash2,
  Unlink,
  Plus,
  Send,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Baby,
  Cake,
  Phone,
  MapPin,
  User,
  CalendarPlus,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";
import * as XLSX from "xlsx";

type Appointment = {
  id: string;
  appointment_date: string;
  vaccine_name: string;
  status: string;
  received_date: string | null;
  dose_number: number | null;
};

type Patient = {
  id: string;
  title: string | null;
  nickname: string | null;
  first_name: string;
  last_name: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  queue_code: string | null;
  date_of_birth: string;
  address: string | null;
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
  warning: { label: "ล่าช้า", dot: "bg-[#C6892B]", className: "bg-[#FCF1D9] text-[#946B1C]" },
  urgent: { label: "ขาดนัด/ต้องติดตาม", dot: "bg-[#C24E36]", className: "bg-[#FBE4E0] text-[#B3452E]" },
};

function calculateAge(dob: string) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "-";
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ปี`);
  if (months > 0) parts.push(`${months} เดือน`);
  if (days > 0 || parts.length === 0) parts.push(`${days} วัน`);
  return parts.join(" ");
}

function ageInDays(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  return Math.floor((Date.now() - birth.getTime()) / 86400000);
}

type SortKey = "pid" | "age";

function displayName(p: { title?: string | null; first_name: string; last_name: string }) {
  return `${p.title ? p.title : ""}${p.first_name} ${p.last_name}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notifyResult, setNotifyResult] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [modalPatientId, setModalPatientId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "ด.ช.",
    nickname: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    guardianName: "",
    guardianPhone: "",
    queueCode: "",
    address: "",
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

  const sortedPatients = useMemo(() => {
    if (!sortKey) return filteredPatients;
    const dir = sortDir === "asc" ? 1 : -1;

    return [...filteredPatients].sort((a, b) => {
      if (sortKey === "pid") {
        return (a.queue_code ?? "").localeCompare(b.queue_code ?? "", "th") * dir;
      }
      return (ageInDays(a.date_of_birth) - ageInDays(b.date_of_birth)) * dir;
    });
  }, [filteredPatients, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const modalPatient = patients.find((p) => p.id === modalPatientId) ?? null;

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
      title: "ด.ช.",
      nickname: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      guardianName: "",
      guardianPhone: "",
      queueCode: "",
      address: "",
    });
    setShowAddModal(false);
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen bg-[#F3F7F5]">
      <AdminSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onChildren={() => {}}
        onUsers={() => router.push("/admin/users")}
        onSettings={() => router.push("/admin/settings")}
        onLogout={handleLogout}
        activeItem="children"
      />

      <main className="flex-1 min-w-0">
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
              <IconButton onClick={() => setShowAddModal(true)} icon={<UserPlus size={16} />}>
                เพิ่มเด็ก
              </IconButton>
              <IconButton onClick={() => setShowImportModal(true)} icon={<Upload size={16} />}>
                นำเข้าจาก Excel
              </IconButton>
            </div>
          </div>

          {notifyResult && (
            <div className="mb-4 rounded-xl bg-white px-4 py-3 text-sm text-[#1E3D36] shadow-sm border border-[#E5ECE9]">
              {notifyResult}
            </div>
          )}

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FAAA2]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อเด็กหรือ PID..."
              className="w-full rounded-xl border border-[#E5ECE9] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1E3D36] placeholder:text-[#A9BDB6] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5ECE9] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F7FAF9] text-[#5B7B73] text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">ชื่อเด็ก</th>
                  <SortableHeader label="PID" sortKey="pid" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="อายุ" sortKey="age" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 font-medium">LINE</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#5B7B73]">
                      กำลังโหลด...
                    </td>
                  </tr>
                )}
                {!loading && filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#5B7B73]">
                      {search ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีข้อมูลเด็ก"}
                    </td>
                  </tr>
                )}
                {sortedPatients.map((p) => {
                  const badge = BADGE_STYLE[p.badge];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setModalPatientId(p.id)}
                      className="border-t border-[#EFF4F2] cursor-pointer hover:bg-[#FAFCFB] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-[#1E3D36] font-medium">
                        {displayName(p)}
                      </td>
                      <td className="px-5 py-3.5 text-[#1E3D36]">{p.queue_code ?? "-"}</td>
                      <td className="px-5 py-3.5 text-[#5B7B73]">{calculateAge(p.date_of_birth)}</td>
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
      </main>

      <AddPatientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleAdd}
        saving={saving}
        error={formError}
      />

      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={loadPatients}
      />

      <PatientModal
        patient={modalPatient}
        open={modalPatientId !== null}
        onClose={() => setModalPatientId(null)}
        onChanged={loadPatients}
      />
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  dir: "asc" | "desc";
  onClick: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th className="px-5 py-3 font-medium">
      <button
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 hover:text-[#1E3D36] transition-colors ${active ? "text-[#1E3D36]" : ""}`}
      >
        {label}
        <Icon size={13} />
      </button>
    </th>
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

type FormState = {
  title: string;
  nickname: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  queueCode: string;
  address: string;
};

function AddPatientModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  saving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error: string;
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-[#0F241F]/40 transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto transition-all duration-150 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#152D28]">เพิ่มเด็ก</h2>
            <button onClick={onClose} className="text-[#8FAAA2] hover:text-[#1E3D36] p-1">
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-[#8FAAA2] mb-4">
            ยังไม่ต้องลงวันนัดตอนนี้ก็ได้ — เพิ่มนัดหมายทีหลังได้จากหน้ารายละเอียดเด็ก
          </p>

          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-[#1E3D36] font-medium">คำนำหน้า</span>
              <select
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
              >
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
              </select>
            </label>
            <Input label="ชื่อเด็ก" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
            <Input label="ชื่อเล่น (ไม่บังคับ)" value={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} required={false} />
            <Input label="นามสกุลเด็ก" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
            <Input label="วันเกิด" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
            <Input label="ชื่อผู้ปกครอง (ไม่บังคับ)" value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} required={false} />
            <Input label="เบอร์โทรผู้ปกครอง (ไม่บังคับ)" value={form.guardianPhone} onChange={(v) => setForm({ ...form, guardianPhone: v })} required={false} />
            <Input label="PID (เช่น A01)" value={form.queueCode} onChange={(v) => setForm({ ...form, queueCode: v.toUpperCase() })} />
            <div className="col-span-2">
              <Input label="ที่อยู่" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            </div>

            {error && <p className="col-span-2 text-sm text-[#B3452E]">{error}</p>}

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
        </div>
      </div>
    </div>
  );
}

function ImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<
    { pid: string; title: string; nickname: string; firstName: string; lastName: string; dateOfBirth: string; address: string; guardianName: string; guardianPhone: string }[]
  >([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; failed: { row: number; pid: string; reason: string }[] } | null>(null);

  function excelDateToISO(value: unknown): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number") {
      const d = XLSX.SSF.parse_date_code(value);
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    const s = String(value ?? "").trim();
    const parsed = new Date(s);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return s;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

        const dataRows = raw.slice(1); // skip header row
        const parsed = dataRows
          .filter((r) => r.some((cell) => cell !== undefined && cell !== ""))
          .map((r) => ({
            pid: String(r[0] ?? "").trim(),
            title: String(r[1] ?? "").trim(),
            nickname: String(r[2] ?? "").trim(),
            firstName: String(r[3] ?? "").trim(),
            lastName: String(r[4] ?? "").trim(),
            dateOfBirth: excelDateToISO(r[5]),
            address: String(r[6] ?? "").trim(),
            guardianName: String(r[7] ?? "").trim(),
            guardianPhone: String(r[8] ?? "").trim(),
          }));

        setRows(parsed);
      } catch {
        setParseError("อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบว่าเป็นไฟล์ .xlsx หรือ .csv ที่ถูกต้อง");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function handleImport() {
    setImporting(true);
    const res = await fetch("/api/admin/patients/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
    onImported();
  }

  function downloadTemplate() {
    const header = ["PID", "คำนำหน้า (ด.ช./ด.ญ.)", "ชื่อเล่น (ไม่บังคับ)", "ชื่อ", "นามสกุล", "วันเกิด (YYYY-MM-DD)", "ที่อยู่", "ชื่อผู้ปกครอง", "เบอร์โทร"];
    const example = ["A01", "ด.ช.", "น้องเอ", "สมชาย", "ใจดี", "2023-05-10", "123 หมู่ 4 ต.บ้านใหม่ อ.เมือง", "สมหญิง ใจดี", "0812345678"];
    const ws = XLSX.utils.aoa_to_sheet([header, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลเด็ก");
    XLSX.writeFile(wb, "แม่แบบนำเข้าข้อมูลเด็ก.xlsx");
  }

  function handleClose() {
    setRows([]);
    setFileName("");
    setParseError("");
    setResult(null);
    onClose();
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-[#0F241F]/40 transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transition-all duration-150 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#152D28]">นำเข้าข้อมูลเด็กจาก Excel</h2>
            <button onClick={handleClose} className="text-[#8FAAA2] hover:text-[#1E3D36] p-1">
              <X size={20} />
            </button>
          </div>

          <div className="rounded-lg bg-[#F7FAF9] border border-[#E5ECE9] px-4 py-3 mb-4 text-sm text-[#5B7B73]">
            <p className="mb-2">
              ไฟล์ต้องมี 9 คอลัมน์ตามลำดับนี้ (แถวแรกเป็นหัวตาราง ไม่ต้องตรงชื่อเป๊ะๆ ก็ได้):
            </p>
            <p className="font-medium text-[#1E3D36] mb-2">
              PID · คำนำหน้า (ด.ช./ด.ญ.) · ชื่อเล่น (ไม่บังคับ) · ชื่อ · นามสกุล · วันเกิด · ที่อยู่ · ชื่อผู้ปกครอง (ไม่บังคับ) · เบอร์โทร (ไม่บังคับ)
            </p>
            <button onClick={downloadTemplate} className="text-[#2F6F62] font-medium hover:underline">
              ดาวน์โหลดแม่แบบ Excel
            </button>
          </div>

          <label className="block mb-4">
            <span className="text-sm text-[#1E3D36] font-medium">เลือกไฟล์ (.xlsx หรือ .csv)</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="mt-1 w-full text-sm text-[#1E3D36]"
            />
            {fileName && <p className="text-xs text-[#8FAAA2] mt-1">ไฟล์ที่เลือก: {fileName}</p>}
          </label>

          {parseError && <p className="text-sm text-[#B3452E] mb-4">{parseError}</p>}

          {rows.length > 0 && !result && (
            <div className="mb-4">
              <p className="text-sm text-[#1E3D36] font-medium mb-2">พบข้อมูล {rows.length} แถว (แสดงตัวอย่าง 5 แถวแรก)</p>
              <div className="overflow-x-auto rounded-lg border border-[#E5ECE9]">
                <table className="w-full text-xs">
                  <thead className="bg-[#F7FAF9] text-[#5B7B73]">
                    <tr>
                      <th className="px-3 py-2 text-left">PID</th>
                      <th className="px-3 py-2 text-left">ชื่อ-นามสกุล</th>
                      <th className="px-3 py-2 text-left">วันเกิด</th>
                      <th className="px-3 py-2 text-left">ที่อยู่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t border-[#EFF4F2]">
                        <td className="px-3 py-2">{r.pid}</td>
                        <td className="px-3 py-2">{r.title}{r.firstName} {r.lastName}</td>
                        <td className="px-3 py-2">{r.dateOfBirth}</td>
                        <td className="px-3 py-2">{r.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="mt-4 rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2.5 disabled:opacity-60"
              >
                {importing ? "กำลังนำเข้า..." : `นำเข้า ${rows.length} รายการ`}
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#E4F3EC] text-[#2F6F62] px-4 py-3 text-sm">
                นำเข้าสำเร็จ {result.imported} จาก {result.total} รายการ
              </div>
              {result.failed.length > 0 && (
                <div className="rounded-lg bg-[#FBE4E0] px-4 py-3 text-sm text-[#B3452E]">
                  <p className="font-medium mb-1">รายการที่ไม่สำเร็จ ({result.failed.length}):</p>
                  <ul className="space-y-0.5">
                    {result.failed.map((f, i) => (
                      <li key={i}>แถวที่ {f.row} (PID: {f.pid}) — {f.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={handleClose}
                className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2.5"
              >
                เสร็จสิ้น
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientModal({
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
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-[#0F241F]/40 transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto transition-all duration-150 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {patient && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Baby size={20} className="text-[#2F6F62]" />
                <h2 className="text-lg font-semibold text-[#152D28]">ข้อมูลเด็ก</h2>
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

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm py-1.5">
      <span className="text-[#8FAAA2] mt-0.5">{icon}</span>
      <span className="text-[#5B7B73] w-28 shrink-0">{label}</span>
      <span className="text-[#1E3D36]">{value || "-"}</span>
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
    title: patient.title ?? "ด.ช.",
    nickname: patient.nickname ?? "",
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth,
    guardianName: patient.guardian_name ?? "",
    guardianPhone: patient.guardian_phone ?? "",
    queueCode: patient.queue_code ?? "",
    address: patient.address ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showAddAppt, setShowAddAppt] = useState(false);
  const [newAppt, setNewAppt] = useState({ appointmentDate: "", vaccineName: "", doseNumber: "" });
  const [vaccineOptions, setVaccineOptions] = useState<string[]>([]);
  const [clinicName, setClinicName] = useState("");

  useEffect(() => {
    setEdit({
      title: patient.title ?? "ด.ช.",
      nickname: patient.nickname ?? "",
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      guardianName: patient.guardian_name ?? "",
      guardianPhone: patient.guardian_phone ?? "",
      queueCode: patient.queue_code ?? "",
      address: patient.address ?? "",
    });
    setEditing(false);
  }, [patient]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.settings?.vaccine_list ?? "")
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean);
        setVaccineOptions(list);
        setClinicName(data.settings?.clinic_name ?? "");
      });
  }, []);

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
      body: JSON.stringify({
        patientId: patient.id,
        appointmentDate: newAppt.appointmentDate,
        vaccineName: newAppt.vaccineName,
        doseNumber: newAppt.doseNumber ? Number(newAppt.doseNumber) : null,
      }),
    });
    setNewAppt({ appointmentDate: "", vaccineName: "", doseNumber: "" });
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

  async function revertReceived(apptId: string) {
    if (!confirm('เปลี่ยนกลับเป็น "ยังไม่ได้รับวัคซีน" สำหรับนัดนี้?')) return;
    await fetch(`/api/admin/appointments/${apptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "scheduled", receivedDate: null }),
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

  const badge = BADGE_STYLE[patient.badge];
  const pendingAppointments = [...patient.appointments]
    .filter((a) => a.status !== "completed")
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
  const nextAppt = pendingAppointments[0] ?? null;
  const completedAppointments = [...patient.appointments]
    .filter((a) => a.status === "completed")
    .sort((a, b) => (b.received_date ?? "").localeCompare(a.received_date ?? ""));
  const isOverdue = nextAppt ? nextAppt.appointment_date < new Date().toISOString().slice(0, 10) : false;

  const addApptForm = (
    <form onSubmit={addAppointment} className="flex gap-2 items-end flex-wrap mb-3 bg-white/70 border border-[#D8E5E0] rounded-xl p-3">
      <label className="block">
        <span className="text-sm text-[#1E3D36] font-medium">วันนัด</span>
        <input
          required
          type="date"
          value={newAppt.appointmentDate}
          onChange={(e) => setNewAppt({ ...newAppt, appointmentDate: e.target.value })}
          className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
        />
      </label>
      <label className="block">
        <span className="text-sm text-[#1E3D36] font-medium">ชื่อวัคซีน</span>
        {vaccineOptions.length > 0 ? (
          <select
            required
            value={newAppt.vaccineName}
            onChange={(e) => setNewAppt({ ...newAppt, vaccineName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
          >
            <option value="" disabled>เลือกวัคซีน</option>
            {vaccineOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ) : (
          <input
            required
            value={newAppt.vaccineName}
            onChange={(e) => setNewAppt({ ...newAppt, vaccineName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
          />
        )}
      </label>
      <label className="block w-20">
        <span className="text-sm text-[#1E3D36] font-medium">เข็มที่</span>
        <input
          type="number"
          min={1}
          value={newAppt.doseNumber}
          onChange={(e) => setNewAppt({ ...newAppt, doseNumber: e.target.value })}
          className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
        />
      </label>
      <button type="submit" className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2.5">
        บันทึก
      </button>
    </form>
  );

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* LEFT COLUMN */}
      <div className="space-y-4">
        <div className="rounded-xl bg-[#F7FAF9] border border-[#E5ECE9] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-full bg-[#DCEEE7] flex items-center justify-center shrink-0">
              <Baby size={28} className="text-[#2F6F62]" />
            </div>
            <div>
              <div className="font-semibold text-[#152D28]">{displayName(patient)}</div>
              <div className="text-xs text-[#5B7B73]">PID: {patient.queue_code ?? "-"}</div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${badge.className}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
          </div>

          {!editing ? (
            <>
              <div className="divide-y divide-[#EFF4F2]">
                <InfoRow icon={<User size={15} />} label="ชื่อเล่น" value={patient.nickname ?? ""} />
                <InfoRow icon={<Cake size={15} />} label="วันเกิด" value={`${patient.date_of_birth} (อายุ ${calculateAge(patient.date_of_birth)})`} />
                <InfoRow icon={<User size={15} />} label="ชื่อผู้ปกครอง" value={patient.guardian_name ?? ""} />
                <InfoRow icon={<Phone size={15} />} label="เบอร์โทร" value={patient.guardian_phone ?? ""} />
                <InfoRow icon={<MapPin size={15} />} label="ที่อยู่" value={patient.address ?? ""} />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <SmallButton onClick={() => setEditing(true)} icon={<Pencil size={14} />}>
                  แก้ไขข้อมูล
                </SmallButton>
                {patient.linked ? (
                  <SmallButton onClick={unlinkLine} icon={<Unlink size={14} />} tone="warning">
                    ยกเลิกเชื่อม LINE
                  </SmallButton>
                ) : (
                  <span className="text-xs text-[#A9BDB6] flex items-center px-2.5">ยังไม่เชื่อม LINE</span>
                )}
                <SmallButton onClick={deletePatient} icon={<Trash2 size={14} />} tone="danger">
                  ลบเด็กคนนี้
                </SmallButton>
              </div>
            </>
          ) : (
            <form onSubmit={saveEdit} className="grid grid-cols-2 gap-3 bg-white border border-[#E5ECE9] rounded-xl p-3">
              <label className="block">
                <span className="text-sm text-[#1E3D36] font-medium">คำนำหน้า</span>
                <select
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                >
                  <option value="ด.ช.">ด.ช.</option>
                  <option value="ด.ญ.">ด.ญ.</option>
                </select>
              </label>
              <Input label="ชื่อเล่น (ไม่บังคับ)" value={edit.nickname} onChange={(v) => setEdit({ ...edit, nickname: v })} required={false} />
              <Input label="ชื่อเด็ก" value={edit.firstName} onChange={(v) => setEdit({ ...edit, firstName: v })} />
              <Input label="นามสกุลเด็ก" value={edit.lastName} onChange={(v) => setEdit({ ...edit, lastName: v })} />
              <Input label="วันเกิด" type="date" value={edit.dateOfBirth} onChange={(v) => setEdit({ ...edit, dateOfBirth: v })} />
              <Input label="ชื่อผู้ปกครอง (ไม่บังคับ)" value={edit.guardianName} onChange={(v) => setEdit({ ...edit, guardianName: v })} required={false} />
              <Input label="เบอร์โทรผู้ปกครอง (ไม่บังคับ)" value={edit.guardianPhone} onChange={(v) => setEdit({ ...edit, guardianPhone: v })} required={false} />
              <Input label="PID" value={edit.queueCode} onChange={(v) => setEdit({ ...edit, queueCode: v.toUpperCase() })} />
              <div className="col-span-2">
                <Input label="ที่อยู่" value={edit.address} onChange={(v) => setEdit({ ...edit, address: v })} />
              </div>
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
        </div>

        {/* All appointments — compact list */}
        <div className="rounded-xl bg-white border border-[#E5ECE9] p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarPlus size={16} className="text-[#2F6F62]" />
            <span className="text-sm font-semibold text-[#152D28]">นัดหมายทั้งหมด</span>
          </div>
          {patient.appointments.length === 0 ? (
            <p className="text-sm text-[#A9BDB6]">ยังไม่มีนัดหมาย</p>
          ) : (
            <div className="divide-y divide-[#EFF4F2]">
              {[...patient.appointments]
                .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="text-[#1E3D36]">{a.appointment_date} · {a.vaccine_name}{a.dose_number ? ` (เข็มที่ ${a.dose_number})` : ""}</div>
                    </div>
                    <span className={a.status === "completed" ? "text-[#2F6F62] text-xs" : "text-[#8FAAA2] text-xs"}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-4">
        <div className="rounded-xl bg-[#EAF3FB] border border-[#CFE3F5] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarPlus size={16} className="text-[#2A6AA8]" />
              <span className="text-sm font-semibold text-[#152D28]">นัดหมายครั้งถัดไป</span>
            </div>
            <SmallButton onClick={() => setShowAddAppt((v) => !v)} icon={<Plus size={14} />}>
              ทำนัดใหม่
            </SmallButton>
          </div>

          {showAddAppt && addApptForm}

          {nextAppt ? (
            <div>
              <div className="text-[#152D28] font-medium">{nextAppt.appointment_date}</div>
              <div className="text-sm text-[#1E3D36] mt-1">
                วัคซีน: {nextAppt.vaccine_name}{nextAppt.dose_number ? ` (เข็มที่ ${nextAppt.dose_number})` : ""}
              </div>
              {clinicName && <div className="text-sm text-[#1E3D36] flex items-center gap-1 mt-1"><MapPin size={14} />{clinicName}</div>}
              <div className="mt-2">
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${isOverdue ? "bg-[#FBE4E0] text-[#B3452E]" : "bg-white text-[#2A6AA8]"}`}>
                  {isOverdue ? "เลยกำหนดนัด" : "ยังไม่ถึงกำหนด"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <SmallButton onClick={() => markReceived(nextAppt.id)} icon={<CheckCircle2 size={14} />}>
                  ได้รับแล้ว
                </SmallButton>
                <SmallButton onClick={() => resendNotify(nextAppt.id)} icon={<Send size={14} />}>
                  ส่งแจ้งเตือนซ้ำ
                </SmallButton>
                <SmallButton onClick={() => deleteAppointment(nextAppt.id)} icon={<Trash2 size={14} />} tone="danger">
                  ยกเลิกนัด
                </SmallButton>
              </div>
            </div>
          ) : (
            !showAddAppt && <p className="text-sm text-[#5B7B73]">ไม่มีนัดที่ต้องติดตามตอนนี้</p>
          )}
        </div>

        <div className="rounded-xl bg-white border border-[#E5ECE9] p-4">
          <span className="text-sm font-semibold text-[#152D28]">ประวัติการรับวัคซีน</span>
          {completedAppointments.length === 0 ? (
            <p className="text-sm text-[#A9BDB6] mt-2">ยังไม่มีประวัติการรับวัคซีน</p>
          ) : (
            <div className="mt-2 divide-y divide-[#EFF4F2]">
              {completedAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="text-[#1E3D36]">
                      {a.received_date ?? a.appointment_date} · {a.vaccine_name}{a.dose_number ? ` (เข็มที่ ${a.dose_number})` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs text-[#2F6F62]">
                      <CheckCircle2 size={13} /> รับแล้ว
                    </span>
                    <button onClick={() => revertReceived(a.id)} title="ยกเลิก (ยังไม่ได้รับ)" className="text-[#946B1C] hover:bg-[#FCF1D9] rounded p-1">
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-[#1E3D36] font-medium">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
      />
    </label>
  );
}
