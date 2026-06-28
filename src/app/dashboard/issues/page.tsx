"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Building2,
  StickyNote,
  Filter,
  ArrowUpDown,
} from "lucide-react";

type Priority = "low" | "medium" | "high" | "urgent";
type Status = "open" | "in_progress" | "resolved" | "closed";

interface TicketMessage {
  id: string;
  sender_type: "business" | "admin";
  sender_email: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  business_id: string;
  subject: string;
  priority: Priority;
  status: Status;
  created_at: string;
  updated_at: string;
  businesses?: { name: string; slug: string };
  messages: TicketMessage[];
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; icon: typeof Clock }> = {
  open: { label: "Open", color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: Clock },
  resolved: { label: "Resolved", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", icon: CheckCircle2 },
  closed: { label: "Closed", color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  low: { label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.08)", dot: "#9CA3AF" },
  medium: { label: "Medium", color: "#3B82F6", bg: "rgba(59,130,246,0.08)", dot: "#3B82F6" },
  high: { label: "High", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", dot: "#F59E0B" },
  urgent: { label: "Urgent", color: "#EF4444", bg: "rgba(239,68,68,0.08)", dot: "#EF4444" },
};

const ALL_STATUSES: Status[] = ["open", "in_progress", "resolved", "closed"];
const ALL_PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function IssuesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support-tickets?action=all");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin-reply",
          ticketId,
          message: replyText,
          isInternalNote: isInternalNote,
        }),
      });
      setReplyText("");
      setIsInternalNote(false);
      await fetchTickets();
    } catch {} finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: Status) => {
    await fetch("/api/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-ticket", ticketId, status }),
    });
    await fetchTickets();
  };

  const handlePriorityChange = async (ticketId: string, priority: Priority) => {
    await fetch("/api/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-ticket", ticketId, priority }),
    });
    await fetchTickets();
  };

  const filtered = tickets.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    urgent: tickets.filter((t) => t.priority === "urgent" && t.status !== "closed" && t.status !== "resolved").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#111] tracking-[-0.01em]">Customer Issues</h2>
        <p className="text-[13px] text-[#6B7280] mt-1">Manage and respond to support tickets from business owners</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Tickets", value: stats.total, color: "#6B7280" },
          { label: "Open", value: stats.open, color: "#3B82F6" },
          { label: "In Progress", value: stats.inProgress, color: "#F59E0B" },
          { label: "Urgent Active", value: stats.urgent, color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium mb-1">{s.label}</p>
            <p className="text-[22px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 text-[#9CA3AF]">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">Filter</span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterStatus === "all" ? "bg-[#166534]/10 text-[#166534]" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}>
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterStatus === s ? "text-white" : "hover:bg-[#F3F4F6]"}`}
              style={filterStatus === s ? { backgroundColor: STATUS_CONFIG[s].color, color: "#fff" } : { color: STATUS_CONFIG[s].color }}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-[#E5E7EB]" />
        <div className="flex items-center gap-1.5 text-[#9CA3AF]">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">Priority</span>
        </div>
        <div className="flex gap-1.5">
          {ALL_PRIORITIES.map((p) => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? "all" : p)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${filterPriority === p ? "bg-[#166534]/10 text-[#166534] border border-[#166534]/20" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}>
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#166534] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center">
          <MessageSquare className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
          <h3 className="text-[#374151] text-base font-bold mb-1">No tickets found</h3>
          <p className="text-[#9CA3AF] text-[13px]">
            {tickets.length === 0 ? "No support tickets have been raised yet" : "No tickets match the current filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => {
            const statusCfg = STATUS_CONFIG[ticket.status];
            const priorityCfg = PRIORITY_CONFIG[ticket.priority];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === ticket.id;
            const businessName = ticket.businesses?.name || "Unknown Business";

            return (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-sm transition-shadow">
                <button
                  onClick={() => { setExpandedId(isExpanded ? null : ticket.id); setReplyText(""); setIsInternalNote(false); }}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#FAFAFA] transition-colors">
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: priorityCfg.dot }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#111] truncate">{ticket.subject}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{businessName}</span>
                      <span>&middot;</span>
                      <span>{formatDateTime(ticket.created_at)}</span>
                      <span>&middot;</span>
                      <span>{timeAgo(ticket.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tabular-nums text-[#6B7280] bg-[#F3F4F6]">
                      {ticket.messages.length} msg{ticket.messages.length !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
                      style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, borderColor: statusCfg.border }}>
                      <StatusIcon className="w-3 h-3" />{statusCfg.label}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} className="overflow-hidden">
                      <div className="border-t border-[#F3F4F6]">
                        <div className="px-5 py-3 bg-[#FAFAFA] flex flex-wrap items-center gap-4 border-b border-[#F3F4F6]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">Status:</span>
                            <div className="flex gap-1">
                              {ALL_STATUSES.map((s) => (
                                <button key={s} onClick={() => handleStatusChange(ticket.id, s)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${ticket.status === s ? "text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}
                                  style={ticket.status === s ? { backgroundColor: STATUS_CONFIG[s].color } : {}}>
                                  {STATUS_CONFIG[s].label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="w-px h-5 bg-[#E5E7EB]" />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-medium">Priority:</span>
                            <div className="flex gap-1">
                              {ALL_PRIORITIES.map((p) => (
                                <button key={p} onClick={() => handlePriorityChange(ticket.id, p)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${ticket.priority === p ? "text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}
                                  style={ticket.priority === p ? { backgroundColor: PRIORITY_CONFIG[p].color } : {}}>
                                  {PRIORITY_CONFIG[p].label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto">
                            {ticket.messages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                  msg.is_internal_note ? "bg-[#FEF9C3] border border-[#FDE68A]"
                                    : msg.sender_type === "admin" ? "bg-[#166534]/8 border border-[#166534]/10"
                                    : "bg-[#F3F4F6] border border-[#E5E7EB]"
                                }`}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {msg.is_internal_note && <StickyNote className="w-3 h-3 text-[#CA8A04]" />}
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                                      msg.is_internal_note ? "text-[#CA8A04]" : msg.sender_type === "admin" ? "text-[#166534]" : "text-[#7C3AED]"
                                    }`}>
                                      {msg.is_internal_note ? "Internal Note" : msg.sender_type === "admin" ? "Admin" : businessName}
                                    </span>
                                    <span className="text-[9px] text-[#9CA3AF]">
                                      {msg.sender_email && <span className="mr-1">({msg.sender_email})</span>}
                                      {formatDateTime(msg.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-[13px] text-[#374151] leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-1">
                              <button onClick={() => setIsInternalNote(false)}
                                className={`text-[11px] font-medium px-3 py-1 rounded-lg transition-all ${!isInternalNote ? "bg-[#166534]/10 text-[#166534]" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}>
                                Reply to Client
                              </button>
                              <button onClick={() => setIsInternalNote(true)}
                                className={`text-[11px] font-medium px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${isInternalNote ? "bg-[#FEF9C3] text-[#CA8A04] border border-[#FDE68A]" : "text-[#6B7280] hover:bg-[#F3F4F6]"}`}>
                                <StickyNote className="w-3 h-3" /> Internal Note
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                placeholder={isInternalNote ? "Add an internal note (not visible to client)..." : "Type your reply to the client..."}
                                rows={2}
                                className={`flex-1 px-4 py-2.5 rounded-xl border text-[13px] text-[#111] placeholder:text-[#9CA3AF] transition-all resize-none ${
                                  isInternalNote ? "bg-[#FFFBEB] border-[#FDE68A] focus:border-[#F59E0B]/50" : "bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#166534]/30"
                                }`} />
                              <button onClick={() => handleReply(ticket.id)} disabled={!replyText.trim() || sending}
                                className={`px-4 self-end py-2.5 rounded-xl text-white transition-all disabled:opacity-30 ${isInternalNote ? "bg-[#CA8A04] hover:bg-[#A16207]" : "bg-[#166534] hover:bg-[#15803D]"}`}>
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
