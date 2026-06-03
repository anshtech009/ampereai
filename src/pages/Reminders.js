import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calcEnergy, getMonthlyBill, getCatIcon, TARIFFS } from "../utils/electricity";
import { Bell, CheckCircle, Clock, Zap, Droplets, Wind, Sun } from "lucide-react";
import GlassCard from "../components/GlassCard";

const REMINDER_RULES = [
  {
    id: "peak_hours",
    icon: <Clock className="w-4 h-4" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    title: "Avoid Peak Hours",
    desc: "Run heavy appliances before 6 PM or after 11 PM to save on peak tariffs.",
    category: "all",
    condition: () => true,
  },
  {
    id: "ac_temp",
    icon: <Wind className="w-4 h-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Set AC to 24°C",
    desc: "Every degree below 24°C increases energy use by ~6%. Set it and forget it.",
    category: "AC",
    condition: (appliances) => appliances.some((a) => a.category === "AC"),
  },
  {
    id: "fridge_door",
    icon: <Droplets className="w-4 h-4" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    title: "Check Fridge Seals",
    desc: "A loose fridge door seal makes the compressor work harder. Check monthly.",
    category: "Refrigerator",
    condition: (appliances) =>
      appliances.some((a) => a.category === "Refrigerator"),
  },
  {
    id: "standby_power",
    icon: <Zap className="w-4 h-4" />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    title: "Unplug Standby Devices",
    desc: "TVs, chargers, and set-top boxes on standby waste 5–10% of your bill.",
    category: "all",
    condition: () => true,
  },
  {
    id: "natural_light",
    icon: <Sun className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    title: "Use Natural Light",
    desc: "Turn off lights during daylight hours (9 AM – 5 PM) and open curtains.",
    category: "Lighting",
    condition: (appliances) =>
      appliances.some((a) => a.category === "Lighting"),
  },
  {
    id: "full_loads",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    title: "Run Full Loads Only",
    desc: "Washing machines use the same energy whether half or full. Always run full loads.",
    category: "Washing Machine",
    condition: (appliances) =>
      appliances.some((a) => a.category === "Washing Machine"),
  },
  {
    id: "fan_before_ac",
    icon: <Wind className="w-4 h-4" />,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    title: "Fan Before AC",
    desc: "Use a ceiling fan for 10–15 mins before turning on AC to pre-circulate air.",
    category: "AC",
    condition: (appliances) =>
      appliances.some((a) => a.category === "AC") &&
      appliances.some((a) => a.category === "Fan"),
  },
];

export default function Reminders() {
  const { appliances, state } = useApp();
  const tariff = TARIFFS[state] || TARIFFS["maharashtra"];
  const [dismissed, setDismissed] = useState([]);
  const [done, setDone] = useState([]);

  const activeReminders = useMemo(() => {
    return REMINDER_RULES.filter(
      (r) => r.condition(appliances) && !dismissed.includes(r.id)
    );
  }, [appliances, dismissed]);

  const totalUnits = appliances.reduce((s, a) => s + calcEnergy(a, 30), 0);
  const totalBill = getMonthlyBill(totalUnits, tariff);

  // Top energy hogs (top 3 by bill share)
  const topHogs = useMemo(() => {
    return [...appliances]
      .map((a) => ({
        ...a,
        units: calcEnergy(a, 30),
        bill: getMonthlyBill(calcEnergy(a, 30), tariff),
      }))
      .sort((a, b) => b.bill - a.bill)
      .slice(0, 3);
  }, [appliances, tariff]);

  const toggleDone = (id) => {
    setDone((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const dismiss = (id) => {
    setDismissed((prev) => [...prev, id]);
    setDone((prev) => prev.filter((d) => d !== id));
  };

  if (appliances.length === 0) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Bell className="w-12 h-12 text-blue-400 mx-auto opacity-50" />
          <p className="text-white/50 text-sm">No appliances added yet.</p>
          <p className="text-white/30 text-xs">Add appliances to get smart reminders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 animate-in">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Daily Tips</p>
        <h1 className="text-2xl font-bold">Reminders</h1>
        <p className="text-white/40 text-xs mt-1">
          {activeReminders.length} active suggestion{activeReminders.length !== 1 ? "s" : ""} for you
        </p>
      </div>

      {/* Energy Hogs */}
      <div className="mx-5 mb-5">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3 animate-in delay-1">
          Top Energy Hogs
        </p>
        <div className="space-y-2">
          {topHogs.map((a, i) => {
            const share = totalBill > 0 ? (a.bill / totalBill) * 100 : 0;
            const barColors = [
              "from-red-500 to-orange-400",
              "from-orange-500 to-yellow-400",
              "from-yellow-500 to-amber-400",
            ];
            return (
              <GlassCard
                key={a._id}
                className={`px-4 py-3 animate-in delay-${i + 2}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCatIcon(a.category)}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      <p className="text-white/40 text-xs">
                        {a.hoursPerDay}h/day · {a.units.toFixed(1)} kWh
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      ₹{a.bill.toFixed(0)}
                    </p>
                    <p className="text-white/40 text-xs">{share.toFixed(0)}% of bill</p>
                  </div>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColors[i]}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Reminders List */}
      <div className="px-5 space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
          Smart Suggestions
        </p>

        {activeReminders.length === 0 && (
          <div className="text-center py-10">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3 opacity-60" />
            <p className="text-white/50 text-sm">All reminders dismissed.</p>
            <button
              onClick={() => setDismissed([])}
              className="mt-3 text-xs text-blue-400 underline"
            >
              Restore all
            </button>
          </div>
        )}

        {activeReminders.map((r) => {
          const isDone = done.includes(r.id);
          return (
            <div
              key={r.id}
              className={`border rounded-2xl px-4 py-3.5 transition-all duration-300 backdrop-blur-xl ${
                isDone
                  ? "bg-green-500/5 border-green-500/20 opacity-60"
                  : `${r.bg} ${r.border}`
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex-shrink-0 ${isDone ? "text-green-400" : r.color}`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : r.icon}
                  </div>
                  {/* Text */}
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isDone ? "text-white/40 line-through" : "text-white"
                      }`}
                    >
                      {r.title}
                    </p>
                    <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleDone(r.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      isDone
                        ? "border-green-500/30 text-green-400 bg-green-500/10"
                        : "border-white/10 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {isDone ? "Done ✓" : "Mark done"}
                  </button>
                  {!isDone && (
                    <button
                      onClick={() => dismiss(r.id)}
                      className="text-xs text-white/20 hover:text-white/40 transition-all"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restore dismissed */}
      {dismissed.length > 0 && activeReminders.length > 0 && (
        <div className="px-5 mt-5">
          <button
            onClick={() => setDismissed([])}
            className="w-full py-3 rounded-2xl border border-white/10 text-white/40 text-sm hover:text-white/70 hover:border-white/20 transition-all"
          >
            Restore {dismissed.length} Dismissed Reminder{dismissed.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}