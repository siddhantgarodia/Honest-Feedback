"use client";

import { Message } from "@/model/User";
import { BarChart2, Inbox, BookOpen, Pin } from "lucide-react";

interface StatsPanelProps {
  messages: Message[];
}

export function StatsPanel({ messages }: StatsPanelProps) {
  const total = messages.length;
  const unread = messages.filter((m) => !m.isRead).length;
  const pinned = messages.filter((m) => m.isPinned).length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeek = messages.filter(
    (m) => new Date(m.createdAt) >= oneWeekAgo
  ).length;

  const stats = [
    { label: "Total", value: total, icon: Inbox, color: "text-blue-500" },
    { label: "This Week", value: thisWeek, icon: BarChart2, color: "text-green-500" },
    { label: "Unread", value: unread, icon: BookOpen, color: "text-orange-500" },
    { label: "Pinned", value: pinned, icon: Pin, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-sm"
        >
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
