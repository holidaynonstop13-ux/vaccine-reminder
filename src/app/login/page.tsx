"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (สถานะ ${res.status})`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? `เข้าสู่ระบบไม่สำเร็จ (สถานะ ${res.status})`);
        setLoading(false);
        return;
      }

      router.push(params.get("returnTo") || "/admin");
      router.refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`เชื่อมต่อไม่สำเร็จ: ${detail}`);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0D4A49_0%,#0B3D42_100%)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <ShieldIcon />
          <h1 className="mt-4 text-xl font-semibold text-white">
            ระบบจัดการวัคซีน
          </h1>
          <p className="mt-1 text-sm text-[#9DBDB4]">สำหรับเจ้าหน้าที่เท่านั้น</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <label className="block">
            <span className="text-sm text-[#173B3B] font-medium">ชื่อผู้ใช้</span>
            <input
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CFE7E1] px-3 py-2.5 text-[#173B3B] focus:outline-none focus:border-[#5BCBB2] focus:ring-2 focus:ring-[rgba(91,203,178,0.14)]"
            />
          </label>
          <label className="block">
            <span className="text-sm text-[#173B3B] font-medium">รหัสผ่าน</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CFE7E1] px-3 py-2.5 text-[#173B3B] focus:outline-none focus:border-[#5BCBB2] focus:ring-2 focus:ring-[rgba(91,203,178,0.14)]"
            />
          </label>

          {error && <p className="text-sm text-[#D94C58]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-[#177C6D] text-white font-semibold py-3 shadow-[0_4px_12px_rgba(23,124,109,0.15)] hover:bg-[#12695D] transition-colors disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M28 4L48 12V26C48 38 39.5 47.5 28 52C16.5 47.5 8 38 8 26V12L28 4Z"
        fill="#24B89A"
      />
      <path
        d="M19 27L25 33L37 21"
        stroke="#173B3B"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
