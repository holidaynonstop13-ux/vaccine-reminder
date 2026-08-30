"use client";

import {
  Bell,
  UserPlus,
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
  onNotify,
  notifying,
  onAddChild,
  onAddUser,
  onSettings,
  onLogout,
  activeItem,
}: {
  open: boolean;
  onToggle: () => void;
  onNotify: () => void;
  notifying: boolean;
  onAddChild: () => void;
  onAddUser: () => void;
  onSettings: () => void;
  onLogout: () => void;
  activeItem?: "settings";
}) {
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
        <SidebarItem open={open} icon={<Bell size={18} />} label={notifying ? "กำลังส่ง..." : "ส่งแจ้งเตือนตอนนี้"} onClick={onNotify} highlight />
        <SidebarItem open={open} icon={<UserPlus size={18} />} label="เพิ่มเด็ก" onClick={onAddChild} />
        <SidebarItem open={open} icon={<ShieldPlus size={18} />} label="ผู้ใช้แอดมิน" onClick={onAddUser} />
        <SidebarItem open={open} icon={<SettingsIcon size={18} />} label="ตั้งค่า" onClick={onSettings} active={activeItem === "settings"} />
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
  highlight,
  active,
}: {
  open: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={open ? undefined : label}
      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        highlight
          ? "bg-[#2F6F62] text-white hover:bg-[#285F54]"
          : active
          ? "bg-white/10 text-white"
          : "text-[#C7DAD4] hover:bg-white/10 hover:text-white"
      } ${open ? "justify-start" : "justify-center"}`}
    >
      {icon}
      {open && <span className="truncate">{label}</span>}
    </button>
  );
}
