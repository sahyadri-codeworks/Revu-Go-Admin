"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Star,
  Megaphone,
  TicketCheck,
  TrendingUp,
  Users,
  Zap,
  CreditCard,
} from "lucide-react";

interface OverviewData {
  totalBusinesses: number;
  activeBusinesses: number;
  trialAccounts: number;
  paidAccounts: number;
  totalReviews: number;
  monthlyReviews: number;
  totalCampaigns: number;
  totalCoupons: number;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin?action=overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#F3F4F6] p-5 animate-pulse">
              <div className="h-4 w-20 bg-[#F3F4F6] rounded mb-3" />
              <div className="h-8 w-16 bg-[#F3F4F6] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Businesses", value: data.totalBusinesses, icon: Building2, color: "#166534", bg: "#F0FDF4" },
    { label: "Active Businesses", value: data.activeBusinesses, icon: Zap, color: "#15803D", bg: "#F0FDF4" },
    { label: "Trial Accounts", value: data.trialAccounts, icon: Users, color: "#D97706", bg: "#FFFBEB" },
    { label: "Paid Accounts", value: data.paidAccounts, icon: CreditCard, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Total Reviews", value: data.totalReviews, icon: Star, color: "#D4AF37", bg: "#FFFDF5" },
    { label: "Monthly Reviews", value: data.monthlyReviews, icon: TrendingUp, color: "#0EA5E9", bg: "#F0F9FF" },
    { label: "Total Campaigns", value: data.totalCampaigns, icon: Megaphone, color: "#EC4899", bg: "#FDF2F8" },
    { label: "Total Coupons", value: data.totalCoupons, icon: TicketCheck, color: "#166534", bg: "#F0FDF4" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#F3F4F6] p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wider">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-[28px] font-bold text-[#111] tabular-nums">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
          <h3 className="text-[13px] font-semibold text-[#111] mb-4">Platform Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6B7280]">Active Rate</span>
              <span className="text-[13px] font-bold text-[#166534]">
                {data.totalBusinesses > 0 ? Math.round((data.activeBusinesses / data.totalBusinesses) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#166534] to-[#22C55E] rounded-full"
                style={{ width: `${data.totalBusinesses > 0 ? (data.activeBusinesses / data.totalBusinesses) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[13px] text-[#6B7280]">Avg Reviews / Business</span>
              <span className="text-[13px] font-bold text-[#111]">
                {data.totalBusinesses > 0 ? (data.totalReviews / data.totalBusinesses).toFixed(1) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6B7280]">Avg Campaigns / Business</span>
              <span className="text-[13px] font-bold text-[#111]">
                {data.totalBusinesses > 0 ? (data.totalCampaigns / data.totalBusinesses).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
          <h3 className="text-[13px] font-semibold text-[#111] mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Trial", count: data.trialAccounts, color: "#D97706" },
              { label: "Paid", count: data.paidAccounts, color: "#166534" },
              { label: "No Subscription", count: Math.max(0, data.totalBusinesses - data.trialAccounts - data.paidAccounts), color: "#9CA3AF" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[13px] text-[#6B7280]">{item.label}</span>
                </div>
                <span className="text-[13px] font-bold text-[#111]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
