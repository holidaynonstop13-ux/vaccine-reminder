"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ShieldPlus,
  Settings as SettingsIcon,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Syringe,
} from "lucide-react";

export function AdminSidebar({
  open,
  onToggle,
  onChildren,
  onUsers,
  onSettings,
  onLogout,
  activeItem,
}: {
  open: boolean;
  onToggle: () => void;
  onChildren: () => void;
  onUsers: () => void;
  onSettings: () => void;
  onLogout: () => void;
  activeItem?: "children" | "settings" | "users";
}) {
  const [role, setRole] = useState<"admin" | "staff" | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRole(data?.role ?? null));
  }, []);

  return (
    <aside
      className={`shrink-0 bg-[#152D28] text-white flex flex-col transition-all duration-200 ${
        open ? "w-56" : "w-16"
      }`}
    >
      <div className={`flex items-center h-16 px-4 ${open ? "justify-between" : "justify-center"}`}>
        {open && (
          <div className="flex items-center gap-2">
            <Syringe size={18} className="text-[#7FD8B8]" />
            <span className="font-semibold text-sm">วัคซีนคลินิก</span>
          </div>
        )}
        <button onClick={onToggle} className="text-[#9DBDB4] hover:text-white p-1">
          {open ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 mt-2">
        <SidebarItem open={open} icon={<Users size={18} />} label="ข้อมูลเด็ก" onClick={onChildren} active={activeItem === "children"} />
        {role === "admin" && (
          <>
            <SidebarItem open={open} icon={<ShieldPlus size={18} />} label="ผู้ใช้แอดมิน" onClick={onUsers} active={activeItem === "users"} />
            <SidebarItem open={open} icon={<SettingsIcon size={18} />} label="ตั้งค่า" onClick={onSettings} active={activeItem === "settings"} />
          </>
        )}
      </nav>

      <div className="px-2 pb-4">
        <SidebarItem open={open} icon={<LogOut size={18} />} label="ออกจากระบบ" onClick={onLogout} />
      </div>
    </aside>
  );
}

function SidebarItem({
  open,
  icon,
  label,
  onClick,
  active,
}: {
  open: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={open ? undefined : label}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-[#2F6F62] text-white" : "text-[#C7DAD4] hover:bg-white/10 hover:text-white"
      } ${open ? "justify-start" : "justify-center"}`}
    >
      {icon}
      {open && <span className="truncate">{label}</span>}
    </button>
  );
}
