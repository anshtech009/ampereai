import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calcEnergy, getMonthlyBill, getCatIcon, TARIFFS } from "../utils/electricity";
import { Zap, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "../components/GlassCard";

export default function Predict() {
  const { appliances, state } = useApp();
  const tariff = TARIFFS[state] || TARIFFS["maharashtra"];

  const [hoursMap, setHoursMap] = useState(() => {
    const map = {};
    appliances.forEach((a) => { map[a._id] = a.hoursPerDay; });
    return map;
  });

  const [daysInMonth, setDaysInMonth] = useState(30);
  const [expanded, setExpanded] = useState({});

  const predictions = useMemo(() => {
    return appliances.map((a) => {
      const hours = hoursMap[a._id] ?? a.hoursPerDay;
      const modified = { ...a, hoursPerDay: hours };
      const units = calcEnergy(modified, daysInMonth);
      const bill = getMonthlyBill(units, tariff);
      return { ...a, hours, units, bill };
    });
  }, [appliances, hoursMap, daysInMonth, tariff]);

  const totalUnits = predictions.reduce((s, a) => s + a.units, 0);
  const totalBill = getMonthlyBill(totalUnits, tariff);

  const currentUnits = appliances.reduce((s, a) => s + calcEnergy(a, daysInMonth), 0);
  const currentBill = getMonthlyBill(currentUnits, tariff);

  const diff = totalBill - currentBill;
  const diffPct = currentBill > 0 ? ((diff / currentBill) * 100).toFixed(1) : 0;

  const setHours = (id, val) => {
    setHoursMap((prev) => ({ ...prev, [id]: Math.max(0, Math.min(24, Number(val))) }));
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (appliances.length === 0) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Zap className="w-12 h-12 text-blue-400 mx-auto opacity-50" />
          <p className="text-white/50 text-sm">No appliances added yet.</p>
          <p className="text-white/30 text-xs">Go to Appliances to add some first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 animate-in">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Scenario Planner</p>
        <h1 className="text-2xl font-bold">Bill Predictor</h1>
        <p className="text-white/40 text-xs mt-1">Adjust usage sliders to see predicted impact</p>
      </div>

      {/* Days in Month Selector */}
      <div className="mx-5 mb-4 animate-in delay-1">
        <GlassCard className="px-4 py-3 flex items-center justify-between">
          <span className="text-white/60 text-sm">Days in month</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDaysInMonth((d) => Math.max(28, d - 1))}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:scale-95"
            >−</button>
            <span className="text-white font-semibold w-6 text-center">{daysInMonth}</span>
            <button
              onClick={() => setDaysInMonth((d) => Math.min(31, d + 1))}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:scale-95"
            >+</button>
          </div>
        </GlassCard>
      </div>

      {/* Summary Card */}
      <div className="mx-5 mb-5 rounded-2xl overflow-hidden border border-white/10 animate-in delay-2">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/10 px-5 py-4 backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/50 text-xs mb-1">Predicted Bill</p>
              <p className="text-3xl font-bold text-white">₹{totalBill.toFixed(0)}</p>
              <p className="text-white/40 text-xs mt-1">
                {totalUnits.toFixed(1)} kWh · {daysInMonth} days
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-xs mb-1">vs Current</p>
              <p className={`text-lg font-semibold ${diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-white/40"}`}>
                {diff > 0 ? "+" : ""}₹{diff.toFixed(0)}
              </p>
              <p className={`text-xs ${diff > 0 ? "text-red-400/70" : diff < 0 ? "text-green-400/70" : "text-white/30"}`}>
                {diff > 0 ? "▲" : diff < 0 ? "▼" : ""}
                {Math.abs(diffPct)}%
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/30 mb-1">
              <span>Current ₹{currentBill.toFixed(0)}</span>
              <span>Predicted ₹{totalBill.toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  diff > 0
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gradient-to-r from-blue-500 to-cyan-400"
                }`}
                style={{
                  width: `${Math.min(100, (totalBill / Math.max(currentBill, totalBill)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {diff > 50 && (
          <div className="bg-red-500/10 border-t border-red-500/20 px-5 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <p className="text-red-400/80 text-xs">
              High usage detected — try reducing peak-hour appliances.
            </p>
          </div>
        )}
        {diff < -50 && (
          <div className="bg-green-500/10 border-t border-green-500/20 px-5 py-2.5 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <p className="text-green-400/80 text-xs">
              Great savings! Your adjustments reduce the bill significantly.
            </p>
          </div>
        )}
      </div>

      {/* Appliance Sliders */}
      <div className="px-5 space-y-3">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3 animate-in delay-3">
          Adjust Daily Usage
        </p>
        {predictions.map((a) => {
          const isOpen = expanded[a._id];
          const savedHours = a.hoursPerDay;
          const currentHours = hoursMap[a._id] ?? savedHours;
          const changed = currentHours !== savedHours;

          return (
            <GlassCard key={a._id} className="overflow-hidden">
              {/* Top row — always visible */}
              <button
                onClick={() => toggleExpand(a._id)}
                className="w-full px-4 py-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCatIcon(a.category)}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white leading-tight">{a.name}</p>
                    <p className="text-white/40 text-xs">
                      {a.wattage}W · ₹{a.bill.toFixed(0)}/mo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {changed && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      modified
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </div>
              </button>

              {/* Expanded slider panel */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5">
                  <div className="flex justify-between items-center mt-3 mb-2">
                    <span className="text-white/50 text-xs">Hours/day</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          changed ? "text-blue-400" : "text-white"
                        }`}
                      >
                        {currentHours}h
                      </span>
                      {changed && (
                        <button
                          onClick={() => setHours(a._id, savedHours)}
                          className="text-xs text-white/30 hover:text-white/60 underline"
                        >
                          reset
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={0.5}
                    value={currentHours}
                    onChange={(e) => setHours(a._id, e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-blue-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-white/20 text-xs mt-1">
                    <span>0h</span>
                    <span>6h</span>
                    <span>12h</span>
                    <span>18h</span>
                    <span>24h</span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                      <p className="text-white/40 text-xs">Units</p>
                      <p className="text-white text-sm font-semibold">
                        {a.units.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                      <p className="text-white/40 text-xs">Est. Bill</p>
                      <p className="text-white text-sm font-semibold">
                        ₹{a.bill.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5 text-center">
                      <p className="text-white/40 text-xs">Share</p>
                      <p className="text-white text-sm font-semibold">
                        {totalBill > 0
                          ? ((a.bill / totalBill) * 100).toFixed(0)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Reset All */}
      <div className="px-5 mt-5">
        <button
          onClick={() => {
            const map = {};
            appliances.forEach((a) => { map[a._id] = a.hoursPerDay; });
            setHoursMap(map);
          }}
          className="w-full py-3 rounded-2xl border border-white/10 text-white/40 text-sm hover:text-white/70 hover:border-white/20 transition-all"
        >
          Reset All to Current Usage
        </button>
      </div>
    </div>
  );
}