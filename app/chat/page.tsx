"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, Conversation } from "@/components/chat/sidebar";
import { TopBar } from "@/components/chat/top-bar";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageThread, Message } from "@/components/chat/message-thread";
import { InputBar } from "@/components/chat/input-bar";
import { VoiceModeModal } from "@/components/voice/voice-mode-modal";
import { useRouter } from "next/navigation";

// Initial Demo Conversations
const INITIAL_CONVERSATIONS: Conversation[] = [
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
      text: "Here is your verified medication guide for Amoxicillin 500mg. Always take antibiotics exactly as prescribed by your physician.",
      timestamp: "10:30 AM",
      cardType: "medicine",
      cardData: {
        name: "Amoxicillin 500mg Capsule",
        genericName: "Amoxicillin Trihydrate",
        dosage: "500 mg",
        frequency: "3 times daily",
        timing: "Every 8 hours with water",
        purpose: "Treatment of susceptible bacterial infections (ENT, respiratory tract, urinary tract).",
        sideEffects: ["Mild nausea", "Diarrhea", "Abdominal discomfort", "Headache", "Skin rash (rare)"],
        warnings: [
          "Do not take if you have a known penicillin allergy.",
          "Complete the entire 7 to 10 day course even if symptoms resolve early.",
        ],
      },
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
      text: "I analyzed your uploaded Lipid Panel report. Here is the biomarker breakdown along with clinical insights:",
      timestamp: "08:16 AM",
      cardType: "lab",
      cardData: {
        reportTitle: "Comprehensive Lipid Profile",
        patientName: "Dr. Alex Morgan",
        date: "2026-07-25",
        labName: "Quest Diagnostics Central Lab",
        items: [
          {
            biomarker: "Total Cholesterol",
            result: "240",
            unit: "mg/dL",
            referenceRange: "< 200 mg/dL",
            status: "High",
          },
          {
            biomarker: "LDL (Bad Cholesterol)",
            result: "155",
            unit: "mg/dL",
            referenceRange: "< 100 mg/dL",
            status: "High",
          },
          {
            biomarker: "HDL (Good Cholesterol)",
            result: "45",
            unit: "mg/dL",
            referenceRange: "> 40 mg/dL",
            status: "Normal",
          },
          {
            biomarker: "Triglycerides",
            result: "140",
            unit: "mg/dL",
            referenceRange: "< 150 mg/dL",
            status: "Normal",
          },
        ],
        overallSummary:
          "Your total cholesterol and LDL levels are moderately elevated. While HDL and Triglycerides are within target limits, adoption of a Mediterranean diet and routine cardiovascular evaluation with your PCP is advised.",
      },
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
      text: "Here is your prescription summary for Lisinopril from Metro Health Clinic:",
      timestamp: "Yesterday, 4:21 PM",
      cardType: "prescription",
      cardData: {
        rxNumber: "RX-8849201",
        doctorName: "Dr. Sarah Jenkins, MD",
        clinic: "Metro Cardiovascular Clinic",
        issueDate: "2026-06-15",
        refillsRemaining: 3,
        medications: [
          {
            name: "Lisinopril 10mg Tablets",
            instructions: "Take 1 tablet orally every morning with water. Monitor blood pressure weekly.",
            quantity: "90 Tablets (90-Day Supply)",
          },
        ],
      },
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
      text: "CRITICAL HEALTH ALERT: Chest pressure radiating to the arm is a major red-flag symptom of an acute cardiovascular event.",
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

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>("conv-1");
  const [threadMap, setThreadMap] = useState<Record<string, Message[]>>(MOCK_THREAD_DATA);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync dark class on document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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
    setThreadMap({ ...threadMap, [newId]: [] });
    setActiveId(newId);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeId === id && updated.length > 0) {
      setActiveId(updated[0].id);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(
      conversations.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleSendMessage = (text: string, attachment?: File | null) => {
    if (!text && !attachment) return;

    const userMsg: Message = {
      id: "m-" + Date.now(),
      sender: "user",
      text: text || "Uploaded document analysis",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const currentMsgs = threadMap[activeId] || [];
    const updatedMsgs = [...currentMsgs, userMsg];

    // Update conversation title if it was "New Health Query"
    if (activeConversation && activeConversation.title === "New Health Query") {
      const summaryTitle = text.slice(0, 28) + (text.length > 28 ? "..." : "");
      handleRenameConversation(activeId, summaryTitle || "Lab Analysis Query");
    }

    setThreadMap({ ...threadMap, [activeId]: updatedMsgs });
    setIsGenerating(true);

    // Simulate AI clinical response after 1.5 seconds
    setTimeout(() => {
      let replyCardType: "medicine" | "lab" | "prescription" | "emergency" | undefined;
      let replyCardData: Message["cardData"];
      let replyText = "I have processed your query based on current clinical reference guidelines.";

      const lower = text.toLowerCase();

      if (lower.includes("chest pain") || lower.includes("heart attack") || lower.includes("emergency")) {
        replyCardType = "emergency";
        replyText = "URGENT SAFETY NOTICE: Sudden severe symptoms require immediate triage.";
        replyCardData = {
          message: "Please do not delay seeking professional emergency care.",
        };
      } else if (lower.includes("lab") || lower.includes("blood test") || lower.includes("lipid") || lower.includes("cholesterol")) {
        replyCardType = "lab";
        replyText = "Analysis of your diagnostic values:";
        replyCardData = {
          reportTitle: "Complete Metabolic & Lipid Panel",
          patientName: "Patient Record",
          date: new Date().toISOString().split("T")[0],
          labName: "Clinical Diagnostics Center",
          items: [
            { biomarker: "Glucose (Fasting)", result: "92", unit: "mg/dL", referenceRange: "70 - 99 mg/dL", status: "Normal" },
            { biomarker: "HbA1c", result: "5.4", unit: "%", referenceRange: "< 5.7 %", status: "Normal" },
            { biomarker: "Total Cholesterol", result: "215", unit: "mg/dL", referenceRange: "< 200 mg/dL", status: "High" },
          ],
          overallSummary: "Fasting glucose and glycemic control parameters are excellent. Mild elevation in Total Cholesterol; lifestyle optimization recommended.",
        };
      } else if (lower.includes("cough") || lower.includes("fever") || lower.includes("symptom")) {
        replyText = "Based on your described symptoms (cough/fever):\n• Stay well hydrated with fluids & rest.\n• Monitor body temperature twice daily.\n• If high fever (>102°F) persists past 3 days or shortness of breath develops, consult your physician immediately.";
      } else {
        replyCardType = "medicine";
        replyText = "Here is the summary guide for your query:";
        replyCardData = {
          name: text.slice(0, 30),
          genericName: "Active Bio-Compound",
          dosage: "Standard Regimen",
          frequency: "As prescribed",
          timing: "Take with food",
          purpose: "Symptom management and targeted therapy.",
          sideEffects: ["Mild drowsiness", "Dry mouth"],
        };
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
    }, 1500);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Icon-Rail & Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        conversations={conversations}
        activeConversationId={activeId}
        onSelectConversation={setActiveId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenVoiceMode={() => setIsVoiceOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header */}
        <TopBar
          title={activeConversation?.title || "Aether Health Assistant"}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenVoiceMode={() => setIsVoiceOpen(true)}
          onGoToLanding={() => router.push("/")}
        />

        {/* Dynamic Center Stage: Empty State OR Message Thread */}
        <main className="flex-1 overflow-y-auto flex flex-col relative">
          {activeMessages.length === 0 ? (
            <EmptyState onSelectPrompt={(pText) => handleSendMessage(pText)} />
          ) : (
            <MessageThread messages={activeMessages} isGenerating={isGenerating} />
          )}
        </main>

        {/* Floating Pill Input Bar */}
        <InputBar
          onSendMessage={handleSendMessage}
          onOpenVoiceMode={() => setIsVoiceOpen(true)}
          isLoading={isGenerating}
        />
      </div>

      {/* Full-Screen Immersive Voice Mode Overlay */}
      <VoiceModeModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}
