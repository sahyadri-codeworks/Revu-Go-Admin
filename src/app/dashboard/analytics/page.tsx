"use client";

import { useEffect, useState } from "react";
import {
  Building2, Star, Megaphone, TicketCheck, MessageSquare,
  TrendingUp, MapPin, BarChart3,
} from "lucide-react";

interface AnalyticsData {
  totalBusinesses: number;
  activeBusinesses: number;
  totalReviews: number;
  totalCampaigns: number;
  totalCoupons: number;
  totalFeedback: number;
  avgRating: number;
  activeCampaigns: number;
  redeemedCoupons: number;
  cityDistribution: Record<string, number>;
  monthlyGrowth: Record<string, { businesses: number; reviews: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super-admin?action=analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#F3F4F6] p-6 animate-pulse">
            <div className="h-4 w-32 bg-[#F3F4F6] rounded mb-4" />
            <div className="h-32 bg-[#F3F4F6] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Total Businesses", value: data.totalBusinesses, icon: Building2, color: "#166534" },
    { label: "Active Businesses", value: data.activeBusinesses, icon: TrendingUp, color: "#15803D" },
    { label: "Total Reviews", value: data.totalReviews, icon: Star, color: "#D4AF37" },
    { label: "Avg Rating", value: data.avgRating, icon: Star, color: "#F59E0B" },
    { label: "Total Campaigns", value: data.totalCampaigns, icon: Megaphone, color: "#EC4899" },
    { label: "Active Campaigns", value: data.activeCampaigns, icon: Megaphone, color: "#8B5CF6" },
    { label: "Total Coupons", value: data.totalCoupons, icon: TicketCheck, color: "#0EA5E9" },
    { label: "Redeemed Coupons", value: data.redeemedCoupons, icon: TicketCheck, color: "#166534" },
    { label: "Private Feedback", value: data.totalFeedback, icon: MessageSquare, color: "#6B7280" },
  ];

  const months = Object.entries(data.monthlyGrowth);
  const maxReviews = Math.max(...months.map(([, v]) => v.reviews), 1);
  const maxBiz = Math.max(...months.map(([, v]) => v.businesses), 1);
  const cities = Object.entries(data.cityDistribution).sort((a, b) => b[1] - a[1]);
  const maxCityCount = cities.length > 0 ? cities[0][1] : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#F3F4F6] p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-[24px] font-bold text-[#111] tabular-nums">{typeof s.value === "number" && s.value % 1 !== 0 ? s.value.toFixed(1) : s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
        <h3 className="text-[14px] font-bold text-[#111] mb-1">Monthly Growth</h3>
        <p className="text-[11px] text-[#9CA3AF] mb-5">Business signups and reviews over the last 6 months</p>
        <div className="space-y-4">
          {months.map(([month, values]) => (
            <div key={month} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#374151] w-16">{month}</span>
                <div className="flex gap-4 text-[10px] text-[#9CA3AF]">
                  <span>Businesses: <strong className="text-[#166534]">{values.businesses}</strong></span>
                  <span>Reviews: <strong className="text-[#D4AF37]">{values.reviews}</strong></span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#166534] to-[#22C55E] rounded-full transition-all" style={{ width: `${(values.businesses / maxBiz) * 100}%` }} />
                </div>
                <div className="flex-1 h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FBBF24] rounded-full transition-all" style={{ width: `${(values.reviews / maxReviews) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-[#F3F4F6]">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#166534] to-[#22C55E]" /><span className="text-[10px] text-[#6B7280]">Businesses</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FBBF24]" /><span className="text-[10px] text-[#6B7280]">Reviews</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
        <div className="flex items-center gap-2 mb-5"><MapPin className="w-4 h-4 text-[#166534]" /><h3 className="text-[14px] font-bold text-[#111]">City Distribution</h3></div>
        {cities.length === 0 ? (
          <p className="text-[13px] text-[#9CA3AF]">No data yet</p>
        ) : (
          <div className="space-y-3">
            {cities.slice(0, 10).map(([city, count]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-[13px] text-[#374151] font-medium w-28 truncate">{city}</span>
                <div className="flex-1 h-5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#166534] to-[#4ADE80] rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max((count / maxCityCount) * 100, 8)}%` }}>
                    <span className="text-[9px] text-white font-bold">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-[#166534]" /><h3 className="text-[14px] font-bold text-[#111]">Conversion Metrics</h3></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#F9FAFB]"><span className="text-[13px] text-[#6B7280]">Coupon Redemption Rate</span><span className="text-[13px] font-bold text-[#111]">{data.totalCoupons > 0 ? Math.round((data.redeemedCoupons / data.totalCoupons) * 100) : 0}%</span></div>
            <div className="flex items-center justify-between py-2 border-b border-[#F9FAFB]"><span className="text-[13px] text-[#6B7280]">Campaign Activity Rate</span><span className="text-[13px] font-bold text-[#111]">{data.totalCampaigns > 0 ? Math.round((data.activeCampaigns / data.totalCampaigns) * 100) : 0}%</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-[13px] text-[#6B7280]">Reviews per Business</span><span className="text-[13px] font-bold text-[#111]">{data.totalBusinesses > 0 ? (data.totalReviews / data.totalBusinesses).toFixed(1) : 0}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#F3F4F6] p-6">
          <div className="flex items-center gap-2 mb-4"><Star className="w-4 h-4 text-[#D4AF37]" /><h3 className="text-[14px] font-bold text-[#111]">Platform Quality</h3></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#F9FAFB]"><span className="text-[13px] text-[#6B7280]">Average Star Rating</span><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" /><span className="text-[13px] font-bold text-[#111]">{data.avgRating}</span></div></div>
            <div className="flex items-center justify-between py-2 border-b border-[#F9FAFB]"><span className="text-[13px] text-[#6B7280]">Private Feedback Received</span><span className="text-[13px] font-bold text-[#111]">{data.totalFeedback}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-[13px] text-[#6B7280]">Business Active Rate</span><span className="text-[13px] font-bold text-[#166534]">{data.totalBusinesses > 0 ? Math.round((data.activeBusinesses / data.totalBusinesses) * 100) : 0}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
