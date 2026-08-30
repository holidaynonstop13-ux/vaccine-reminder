"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, KeyRound, X } from "lucide-react";
import { AdminSidebar } from "@/components/admin-sidebar";

type AdminUser = {
  id: string;
  username: string;
  role: "admin" | "staff";
  created_at: string;
};

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  admin: "แอดมิน",
  staff: "เจ้าหน้าที่",
};

export default function UsersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [newUser, setNewUser] = useState({ username: "", password: "", role: "staff" as "admin" | "staff" });
  const [userError, setUserError] = useState("");
  const [userSaving, setUserSaving] = useState(false);

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUsername, setResetUsername] = useState("");

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setUserSaving(true);
    setUserError("");

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

    setNewUser({ username: "", password: "", role: "staff" });
    setUserSaving(false);
    loadUsers();
  }

  async function changeRole(id: string, role: "admin" | "staff") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    loadUsers();
  }

  async function deleteUser(id: string, username: string) {
    if (!confirm(`ลบผู้ใช้ "${username}"?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    loadUsers();
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
        onUsers={() => {}}
        onSettings={() => router.push("/admin/settings")}
        onLogout={handleLogout}
        activeItem="users"
      />

      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-semibold text-[#152D28] tracking-tight mb-1">ผู้ใช้แอดมิน</h1>
          <p className="text-sm text-[#5B7B73] mb-6">จัดการบัญชีและสิทธิ์การใช้งานระบบ</p>

          <form
            onSubmit={handleAddUser}
            className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-[#E5ECE9] flex gap-3 items-end flex-wrap"
          >
            <label className="block">
              <span className="text-sm text-[#1E3D36] font-medium">ชื่อผู้ใช้ใหม่</span>
              <input
                required
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[#1E3D36] font-medium">รหัสผ่าน (8 ตัวขึ้นไป)</span>
              <input
                required
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[#1E3D36] font-medium">สิทธิ์</span>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "staff" })}
                className="mt-1 rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
              >
                <option value="staff">เจ้าหน้าที่</option>
                <option value="admin">แอดมิน</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={userSaving}
              className="rounded-lg bg-[#2F6F62] text-white text-sm font-medium px-4 py-2.5 disabled:opacity-60"
            >
              {userSaving ? "กำลังบันทึก..." : "เพิ่มผู้ใช้"}
            </button>
            {userError && <p className="w-full text-sm text-[#B3452E]">{userError}</p>}
          </form>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5ECE9] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F7FAF9] text-[#5B7B73] text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">ชื่อผู้ใช้</th>
                  <th className="px-5 py-3 font-medium">สิทธิ์</th>
                  <th className="px-5 py-3 font-medium">สร้างเมื่อ</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#5B7B73]">
                      กำลังโหลด...
                    </td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[#5B7B73]">
                      ยังไม่มีผู้ใช้
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[#EFF4F2]">
                    <td className="px-5 py-3.5 text-[#1E3D36] font-medium">{u.username}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value as "admin" | "staff")}
                        className="rounded-lg border border-[#D8E5E0] px-2 py-1.5 text-sm text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                      >
                        <option value="staff">{ROLE_LABEL.staff}</option>
                        <option value="admin">{ROLE_LABEL.admin}</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-[#5B7B73]">
                      {new Date(u.created_at).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setResetUserId(u.id);
                            setResetUsername(u.username);
                          }}
                          className="flex items-center gap-1.5 text-sm text-[#2F6F62] hover:bg-[#E4F3EC] rounded-lg px-2 py-1.5"
                        >
                          <KeyRound size={14} /> เปลี่ยนรหัสผ่าน
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.username)}
                          className="flex items-center gap-1.5 text-sm text-[#B3452E] hover:bg-[#FBE4E0] rounded-lg px-2 py-1.5"
                        >
                          <Trash2 size={14} /> ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ResetPasswordModal
        userId={resetUserId}
        username={resetUsername}
        onClose={() => setResetUserId(null)}
      />
    </div>
  );
}

function ResetPasswordModal({
  userId,
  username,
  onClose,
}: {
  userId: string | null;
  username: string;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const open = userId !== null;

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setDone(false);
    }
  }, [open, userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setSaving(false);
      return;
    }
    setSaving(false);
    setDone(true);
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-[#0F241F]/40 transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transition-all duration-150 ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#152D28]">เปลี่ยนรหัสผ่าน</h2>
            <button onClick={onClose} className="text-[#8FAAA2] hover:text-[#1E3D36] p-1">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-[#5B7B73] mb-4">สำหรับผู้ใช้ &quot;{username}&quot;</p>

          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-[#2F6F62]">เปลี่ยนรหัสผ่านสำเร็จ</p>
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-[#2F6F62] text-white text-sm font-medium py-2.5"
              >
                ปิด
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <label className="block">
                <span className="text-sm text-[#1E3D36] font-medium">รหัสผ่านใหม่ (8 ตัวขึ้นไป)</span>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-[#1E3D36] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
                />
              </label>
              {error && <p className="text-sm text-[#B3452E]">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#2F6F62] text-white text-sm font-medium py-2.5 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
