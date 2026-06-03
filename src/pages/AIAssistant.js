import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { calcEnergy, getMonthlyBill, TARIFFS } from "../utils/electricity";
import { Send, Sparkles, User, Zap } from "lucide-react";

const SUGGESTIONS = [
  "Which appliance costs me the most?",
  "How can I reduce my bill by 20%?",
  "Is my usage high for my state?",
  "What uses electricity even when off?",
];

export default function AIAssistant() {
  const { appliances, state } = useApp();
  const tariff = TARIFFS[state] || TARIFFS["maharashtra"];

  const totalUnits = appliances.reduce((s, a) => s + calcEnergy(a, 30), 0);
  const totalBill = getMonthlyBill(totalUnits, tariff);

  // Pull the user's name from storage for personalization
  let username = "there";
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      username = parsed.name || parsed.username || parsed.email || "there";
    }
  } catch {
    username = "there";
  }

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm AmperAI ⚡ — your personal energy assistant. Your estimated bill this month is ₹${totalBill.toFixed(0)}. Ask me anything about your usage or how to save!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const userMsg = { role: "user", content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    // Build context from the user's real data
    const context = {
      name: username,
      state,
      totalUnits,
      totalBill,
      appliances: appliances.map((a) => ({
        name: a.name,
        wattage: a.wattage,
        hoursPerDay: a.hoursPerDay,
        category: a.category,
      })),
    };

    // Send only the last 10 messages to keep the request light
    const recentHistory = updated.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: recentHistory,
          context,
        }),
      });

      const data = await response.json();
      const reply =
        data?.reply ||
        "Sorry, I couldn't get a response. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (appliances.length === 0) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto opacity-50" />
          <p className="text-white/50 text-sm">No appliances added yet.</p>
          <p className="text-white/30 text-xs">Add appliances so I can give personalized advice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 border-b border-white/5 flex-shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">AmperAI Assistant</h1>
            <p className="text-white/40 text-xs">Powered by AI · Knows your usage</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 text-xs">online</span>
          </div>
        </div>

        {/* Context pill */}
        <div className="mt-3 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 w-fit backdrop-blur-xl">
          <Zap className="w-3 h-3 text-blue-400" />
          <span className="text-white/50 text-xs">
            {appliances.length} appliances · ₹{totalBill.toFixed(0)}/mo · {state}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mb-0.5 ${
                m.role === "assistant"
                  ? "bg-gradient-to-br from-blue-500 to-cyan-400"
                  : "bg-white/10"
              }`}
            >
              {m.role === "assistant" ? (
                <Sparkles className="w-3.5 h-3.5 text-white" />
              ) : (
                <User className="w-3.5 h-3.5 text-white/70" />
              )}
            </div>

            <div
              className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed backdrop-blur-xl ${
                m.role === "assistant"
                  ? "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"
                  : "bg-blue-500/20 border border-blue-500/30 text-white rounded-br-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex-shrink-0 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 backdrop-blur-xl">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex-shrink-0">
          <p className="text-white/30 text-xs mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-full hover:bg-white/10 hover:text-white/80 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-5 pb-8 pt-3 border-t border-white/5 flex-shrink-0 backdrop-blur-xl">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your electricity..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !loading
                ? "bg-blue-500 text-white hover:bg-blue-400 active:scale-95"
                : "bg-white/5 text-white/20"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-white/20 text-xs text-center mt-2">
          AmperAI reads your appliance data to give personalized answers
        </p>
      </div>
    </div>
  );
}