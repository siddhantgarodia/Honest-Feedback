"use client";

import { MessageCard } from "@/components/MessageCard";
import { MessageSummary } from "@/components/MessageSummary";
import { StatsPanel } from "@/components/StatsPanel";
import { QRCodeModal } from "@/components/QRCodeModal";
import { QuestionsManager } from "@/components/QuestionsManager";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Message, FeedbackQuestion } from "@/model/User";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import {
  Loader2,
  RefreshCcw,
  MessageCircleX,
  KeyRound,
  MessageCircle,
  X,
  QrCode,
  Download,
  Bell,
  BellOff,
  Search,
  Pin,
  Inbox,
} from "lucide-react";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { verifySchema } from "@/schemas/acceptMessageSchema";
import { toast } from "sonner";

type FilterType = "all" | "unread" | "pinned";

function UserDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [notifyOnMessage, setNotifyOnMessage] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: session } = useSession();
  const form = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { acceptMessages: false },
  });
  const router = useRouter();
  const { register, watch, setValue } = form;
  const acceptMessages = watch("acceptMessages");

  // Derived: filtered + searched messages
  const displayedMessages = useMemo(() => {
    let result = [...messages];

    if (filter === "unread") result = result.filter((m) => !m.isRead);
    if (filter === "pinned") result = result.filter((m) => m.isPinned);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => {
        if (m.content?.toLowerCase().includes(q)) return true;
        return m.answers?.some(
          (a) =>
            a.questionText.toLowerCase().includes(q) ||
            a.answer.toLowerCase().includes(q)
        );
      });
    }

    // Pinned float to top
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [messages, filter, searchQuery]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const handleDeleteMessage = (feedbackId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== feedbackId));
  };

  const handlePinToggle = (feedbackId: string, isPinned: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === feedbackId ? (Object.assign(m, { isPinned }) as Message) : m
      )
    );
  };

  const handleMarkRead = (feedbackId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m._id === feedbackId ? (Object.assign(m, { isRead: true }) as Message) : m
      )
    );
  };

  const handleSendMessage = () => {
    if (!inputUsername.trim()) {
      setUsernameError("Please enter a username");
      return;
    }
    setUsernameError("");
    router.push(`/u/${encodeURIComponent(inputUsername.trim())}`);
    setShowUsernameInput(false);
    setInputUsername("");
  };

  // Username dialog with Escape key support
  const UsernameInputDialog = () => {
    React.useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowUsernameInput(false);
          setInputUsername("");
          setUsernameError("");
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-foreground">
              Send Anonymous Feedback
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowUsernameInput(false);
                setInputUsername("");
                setUsernameError("");
              }}
            >
              <X size={16} />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className={usernameError ? "border-destructive" : ""}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                autoFocus
              />
              {usernameError && (
                <p className="text-xs text-destructive mt-1">{usernameError}</p>
              )}
            </div>
            <Button className="w-full" onClick={handleSendMessage}>
              <MessageCircle size={16} className="mr-2" />
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const fetchAcceptMessages = useCallback(async () => {
    setIsSwitchLoading(true);
    try {
      const response = await axios.get<ApiResponse>("/api/accept-messages");
      setValue("acceptMessages", response.data.isAcceptingMessage || false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message ?? "Failed to fetch message settings");
    } finally {
      setIsSwitchLoading(false);
    }
  }, [setValue]);

  const fetchMessages = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>("/api/get-messages");
      setMessages((response.data.messages as Message[]) || []);
      if (response.data.notifyOnMessage !== undefined) {
        setNotifyOnMessage(response.data.notifyOnMessage);
      }
      if (refresh) toast.success("Refreshed — showing latest messages");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      // 404 just means no messages yet — not an error
      if (axiosError.response?.status !== 404) {
        toast.error(axiosError.response?.data.message ?? "Failed to fetch messages");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await axios.get<ApiResponse>("/api/questions");
      setQuestions((res.data.questions as FeedbackQuestion[]) ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    fetchMessages();
    fetchAcceptMessages();
    fetchQuestions();

    if (typeof window !== "undefined") {
      const { username } = session.user as User;
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      setProfileUrl(`${baseUrl}/u/${username}`);
    }
  }, [session, fetchAcceptMessages, fetchMessages, fetchQuestions]);

  const handleSwitchChange = async () => {
    try {
      const response = await axios.post<ApiResponse>("/api/accept-messages", {
        acceptMessages: !acceptMessages,
      });
      setValue("acceptMessages", !acceptMessages);
      toast.success(response.data.message);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message ?? "Failed to update message settings");
    }
  };

  const handleNotifyToggle = async () => {
    const newVal = !notifyOnMessage;
    setNotifyOnMessage(newVal);
    try {
      await axios.put("/api/update-preferences", { notifyOnMessage: newVal });
      toast.success(newVal ? "Email notifications enabled" : "Email notifications disabled");
    } catch {
      setNotifyOnMessage(!newVal);
      toast.error("Failed to update notification preference.");
    }
  };

  const handleExport = (format: "csv" | "json") => {
    window.open(`/api/export-messages?format=${format}`, "_blank");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile URL copied to clipboard.");
  };

  if (!session?.user) return <div />;

  const { username = "" } = session.user as User;

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-card border border-border rounded-2xl shadow-sm w-full max-w-6xl">
      {showUsernameInput && <UsernameInputDialog />}
      {showQR && (
        <QRCodeModal
          url={profileUrl}
          username={username}
          onClose={() => setShowQR(false)}
        />
      )}

      <h1 className="text-4xl font-bold mb-6 text-foreground">User Dashboard</h1>

      {/* Stats */}
      {messages.length > 0 && <StatsPanel messages={messages} />}

      {/* Profile URL + QR + Export */}
      <div className="mb-6 bg-muted/40 border border-border p-4 rounded-xl">
        <h2 className="text-base font-semibold mb-3 text-foreground">
          Share your profile to receive feedback
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="flex-1 min-w-0 p-2 rounded-lg border border-border bg-background text-foreground text-sm"
          />
          <Button onClick={copyToClipboard} size="sm">Copy</Button>
          <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="gap-1.5">
            <QrCode className="h-4 w-4" /> QR Code
          </Button>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("json")} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Controls row: Accept toggle + Notify toggle */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        {/* Accept Feedback */}
        <div className="flex-1 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-muted dark:to-muted/60 p-4 rounded-xl border border-orange-100 dark:border-border shadow-sm">
          <div className="flex items-center gap-3">
            <Switch
              {...register("acceptMessages")}
              checked={acceptMessages}
              onCheckedChange={handleSwitchChange}
              disabled={isSwitchLoading}
            />
            <div>
              <span className="font-medium text-orange-800 dark:text-orange-300 text-sm">
                Accept Feedback:
              </span>
              <span
                className={`ml-1 font-semibold text-sm ${
                  acceptMessages
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {acceptMessages ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="flex-1 flex items-center justify-between bg-muted/40 border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <Switch
              checked={notifyOnMessage}
              onCheckedChange={handleNotifyToggle}
            />
            <div className="flex items-center gap-2">
              {notifyOnMessage ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                Email on new message
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Give Feedback */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2 sm:mb-0">Give Feedback</h2>
        <Button
          onClick={() => setShowUsernameInput(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md"
        >
          <MessageCircle className="h-4 w-4" />
          Give Feedback
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Custom Questions */}
      <div className="mb-6">
        <QuestionsManager
          initialQuestions={questions}
          onSave={(updated) => setQuestions(updated)}
        />
      </div>

      <Separator className="my-4" />

      {/* Your Feedback header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <h2 className="text-xl font-semibold text-foreground">Your Feedback</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => fetchMessages(true)}
          className="flex items-center gap-2 text-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
          ) : (
            <RefreshCcw className="h-4 w-4 text-orange-600" />
          )}
          Refresh
        </Button>
      </div>

      {/* Search + Filter */}
      {messages.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "unread", "pinned"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize gap-1.5"
              >
                {f === "pinned" && <Pin className="h-3.5 w-3.5" />}
                {f === "unread" && <Inbox className="h-3.5 w-3.5" />}
                {f}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Summarize */}
      <MessageSummary isVisible={messages.length > 0} />

      {/* Message Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedMessages.length > 0 ? (
          displayedMessages.map((message) => (
            <MessageCard
              key={message._id?.toString()}
              message={message}
              onMessageDelete={handleDeleteMessage}
              onPinToggle={handlePinToggle}
              onMarkRead={handleMarkRead}
            />
          ))
        ) : messages.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-muted/40 rounded-xl border border-border">
            <MessageCircleX size={56} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-medium text-foreground mb-1">No feedback yet.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Share your profile link to start receiving honest feedback.
            </p>
            <Button onClick={() => setShowUsernameInput(true)} className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Send a Feedback
            </Button>
          </div>
        ) : (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            No messages match your current filter.
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Account Security */}
      <div className="bg-muted/40 border border-border p-4 rounded-xl">
        <h2 className="text-base font-semibold mb-3 text-foreground">Account Security</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            It&apos;s recommended to change your password regularly.
          </p>
          <Button
            onClick={() => router.push("/reset-password")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
