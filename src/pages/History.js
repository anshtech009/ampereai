import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { calcEnergy, getMonthlyBill, getCatIcon, TARIFFS } from "../utils/electricity";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import GlassCard from "../components/GlassCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler
);

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Generate realistic mock history seeded from current bill
function generateHistory(currentBill, count = 6) {
  const history = [];
  let base = currentBill * (0.85 + Math.random() * 0.3);
  for (let i = count - 1; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const label = MONTHS[month.getMonth()] + " " + month.getFullYear().toString().slice(2);
    const variance = 0.88 + Math.random() * 0.28;
    base = base * variance;
    history.push({ label, bill: Math.round(base) });
  }
  return history;
}

const CHART_COLORS = [
  "#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b",
  "#10b981", "#f43f5e", "#a3e635",
];

export default function History() {
  const { appliances, state } = useApp();
  const tariff = TARIFFS[state] || TARIFFS["maharashtra"];
  const [activeTab, setActiveTab] = useState("line");

  // Current month bill
  const totalUnits = appliances.reduce((s, a) => s + calcEnergy(a, 30), 0);
  const currentBill = getMonthlyBill(totalUnits, tariff);

  // Build 6-month history (mock + current)
  const history = useMemo(() => {
    const past = generateHistory(currentBill, 5);
    const now = new Date();
    const currentLabel = MONTHS[now.getMonth()] + " " + now.getFullYear().toString().slice(2);
    return [...past, { label: currentLabel, bill: Math.round(currentBill) }];
  }, [currentBill]);

  const bills = history.map((h) => h.bill);
  const labels = history.map((h) => h.label);
  const maxBill = Math.max(...bills);
  const minBill = Math.min(...bills);
  const avgBill = Math.round(bills.reduce((s, b) => s + b, 0) / bills.length);

  // MoM change
  const lastBill = bills[bills.length - 2];
  const diff = currentBill - lastBill;
  const diffPct = lastBill > 0 ? ((diff / lastBill) * 100).toFixed(1) : 0;

  // Per-category breakdown for doughnut
  const categoryData = useMemo(() => {
    const map = {};
    appliances.forEach((a) => {
      const bill = getMonthlyBill(calcEnergy(a, 30), tariff);
      map[a.category] = (map[a.category] || 0) + bill;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, bill], i) => ({
        cat,
        bill: Math.round(bill),
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [appliances, tariff]);

  // Line chart config
  const lineData = {
    labels,
    datasets: [
      {
        data: bills,
        borderColor: "#3b82f6",
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, "rgba(59,130,246,0.25)");
          gradient.addColorStop(1, "rgba(59,130,246,0)");
          return gradient;
        },
        borderWidth: 2,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#000",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: "#111",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      titleColor: "rgba(255,255,255,0.5)",
      bodyColor: "#fff",
      callbacks: {
        label: (ctx) => ` ₹${ctx.parsed.y}`,
      },
    }},
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "rgba(255,255,255,0.4)", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "rgba(255,255,255,0.4)",
          font: { size: 11 },
          callback: (v) => `₹${v}`,
        },
      },
    },
  };

  // Doughnut config
  const doughnutData = {
    labels: categoryData.map((c) => c.cat),
    datasets: [
      {
        data: categoryData.map((c) => c.bill),
        backgroundColor: categoryData.map((c) => c.color),
        borderColor: "#000",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "rgba(255,255,255,0.5)",
        bodyColor: "#fff",
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed}`,
        },
      },
    },
  };

  if (appliances.length === 0) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <BarChart2 className="w-12 h-12 text-blue-400 mx-auto opacity-50" />
          <p className="text-white/50 text-sm">No data yet.</p>
          <p className="text-white/30 text-xs">Add appliances to see your bill history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 animate-in">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Analytics</p>
        <h1 className="text-2xl font-bold">Bill History</h1>
        <p className="text-white/40 text-xs mt-1">Last 6 months overview</p>
      </div>

      {/* Stats Row */}
      <div className="px-5 mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "This Month", value: `₹${Math.round(currentBill)}`, sub: `${totalUnits.toFixed(1)} kWh` },
          { label: "Avg / Month", value: `₹${avgBill}`, sub: "6-month avg" },
          { label: "MoM Change", value: `${diff >= 0 ? "+" : ""}₹${Math.round(diff)}`, sub: `${diffPct}%`, color: diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-white" },
        ].map((s, i) => (
          <GlassCard key={i} className={`px-3 py-3 text-center animate-in delay-${i + 1}`}>
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-base font-bold ${s.color || "text-white"}`}>{s.value}</p>
            <p className="text-white/30 text-xs">{s.sub}</p>
          </GlassCard>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="mx-5 mb-4 animate-in delay-4">
        <GlassCard className="p-1 flex">
          {["line", "doughnut"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab === "line" ? "📈 Trend" : "🥧 Breakdown"}
            </button>
          ))}
        </GlassCard>
      </div>

      {/* Line Chart */}
      {activeTab === "line" && (
        <div className="mx-5 mb-5">
          <GlassCard className="p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-white/70 text-sm font-medium">Monthly Bill Trend</p>
              <div className="flex items-center gap-1.5">
                {diff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-400" />
                ) : diff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-400" />
                ) : (
                  <Minus className="w-4 h-4 text-white/30" />
                )}
                <span className={`text-xs font-semibold ${diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-white/30"}`}>
                  {diff >= 0 ? "+" : ""}{diffPct}%
                </span>
              </div>
            </div>
            <div style={{ height: 200 }}>
              <Line data={lineData} options={lineOptions} />
            </div>
            {/* Min / Max callouts */}
            <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
              <div className="text-center">
                <p className="text-white/30 text-xs">Lowest</p>
                <p className="text-green-400 text-sm font-semibold">₹{minBill}</p>
              </div>
              <div className="text-center">
                <p className="text-white/30 text-xs">Average</p>
                <p className="text-white text-sm font-semibold">₹{avgBill}</p>
              </div>
              <div className="text-center">
                <p className="text-white/30 text-xs">Highest</p>
                <p className="text-red-400 text-sm font-semibold">₹{maxBill}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Doughnut Chart */}
      {activeTab === "doughnut" && (
        <div className="mx-5 mb-5">
          <GlassCard className="p-4">
            <p className="text-white/70 text-sm font-medium mb-4">Bill by Category</p>
            <div className="flex items-center gap-5">
              <div style={{ width: 150, height: 150, flexShrink: 0 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {categoryData.map((c) => (
                  <div key={c.cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-white/60 text-xs">{getCatIcon(c.cat)} {c.cat}</span>
                    </div>
                    <span className="text-white text-xs font-semibold">₹{c.bill}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <div className="px-5">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
          Month-by-Month
        </p>
        <GlassCard className="overflow-hidden">
          {history.slice().reverse().map((h, i) => {
            const isLatest = i === 0;
            const prevBill = history[history.length - 1 - i - 1]?.bill;
            const change = prevBill ? h.bill - prevBill : null;
            return (
              <div
                key={h.label}
                className={`flex items-center justify-between px-4 py-3 ${
                  i !== history.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLatest && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                      current
                    </span>
                  )}
                  <p className={`text-sm ${isLatest ? "text-white font-medium" : "text-white/60"}`}>
                    {h.label}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {change !== null && (
                    <span className={`text-xs ${change > 0 ? "text-red-400" : "text-green-400"}`}>
                      {change > 0 ? "▲" : "▼"} ₹{Math.abs(change)}
                    </span>
                  )}
                  <p className={`text-sm font-semibold ${isLatest ? "text-white" : "text-white/60"}`}>
                    ₹{h.bill}
                  </p>
                </div>
              </div>
            );
          })}
        </GlassCard>
      </div>
    </div>
  );
}