"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar, Conversation } from "@/components/chat/sidebar";
import { TopBar } from "@/components/chat/top-bar";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageThread, Message } from "@/components/chat/message-thread";
import { InputBar } from "@/components/chat/input-bar";
import { MedicineAnalyzerModal } from "@/components/chat/medicine-analyzer-modal";
import { VoiceModeModal } from "@/components/voice/voice-mode-modal";
import { SettingsModal } from "@/components/chat/settings-modal";
import { ReportSidePanel, ReportData } from "@/components/chat/report-side-panel";
import { Aurora } from "@/components/ui/aurora";
import { useAuth } from "@/context/AuthContext";
import { uploadReport, getReport, sendChatMessage } from "@/lib/api";
import { Loader2 } from "lucide-react";

const NEW_CHAT_ID = "conv-new";

const DEFAULT_NEW_CONVERSATION: Conversation = {
  id: NEW_CHAT_ID,
  title: "New Health Query",
  date: "Just now",
  category: "Today",
};

// Initial Demo Conversations (history tailored for Elixora Health)
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
    date: "Today, 07:45 AM",
    category: "Today",
  },
  {
    id: "conv-4",
    title: "Chest Pain & SOB Triage",
    date: "Yesterday",
    category: "Yesterday",
  },
  {
    id: "conv-5",
    title: "CBC Blood Count Report Breakdown",
    date: "Yesterday",
    category: "Yesterday",
  },
  {
    id: "conv-6",
    title: "Metformin Dosage & Diet Advice",
    date: "Yesterday",
    category: "Yesterday",
  },
  {
    id: "conv-7",
    title: "Vitamin D3 & Iron Consultation",
    date: "2 days ago",
    category: "Previous 7 Days",
  },
  {
    id: "conv-8",
    title: "Seasonal Allergies & Antihistamines",
    date: "3 days ago",
    category: "Previous 7 Days",
  },
  {
    id: "conv-9",
    title: "Blood Pressure Monitoring Log",
    date: "4 days ago",
    category: "Previous 7 Days",
  },
  {
    id: "conv-10",
    title: "Post-Workout Muscle Soreness Relief",
    date: "5 days ago",
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
      timestamp: "07:45 AM",
    },
    {
      id: "m-6",
      sender: "ai",
      text: "Prescription Summary for Lisinopril 10mg Tablets:\n\n• **Instructions:** Take 1 tablet orally every morning with water.\n• **Refills Remaining:** 3 refills available.\n• **Monitoring:** Check your blood pressure weekly as recommended by your physician.",
      timestamp: "07:46 AM",
    },
  ],
  "conv-4": [
    {
      id: "m-7",
      sender: "user",
      text: "I am experiencing sudden tight chest pressure radiating to my left arm",
      timestamp: "Yesterday",
    },
    {
      id: "m-8",
      sender: "ai",
      text: "CRITICAL HEALTH ALERT: Chest pressure radiating to your arm or jaw is a major red-flag symptom of an acute medical emergency.\n\nDo not delay — please seek emergency medical evaluation immediately (call 911 or visit the nearest emergency room).",
      timestamp: "Yesterday",
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
  "conv-5": [
    {
      id: "m-9",
      sender: "user",
      text: "Can you help me understand my Complete Blood Count (CBC) results?",
      timestamp: "Yesterday",
    },
    {
      id: "m-10",
      sender: "ai",
      text: "Here is a breakdown of standard Complete Blood Count (CBC) indicators:\n\n• **White Blood Cells (WBC):** 4,500 – 11,000 /µL (Immune defense)\n• **Red Blood Cells (RBC):** 4.5 – 5.9 million/µL (Oxygen transport)\n• **Hemoglobin (Hb):** 13.5 – 17.5 g/dL for men, 12.0 – 15.5 g/dL for women\n• **Platelets:** 150,000 – 450,000 /µL (Clotting)\n\nYou can also upload your lab PDF directly to see automated biomarker ranges!",
      timestamp: "Yesterday",
    },
  ],
  "conv-6": [
    {
      id: "m-11",
      sender: "user",
      text: "What are the common side effects of Metformin and best times to take it?",
      timestamp: "Yesterday",
    },
    {
      id: "m-12",
      sender: "ai",
      text: "Metformin Clinical Guidance:\n\n• **Timing:** Best taken with evening meal to minimize gastrointestinal upset.\n• **Common Side Effects:** Mild stomach cramping, nausea, or loose stools during initial weeks.\n• **Diet Advice:** Limit high-refined sugar intake and stay well-hydrated.\n• **Note:** Avoid heavy alcohol consumption while on Metformin.",
      timestamp: "Yesterday",
    },
  ],
  "conv-7": [
    {
      id: "m-13",
      sender: "user",
      text: "My Vitamin D is 18 ng/mL. How severe is this deficiency?",
      timestamp: "2 days ago",
    },
    {
      id: "m-14",
      sender: "ai",
      text: "Vitamin D Assessment:\n\n• **Your Level:** 18 ng/mL indicates mild to moderate deficiency (Optimal range: 30 – 50 ng/mL).\n• **Recommendations:** A weekly high-dose supplement (e.g. 50,000 IU D3) or daily 2,000 IU regimen is commonly prescribed by physicians.\n• **Co-factors:** Ensure adequate dietary magnesium and calcium for optimal absorption.",
      timestamp: "2 days ago",
    },
  ],
  "conv-8": [
    {
      id: "m-15",
      sender: "user",
      text: "Difference between Cetirizine and Fexofenadine for pollen allergies?",
      timestamp: "3 days ago",
    },
    {
      id: "m-16",
      sender: "ai",
      text: "Antihistamine Comparison:\n\n• **Cetirizine (Zyrtec):** Fast-acting with strong symptom relief; may cause mild drowsiness in ~10% of users.\n• **Fexofenadine (Allegra):** True non-sedating 2nd generation antihistamine; does not cross the blood-brain barrier.\n• **Tip:** Avoid taking Fexofenadine with grapefruit juice as it reduces absorption.",
      timestamp: "3 days ago",
    },
  ],
  "conv-9": [
    {
      id: "m-17",
      sender: "user",
      text: "My blood pressure reading was 134/86 mmHg this morning. Is that Stage 1 hypertension?",
      timestamp: "4 days ago",
    },
    {
      id: "m-18",
      sender: "ai",
      text: "Blood Pressure Reading Analysis:\n\n• **Systolic (134 mmHg):** Stage 1 Hypertension category (130–139 mmHg).\n• **Diastolic (86 mmHg):** Stage 1 Hypertension category (80–89 mmHg).\n• **Next Steps:** Record morning and evening readings for 7 days before concluding hypertension. Avoid caffeine 30 mins prior to measurement.",
      timestamp: "4 days ago",
    },
  ],
  "conv-10": [
    {
      id: "m-19",
      sender: "user",
      text: "Best recovery protocol for severe delayed onset muscle soreness (DOMS)?",
      timestamp: "5 days ago",
    },
    {
      id: "m-20",
      sender: "ai",
      text: "DOMS Recovery Protocol:\n\n• **Active Recovery:** 15–20 minutes of light walking or cycling to stimulate lymphatic blood flow.\n• **Hydration & Electrolytes:** Replenish sodium, potassium, and magnesium.\n• **Cold/Heat:** Alternating contrast showers or warm Epsom salt soak.\n• **Warning Signs:** If urine appears dark brown/tea-colored or extreme swelling occurs, seek immediate evaluation to rule out rhabdomyolysis.",
      timestamp: "5 days ago",
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMedicineAnalyzerOpen, setIsMedicineAnalyzerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | "gu">("en");

  // Active Report state for side-by-side partition view
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [isReportExpanded, setIsReportExpanded] = useState(false);

  const { user, token, loading } = useAuth() as { user: any; token: string | null; loading: boolean };

  const tokenRef = useRef<string | null>(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncSidebarLayout = () => {
      if (window.innerWidth >= 1024) setIsMobileSidebarOpen(false);
    };

    syncSidebarLayout();
    mediaQuery.addEventListener("change", syncSidebarLayout);
    return () => mediaQuery.removeEventListener("change", syncSidebarLayout);
  }, []);

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

  const handleSendMessage = async (text: string, attachment?: File | null): Promise<string | null> => {
    if (!text && !attachment) return null;

    let attachmentData;
    if (attachment) {
      const isPdf = attachment.type.includes("pdf") || attachment.name.endsWith(".pdf");
      const isImg = attachment.type.startsWith("image/");
      attachmentData = {
        name: attachment.name,
        size: (attachment.size / 1024).toFixed(1) + " KB",
        type: isPdf ? "PDF Lab Document" : isImg ? "Medical Image" : "Document",
        fileType: (isPdf ? "pdf" : isImg ? "image" : "doc") as "pdf" | "image" | "doc",
        url: isImg ? URL.createObjectURL(attachment) : undefined,
      };
    }

    const userMsg: Message = {
      id: "m-" + Date.now(),
      sender: "user",
      text: text || (attachment ? `Uploaded document: ${attachment.name}` : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachment: attachmentData,
    };

    const currentMsgs = threadMap[activeId] || [];
    const updatedMsgs = [...currentMsgs, userMsg];

    if (activeConversation && (activeConversation.title === "New Health Query" || activeId === NEW_CHAT_ID)) {
      const summaryTitle = text.slice(0, 28) + (text.length > 28 ? "..." : "");
      handleRenameConversation(activeId, summaryTitle || (attachment ? "Lab Report Analysis" : "Health Query"));
    }

    setThreadMap((prev) => ({ ...prev, [activeId]: updatedMsgs }));
    setIsGenerating(true);
    const requestStartTime = performance.now();

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
        const durationSec = Math.max(0.1, Number(((performance.now() - requestStartTime) / 1000).toFixed(1)));

        // Set active report to display in partition side panel right inside chat!
        setActiveReport(data);

        const aiMsg: Message = {
          id: "m-" + (Date.now() + 1),
          sender: "ai",
          text: `Report analyzed — Overall Status: ${data.overall_status}. Extracted ${data.results?.length ?? 0} biomarker(s).\n\nThe document preview and biomarker breakdown panel is open on the right. Ask me any questions about your lab results!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingTime: durationSec,
        };

        setThreadMap((prev) => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), aiMsg],
        }));
        setIsGenerating(false);
      } catch (err: unknown) {
        const durationSec = Math.max(0.1, Number(((performance.now() - requestStartTime) / 1000).toFixed(1)));
        const errMsg: Message = {
          id: "m-" + (Date.now() + 1),
          sender: "ai",
          text: `❌ Failed to analyze report: ${err instanceof Error ? err.message : "Unknown error"}. Please try uploading again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingTime: durationSec,
        };
        setThreadMap((prev) => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), errMsg],
        }));
        setIsGenerating(false);
      }
      return null;
    }

    // ── TEXT-ONLY CLINICAL RESPONSE PATH ─────────────────────────────────
    try {
      const data = await sendChatMessage(text, selectedLanguage);
      const durationSec = Math.max(0.1, Number(((performance.now() - requestStartTime) / 1000).toFixed(1)));
      const aiMsg: Message = {
        id: "m-" + (Date.now() + 1),
        sender: "ai",
        text: data.text,
        structuredResponse: data,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thinkingTime: durationSec,
      };
      setThreadMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), aiMsg],
      }));
      setIsGenerating(false);
      return data.text;
    } catch (error) {
      // Preserve the existing offline UI behavior if the backend is unreachable.
      const durationSec = Math.max(0.1, Number(((performance.now() - requestStartTime) / 1000).toFixed(1)));
      const errorText = error instanceof Error ? error.message : "Unknown API error";
      console.error("Chat request failed:", error);
      const errorMsg: Message = {
        id: "m-" + (Date.now() + 1),
        sender: "ai",
        text: `I couldn't complete that request right now. ${errorText}\n\nPlease check the connection and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thinkingTime: durationSec,
      };
      setThreadMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), errorMsg],
      }));
      setIsGenerating(false);
      return null;
    }

    setTimeout(() => {
      let replyCardType: "medicine" | "lab" | "prescription" | "emergency" | undefined;
      let replyCardData: Message["cardData"];
      let replyText = "The symptom prediction service is unavailable. Please start the Flask backend on http://localhost:5000 and try again.";

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
      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--surface)]/60 sm:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="z-50 h-screen shrink-0 sm:relative">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          conversations={conversations}
          activeConversationId={activeId}
          onSelectConversation={setActiveId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onOpenVoiceMode={() => setIsVoiceOpen(true)}
          onOpenSettings={(tab) => {
            setSettingsTab(tab || "general");
            setIsSettingsOpen(true);
          }}
        />
      </div>

      {/* Main Content Area — Partitions when activeReport is present */}
      <div className="flex-1 flex h-full min-w-0 relative overflow-hidden">
        {/* Ambient WebGL Aurora background effect for Chat section */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-85">
          <Aurora
            colorStops={["#3B82F6", "#5B9CFF", "#2563EB"]}
            blend={0.5}
            amplitude={1.0}
            speed={0.5}
          />
        </div>

        {/* Chat Stream (Left Partition) */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
          <TopBar
            title={activeConversation?.title || "Elixora Health Assistant"}
            onOpenVoiceMode={() => setIsVoiceOpen(true)}
            onOpenSettings={(tab) => {
              setSettingsTab(tab || "general");
              setIsSettingsOpen(true);
            }}
            onToggleSidebarMobile={() => setIsMobileSidebarOpen((open) => !open)}
            onGoToLanding={() => router.push("/")}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />

          <main className={`flex-1 min-h-0 overflow-y-auto flex flex-col relative ${activeMessages.length === 0 ? "justify-center" : ""}`}>
            {activeMessages.length === 0 ? (
              <EmptyState
                onSelectPrompt={(pText) => handleSendMessage(pText)}
                InputBarComponent={
                  <InputBar
                    onSendMessage={handleSendMessage}
                    onOpenVoiceMode={() => setIsVoiceOpen(true)}
                    onOpenMedicineAnalyzer={() => setIsMedicineAnalyzerOpen(true)}
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
              onOpenMedicineAnalyzer={() => setIsMedicineAnalyzerOpen(true)}
              isLoading={isGenerating}
              className="sticky bottom-0 z-20 pb-4"
            />
          )}
        </div>

        {/* ── Report Analyzer Side Panel (Right Partition Screen) ─────────────── */}
        {activeReport && (
          <div className={`h-full shrink-0 z-30 transition-all duration-300 ${isReportExpanded
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
      {isMedicineAnalyzerOpen && (
        <MedicineAnalyzerModal
          token={token}
          onClose={() => setIsMedicineAnalyzerOpen(false)}
        />
      )}
      <VoiceModeModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendTranscript={handleSendMessage}
      />

      {/* Settings Modal matching Claude screenshot */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />
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
