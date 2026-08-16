"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar, Conversation } from "@/components/chat/sidebar";
import { TopBar } from "@/components/chat/top-bar";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageThread, Message } from "@/components/chat/message-thread";
import { InputBar } from "@/components/chat/input-bar";
import { VoiceModeModal } from "@/components/voice/voice-mode-modal";
import { ReportSidePanel, ReportData } from "@/components/chat/report-side-panel";
import { useAuth } from "@/context/AuthContext";
import { uploadReport, getReport } from "@/lib/api";
import { Loader2 } from "lucide-react";

const NEW_CHAT_ID = "conv-new";

const DEFAULT_NEW_CONVERSATION: Conversation = {
  id: NEW_CHAT_ID,
  title: "New Health Query",
  date: "Just now",
  category: "Today",
};

// Initial Demo Conversations (history)
const INITIAL_CONVERSATIONS: Conversation[] = [
  DEFAULT_NEW_CONVERSATION,
  {
    id: "conv-1",
    title: "Amoxicillin 500mg Guidance",
    date: "Today, 10:30 AM",
    category: "Today",
    isPinned: true,
  },
  {
    id: "conv-2",
    title: "Lipid Panel Lab Analysis",
    date: "Today, 08:15 AM",
    category: "Today",
  },
  {
    id: "conv-3",
    title: "Lisinopril Prescription Refill",
    date: "Yesterday",
    category: "Yesterday",
  },
  {
    id: "conv-4",
    title: "Chest Pain & SOB Triage",
    date: "3 days ago",
    category: "Previous 7 Days",
  },
];

// Initial Messages mapping for demo conversations
const MOCK_THREAD_DATA: Record<string, Message[]> = {
  [NEW_CHAT_ID]: [],
  "conv-1": [
    {
      id: "m-1",
      sender: "user",
      text: "Explain Amoxicillin 500mg dosage, side effects, and food instructions",
      timestamp: "10:30 AM",
    },
    {
      id: "m-2",
      sender: "ai",
      text: "Here is your guidance for Amoxicillin 500mg:\n\n• **Dosage:** 500 mg every 8 hours as directed by your physician.\n• **Food Instructions:** Can be taken with or without food. Taking with meals helps reduce stomach discomfort.\n• **Side Effects:** Mild nausea, diarrhea, abdominal discomfort, or headache. Contact your doctor if severe rash occurs.\n• **Warning:** Complete the full prescribed course even if you feel better early.",
      timestamp: "10:30 AM",
    },
  ],
  "conv-2": [
    {
      id: "m-3",
      sender: "user",
      text: "Analyze my Blood Test report: Lipid Panel (Cholesterol 240 mg/dL, HDL 45 mg/dL)",
      timestamp: "08:15 AM",
    },
    {
      id: "m-4",
      sender: "ai",
      text: "I analyzed your uploaded Lipid Panel report.\n\n• **Total Cholesterol:** 240 mg/dL (High — target is < 200 mg/dL)\n• **HDL (Good Cholesterol):** 45 mg/dL (Normal — target is > 40 mg/dL)\n\n**Clinical Summary:** Total cholesterol is moderately elevated. Adopting a balanced Mediterranean diet and routine cardiovascular check-up with your primary care provider is recommended.",
      timestamp: "08:16 AM",
    },
  ],
  "conv-3": [
    {
      id: "m-5",
      sender: "user",
      text: "Summarize my prescription for Lisinopril and check refills",
      timestamp: "Yesterday, 4:20 PM",
    },
    {
      id: "m-6",
      sender: "ai",
      text: "Prescription Summary for Lisinopril 10mg Tablets:\n\n• **Instructions:** Take 1 tablet orally every morning with water.\n• **Refills Remaining:** 3 refills available.\n• **Monitoring:** Check your blood pressure weekly as recommended by your physician.",
      timestamp: "Yesterday, 4:21 PM",
    },
  ],
  "conv-4": [
    {
      id: "m-7",
      sender: "user",
      text: "I am experiencing sudden tight chest pressure radiating to my left arm",
      timestamp: "3 days ago",
    },
    {
      id: "m-8",
      sender: "ai",
      text: "CRITICAL HEALTH ALERT: Chest pressure radiating to your arm or jaw is a major red-flag symptom of an acute medical emergency.\n\nDo not delay — please seek emergency medical evaluation immediately (call 911 or visit the nearest emergency room).",
      timestamp: "3 days ago",
      cardType: "emergency",
      cardData: {
        message: "Chest pain radiating to arm, neck, or jaw requires immediate emergency medical evaluation.",
        redFlagSymptoms: [
          "Chest pressure, squeezing, or severe central pain",
          "Shortness of breath or cold sweat",
          "Radiating pain to left arm, back, or jaw",
          "Dizziness, lightheadedness, or sudden faintness",
        ],
      },
    },
  ],
};

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(NEW_CHAT_ID);
  const [threadMap, setThreadMap] = useState<Record<string, Message[]>>(MOCK_THREAD_DATA);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Report state for side-by-side partition view
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(false);

  const { user, token, loading } = useAuth() as { user: any; token: string | null; loading: boolean };

  const tokenRef = useRef<string | null>(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Handle URL query parameters (e.g. mode=voice or report=ID)
  useEffect(() => {
    if (!searchParams) return;

    if (searchParams.get("mode") === "voice") {
      setIsVoiceOpen(true);
    }

    const reportId = searchParams.get("report");
    if (reportId && token) {
      getReport(reportId, token)
        .then((rep) => setActiveReport(rep))
        .catch((err) => console.error("Failed to load report for chat:", err));
    }
  }, [searchParams, token]);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeMessages = threadMap[activeId] || [];

  const handleNewConversation = () => {
    const newId = "conv-" + Date.now();
    const newConv: Conversation = {
      id: newId,
      title: "New Health Query",
      date: "Just now",
      category: "Today",
    };
    setConversations([newConv, ...conversations]);
    setThreadMap((prev) => ({ ...prev, [newId]: [] }));
    setActiveId(newId);
    setActiveReport(null);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeId === id && updated.length > 0) {
      setActiveId(updated[0].id);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleSendMessage = async (text: string, attachment?: File | null) => {
    if (!text && !attachment) return;

    const userMsg: Message = {
      id: "m-" + Date.now(),
      sender: "user",
      text: text || (attachment ? `📎 ${attachment.name}` : "Uploaded document"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const currentMsgs = threadMap[activeId] || [];
    const updatedMsgs = [...currentMsgs, userMsg];

    if (activeConversation && (activeConversation.title === "New Health Query" || activeId === NEW_CHAT_ID)) {
      const summaryTitle = text.slice(0, 28) + (text.length > 28 ? "..." : "");
      handleRenameConversation(activeId, summaryTitle || (attachment ? "Lab Report Analysis" : "Health Query"));
    }

    setThreadMap((prev) => ({ ...prev, [activeId]: updatedMsgs }));
    setIsGenerating(true);

    // ── REAL REPORT ATTACHMENT PATH: Upload to backend & Open Side Panel in Chat ───────
    if (attachment) {
      const formData = new FormData();
      formData.append("file", attachment);

      try {
        const currentToken = tokenRef.current;
        if (!currentToken) {
          throw new Error("Authentication required. Please log in to upload and analyze lab reports.");
        }
        const data = await uploadReport(formData, currentToken);

        // Set active report to display in partition side panel right inside chat!
        setActiveReport(data);

        const aiMsg: Message = {
          id: "m-" + (Date.now() + 1),
          sender: "ai",
          text: `✅ Report analyzed — Overall Status: **${data.overall_status}**. Extracted **${data.results?.length ?? 0}** biomarker(s).\n\nThe document preview and biomarker breakdown panel is open on the right. Ask me any questions about your lab results!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setThreadMap((prev) => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), aiMsg],
        }));
        setIsGenerating(false);
      } catch (err: unknown) {
        const errMsg: Message = {
          id: "m-" + (Date.now() + 1),
          sender: "ai",
          text: `❌ Failed to analyze report: ${err instanceof Error ? err.message : "Unknown error"}. Please try uploading again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setThreadMap((prev) => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), errMsg],
        }));
        setIsGenerating(false);
      }
      return;
    }

    // ── TEXT-ONLY CLINICAL RESPONSE PATH ─────────────────────────────────
    setTimeout(() => {
      let replyCardType: "medicine" | "lab" | "prescription" | "emergency" | undefined;
      let replyCardData: Message["cardData"];
      let replyText = "I have processed your query based on current clinical reference guidelines.";

      const lower = text.toLowerCase();

      // If active report is open, contextually answer questions about the report!
      if (activeReport && (lower.includes("report") || lower.includes("result") || lower.includes("test") || lower.includes("value") || lower.includes("status"))) {
        replyText = `Based on your analyzed report (Overall Status: **${activeReport.overall_status}**):\n\n` +
          activeReport.results.map((r) => `• **${r.test_name}:** ${r.value} ${r.unit} (${r.status} — Ref: ${r.normal_range} ${r.unit})`).join("\n") +
          `\n\nFeel free to ask for specific advice or recommendations on any of these parameters.`;
      } else if (lower.includes("chest pain") || lower.includes("heart attack") || lower.includes("emergency")) {
        replyCardType = "emergency";
        replyText = "URGENT SAFETY NOTICE: Sudden severe symptoms require immediate emergency evaluation.";
        replyCardData = {
          message: "Please do not delay seeking professional emergency care.",
        };
      } else if (lower.includes("cough") || lower.includes("fever") || lower.includes("symptom")) {
        replyText = "Based on your described symptoms:\n• Stay well hydrated with fluids & rest.\n• Monitor body temperature twice daily.\n• If high fever (>102°F) persists past 3 days or shortness of breath develops, consult your physician immediately.";
      } else {
        replyText = `Thank you for your question. For general health guidance:\n• Ensure adequate hydration and balanced nutrition.\n• Always follow dosage instructions on prescription labels.\n• You can attach a lab report PDF or scan anytime using the paperclip icon for instant biomarker breakdown!`;
      }

      const aiMsg: Message = {
        id: "m-" + (Date.now() + 1),
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cardType: replyCardType,
        cardData: replyCardData,
      };

      setThreadMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), aiMsg],
      }));
      setIsGenerating(false);
    }, 1200);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-[var(--ink)] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--ink-muted)]">Loading AI Assistant...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Icon-Rail & Collapsible Sidebar */}
      <div 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className="z-50 h-screen shrink-0"
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed && !isSidebarHovered}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={setActiveId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onOpenVoiceMode={() => setIsVoiceOpen(true)}
        />
      </div>

      {/* Main Content Area — Partitions when activeReport is present */}
      <div className="flex-1 flex h-full min-w-0 relative overflow-hidden">
        {/* Chat Stream (Left Partition) */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
          <TopBar
            title={activeConversation?.title || "Elixora Health Assistant"}
            onOpenVoiceMode={() => setIsVoiceOpen(true)}
            onGoToLanding={() => router.push("/")}
          />

          <main className="flex-1 overflow-y-auto flex flex-col relative">
            {activeMessages.length === 0 ? (
              <EmptyState 
                onSelectPrompt={(pText) => handleSendMessage(pText)} 
                InputBarComponent={
                  <InputBar
                    onSendMessage={handleSendMessage}
                    onOpenVoiceMode={() => setIsVoiceOpen(true)}
                    isLoading={isGenerating}
                    className=""
                  />
                }
              />
            ) : (
              <MessageThread messages={activeMessages} isGenerating={isGenerating} />
            )}
          </main>

          {activeMessages.length > 0 && (
            <InputBar
              onSendMessage={handleSendMessage}
              onOpenVoiceMode={() => setIsVoiceOpen(true)}
              isLoading={isGenerating}
              className="sticky bottom-0 z-20 pb-4"
            />
          )}
        </div>

        {/* ── Report Analyzer Side Panel (Right Partition Screen) ─────────────── */}
        {activeReport && (
          <div className={`h-full shrink-0 z-30 transition-all duration-300 ${
            isReportExpanded
              ? "w-full md:w-[750px] lg:w-[840px] xl:w-[920px]"
              : "w-full md:w-[480px] lg:w-[520px] xl:w-[580px]"
          }`}>
            <ReportSidePanel
              report={activeReport}
              isExpanded={isReportExpanded}
              onToggleExpand={() => setIsReportExpanded((v) => !v)}
              onClose={() => setActiveReport(null)}
            />
          </div>
        )}
      </div>

      {/* Voice Overlay */}
      <VoiceModeModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
