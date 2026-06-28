"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  MessageSquareWarning,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Users },
  { href: "/dashboard/issues", label: "Customer Issues", icon: MessageSquareWarning },
  { href: "/dashboard/plans", label: "Plans & Billing", icon: CreditCard },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: Receipt },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }

    fetch("/api/super-admin?action=check-admin")
      .then((r) => r.json())
      .then((d) => {
        if (d.isAdmin) setAuthorized(true);
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecking(false));
  }, [user, authLoading, router]);

  if (authLoading || checking || !authorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#166534] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pageName = navItems.find((n) => n.href === pathname)?.label || "Admin";

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white h-screen fixed left-0 top-0 z-40 border-r border-[#E5E7EB]">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <img src="/logo-name.png" alt="RevuGo" className="h-16 object-contain" />
            <p className="text-[10px] text-[#166534] font-semibold uppercase tracking-wider">Admin</p>
          </div>
        </div>

        <div className="h-px bg-[#F3F4F6] mx-4 mb-3" />

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-[#166534]/8 text-[#166534]"
                    : "text-[#6B7280] hover:text-[#111] hover:bg-[#F9FAFB]"
                }`}
              >
                <item.icon className={`w-[17px] h-[17px] ${isActive ? "text-[#166534]" : "text-[#9CA3AF]"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 pt-2">
          <div className="h-px bg-[#F3F4F6] mb-3" />
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#166534] to-[#15803D] flex items-center justify-center text-white text-xs font-bold">
              {(profile?.full_name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#111] font-medium truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-[10px] text-[#9CA3AF] truncate">{profile?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={() => { window.location.href = "/auth/signout"; }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-[#EF4444] font-medium hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E7EB] h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo-name.png" alt="RevuGo" className="h-16 object-contain" />
          <span className="text-[10px] text-[#166534] font-semibold uppercase tracking-wider">Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center">
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-14 bottom-0 w-[260px] bg-white border-r border-[#E5E7EB] p-3 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                      isActive ? "bg-[#166534]/8 text-[#166534]" : "text-[#6B7280] hover:text-[#111]"
                    }`}
                  >
                    <item.icon className={`w-[17px] h-[17px] ${isActive ? "text-[#166534]" : "text-[#9CA3AF]"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-4">
              <div className="h-px bg-[#F3F4F6] mb-3" />
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#166534] to-[#15803D] flex items-center justify-center text-white text-xs font-bold">
                  {(profile?.full_name || "A").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#111] font-medium truncate">{profile?.full_name || "Admin"}</p>
                  <p className="text-[10px] text-[#9CA3AF] truncate">{profile?.email || ""}</p>
                </div>
              </div>
              <button
                onClick={() => { setMobileOpen(false); window.location.href = "/auth/signout"; }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] text-[#EF4444] font-medium hover:bg-[#FEF2F2] transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-[260px] pt-14 lg:pt-0">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] px-6 sm:px-8 h-[56px] flex items-center">
          <h1 className="text-[15px] text-[#111] font-semibold">{pageName}</h1>
        </div>
        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
