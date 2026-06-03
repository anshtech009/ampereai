import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calcEnergy, getMonthlyBill, TARIFFS } from "../utils/electricity";
import {
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Zap,
  Sparkles,
  Loader2,
} from "lucide-react";

// Devices that legitimately run 24/7 — don't flag them for long runtime
const ALWAYS_ON = ["fridge", "refriger", "freezer", "router", "modem"];

function isAlwaysOn(a) {
  const tag = `${a.name} ${a.category || ""}`.toLowerCase();
  return ALWAYS_ON.some((k) => tag.includes(k));
}

function detectAnomalies(appliances, totalUnits, tariff) {
  const list = appliances
    .map((a) => ({ ...a, units: calcEnergy(a, 30) }))
    .sort((x, y) => y.units - x.units);

  const anomalies = [];

  // 1. One appliance dominating total usage (>40%)
  list.forEach((a) => {
    const share = totalUnits > 0 ? (a.units / totalUnits) * 100 : 0;
    if (share >= 40) {
      anomalies.push({
        id: `dom-${a._id || a.name}`,
        severity: "high",
        icon: "trend",
        title: `${a.name} is eating most of your power`,
        detail: `It alone makes up ${share.toFixed(0)}% of your monthly usage (~${a.units.toFixed(0)} kWh ≈ ₹${getMonthlyBill(a.units, tariff).toFixed(0)}). One device this dominant is unusual — check if it's oversized or running longer than needed.`,
      });
    }
  });

  // 2. Appliance left running too long (>16h/day, excluding always-on devices)
  list.forEach((a) => {
    if (!isAlwaysOn(a) && a.hoursPerDay >= 16) {
      anomalies.push({
        id: `run-${a._id || a.name}`,
        severity: a.hoursPerDay >= 20 ? "high" : "medium",
        icon: "clock",
        title: `${a.name} runs ${a.hoursPerDay}h/day`,
        detail: `That's almost always on. If it doesn't truly need this much runtime, cutting back even a few hours could save a real chunk of your bill.`,
      });
    }
  });

  // 3. High-wattage device used heavily (>=1500W and >=4h)
  list.forEach((a) => {
    if (a.wattage >= 1500 && a.hoursPerDay >= 4) {
      anomalies.push({
        id: `pow-${a._id || a.name}`,
        severity: "medium",
        icon: "zap",
        title: `${a.name} is a high-wattage drain`,
        detail: `At ${a.wattage}W for ${a.hoursPerDay}h/day it adds up fast (~${a.units.toFixed(0)} kWh/mo). Shifting it to off-peak hours or reducing runtime helps most here.`,
      });
    }
  });

  // 4. Total consumption benchmark vs typical Indian household (150–250 kWh)
  if (totalUnits >= 600) {
    anomalies.push({
      id: "total-vhigh",
      severity: "high",
      icon: "trend",
      title: "Your total usage is very high",
      detail: `At ~${totalUnits.toFixed(0)} kWh/month you're well above a typical Indian household (150–250 kWh). Those extra units fall in the steepest tariff slab.`,
    });
  } else if (totalUnits >= 400) {
    anomalies.push({
      id: "total-high",
      severity: "medium",
      icon: "trend",
      title: "Usage is above average",
      detail: `~${totalUnits.toFixed(0)} kWh/month is higher than a typical home (150–250 kWh). Trimming your top appliances would bring this down.`,
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  const seen = new Set();
  return anomalies
    .filter((x) => (seen.has(x.id) ? false : seen.add(x.id)))
    .sort((a, b) => order[a.severity] - order[b.severity]);
}

const ICONS = { trend: TrendingUp, clock: Clock, zap: Zap };

const STYLES = {
  high: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    chip: "bg-red-500/20 text-red-300",
    label: "High",
  },
  medium: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    chip: "bg-amber-500/20 text-amber-300",
    label: "Medium",
  },
};

export default function AnomalyDetector() {
  const { appliances, state } = useApp();
  const tariff = TARIFFS[state] || TARIFFS["maharashtra"];

  const totalUnits = useMemo(
    () => appliances.reduce((s, a) => s + calcEnergy(a, 30), 0),
    [appliances]
  );

  const anomalies = useMemo(
    () => detectAnomalies(appliances, totalUnits, tariff),
    [appliances, totalUnits, tariff]
  );

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const explainWithAI = async () => {
    if (aiLoading || anomalies.length === 0) return;
    setAiLoading(true);
    setAiText("");

    const summary = anomalies
      .map((a, i) => `${i + 1}. ${a.title} — ${a.detail}`)
      .join("\n");

    const message = `I'm in ${state}, India. My energy app detected these issues with my electricity usage:\n\n${summary}\n\nIn 3-4 short sentences, explain what's likely causing this and give me the single most impactful action I can take to lower my bill.`;

    try {
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setAiText(data?.reply || "Couldn't generate an explanation right now.");
    } catch {
      setAiText("AI explanation unavailable — check that the backend is running.");
    } finally {
      setAiLoading(false);
    }
  };

  if (appliances.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-red-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold leading-tight">Anomaly Detector</h2>
          <p className="text-white/40 text-xs">
            {anomalies.length > 0
              ? `${anomalies.length} issue${anomalies.length > 1 ? "s" : ""} found in your usage`
              : "Scanning your appliances for unusual patterns"}
          </p>
        </div>
      </div>

      {/* Healthy state */}
      {anomalies.length === 0 && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-white/80">
            Everything looks healthy — no unusual usage patterns detected. 🎉
          </p>
        </div>
      )}

      {/* Anomaly cards */}
      <div className="space-y-3">
        {anomalies.map((a) => {
          const s = STYLES[a.severity];
          const Icon = ICONS[a.icon] || AlertTriangle;
          return (
            <div
              key={a.id}
              className={`flex gap-3 ${s.bg} ${s.border} border rounded-xl p-4`}
            >
              <Icon className={`w-5 h-5 ${s.text} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white/90">{a.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.chip}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{a.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI explanation */}
      {anomalies.length > 0 && (
        <div className="mt-4">
          <button
            onClick={explainWithAI}
            disabled={aiLoading}
            className="flex items-center gap-2 text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-full hover:bg-blue-500/30 transition-all disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {aiLoading ? "Thinking..." : "Explain with AI"}
          </button>

          {aiText && (
            <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {aiText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}