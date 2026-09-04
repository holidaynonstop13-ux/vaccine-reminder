"use client";

import { useEffect, useState } from "react";
import liff from "@line/liff";

type Status = "loading" | "ready" | "submitting" | "success" | "error";

export default function LinkPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [childName, setChildName] = useState("");

  const [queueCode, setQueueCode] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error("ไม่พบค่า NEXT_PUBLIC_LIFF_ID ในระบบ (env var ไม่ถูกตั้งค่า)");
        }
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        setStatus("ready");
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setErrorMessage(`เปิดหน้านี้ผ่าน LINE ไม่สำเร็จ: ${detail}`);
        setStatus("error");
      }
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const idToken = liff.getIDToken();
      const res = await fetch("/api/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          queueCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        setStatus("ready");
        return;
      }

      setChildName(data.childName);
      setStatus("success");
    } catch {
      setErrorMessage("เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      setStatus("ready");
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F7F5] flex items-start justify-center px-5 pt-10 pb-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <ShieldIcon />
          <h1 className="mt-4 text-xl font-semibold text-[#1E3D36] text-center">
            ลงทะเบียนรับแจ้งเตือนวัคซีน
          </h1>
          <p className="mt-1 text-sm text-[#5B7B73] text-center">
            กรอก PID ที่ได้รับจากเจ้าหน้าที่ เพื่อรับการแจ้งเตือนวันนัดผ่าน LINE
          </p>
        </div>

        {status === "loading" && (
          <div className="text-center text-sm text-[#5B7B73] py-10">
            กำลังเชื่อมต่อกับ LINE...
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-2xl p-5 text-center text-sm text-[#B3452E]">
            {errorMessage}
          </div>
        )}

        {(status === "ready" || status === "submitting") && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
          >
            <Field
              label="PID"
              value={queueCode}
              onChange={setQueueCode}
              placeholder="เช่น A01"
            />

            {errorMessage && (
              <p className="text-sm text-[#B3452E]">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-xl bg-[#2F6F62] text-white font-medium py-3 disabled:opacity-60"
            >
              {status === "submitting" ? "กำลังบันทึก..." : "ยืนยันข้อมูล"}
            </button>
          </form>
        )}

        {status === "success" && (
          <div className="bg-white rounded-2xl p-6 text-center space-y-2">
            <div className="text-3xl">✅</div>
            <p className="text-[#1E3D36] font-medium">
              ลงทะเบียนสำเร็จสำหรับ {childName}
            </p>
            <p className="text-sm text-[#5B7B73]">
              คุณจะได้รับข้อความแจ้งเตือนผ่าน LINE เมื่อถึงวันนัดฉีดวัคซีน
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
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
        placeholder={placeholder}
        autoCapitalize="characters"
        className="mt-1 w-full rounded-lg border border-[#D8E5E0] px-3 py-2.5 text-[#1E3D36] placeholder:text-[#A9BDB6] focus:outline-none focus:ring-2 focus:ring-[#2F6F62]"
      />
    </label>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28 4L48 12V26C48 38 39.5 47.5 28 52C16.5 47.5 8 38 8 26V12L28 4Z"
        fill="#2F6F62"
      />
      <path
        d="M19 27L25 33L37 21"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
