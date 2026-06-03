import React, { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calcEnergy, getMonthlyBill, TARIFFS } from "../utils/electricity";
import { MapPin, TrendingDown, TrendingUp, Minus, Globe } from "lucide-react";
import GlassCard from "../components/GlassCard";

export default function TariffSimulator() {
  const { appliances, state } = useApp();

  // Total monthly units (same for every state — only the tariff changes)
  const totalUnits = useMemo(
    () => appliances.reduce((s, a) => s + calcEnergy(a, 30), 0),
    [appliances]
  );

  // Build a comparison across every real state (skip 'custom' / null slabs)
  const comparison = useMemo(() => {
    return Object.entries(TARIFFS)
      .filter(([key, t]) => t.slabs)
      .map(([key, t]) => ({
        key,
        name: t.name,
        bill: getMonthlyBill(totalUnits, t),
        isCurrent: key === state,
      }))
      .sort((a, b) => a.bill - b.bill);
  }, [totalUnits, state]);

  const currentBill = comparison.find((c) => c.isCurrent)?.bill || 0;
  const cheapest = comparison[0];
  const costliest = comparison[comparison.length - 1];
  const maxBill = costliest?.bill || 1;

  if (appliances.length === 0) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Globe className="w-12 h-12 text-blue-400 mx-auto opacity-50" />
          <p className="text-white/50 text-sm">No appliances added yet.</p>
          <p className="text-white/30 text-xs">
            Add appliances to compare tariffs across states.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 animate-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-400 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tariff Simulator</h1>
            <p className="text-white/40 text-sm">
              Your {totalUnits.toFixed(0)} kWh/month across different states
            </p>
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 backdrop-blur-xl animate-in delay-1">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400/70 uppercase tracking-widest">
              Cheapest
            </span>
          </div>
          <p className="text-lg font-bold text-green-400">₹{cheapest.bill.toFixed(0)}</p>
          <p className="text-xs text-white/40">{cheapest.name}</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 backdrop-blur-xl animate-in delay-2">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400/70 uppercase tracking-widest">
              Costliest
            </span>
          </div>
          <p className="text-lg font-bold text-red-400">₹{costliest.bill.toFixed(0)}</p>
          <p className="text-xs text-white/40">{costliest.name}</p>
        </div>
      </div>

      {/* Comparison bars */}
      <GlassCard className="p-5 animate-in delay-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
          State-by-State Comparison
        </h2>

        <div className="space-y-4">
          {comparison.map((c) => {
            const pct = Math.round((c.bill / maxBill) * 100);
            const diff = c.bill - currentBill;

            return (
              <div key={c.key}>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="flex items-center gap-2">
                    {c.isCurrent && <MapPin className="w-3.5 h-3.5 text-blue-400" />}
                    <span className={c.isCurrent ? "font-semibold text-white" : "text-white/70"}>
                      {c.name}
                    </span>
                    {c.isCurrent && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-white/90">₹{c.bill.toFixed(0)}</span>
                    {!c.isCurrent && (
                      <span
                        className={`text-xs flex items-center gap-0.5 ${
                          diff < 0 ? "text-green-400" : diff > 0 ? "text-red-400" : "text-white/40"
                        }`}
                      >
                        {diff < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : diff > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {diff < 0 ? "-" : "+"}₹{Math.abs(diff).toFixed(0)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      c.isCurrent
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                        : c.key === cheapest.key
                        ? "bg-gradient-to-r from-green-500 to-emerald-400"
                        : c.key === costliest.key
                        ? "bg-gradient-to-r from-red-500 to-orange-400"
                        : "bg-white/30"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Takeaway */}
      <div className="mt-4 animate-in delay-4">
        <GlassCard className="p-4 flex gap-3">
          <Globe className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/70 leading-relaxed">
            For your usage of <span className="text-white font-semibold">{totalUnits.toFixed(0)} kWh/month</span>,{" "}
            {state === cheapest.key ? (
              <>you're already in the cheapest state — nice! 🎉</>
            ) : (
              <>
                <span className="text-green-400 font-semibold">{cheapest.name}</span> would be cheapest at{" "}
                <span className="text-green-400 font-semibold">₹{cheapest.bill.toFixed(0)}</span> — that's{" "}
                <span className="text-green-400 font-semibold">₹{(currentBill - cheapest.bill).toFixed(0)}</span>{" "}
                less than your current state per month.
              </>
            )}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}