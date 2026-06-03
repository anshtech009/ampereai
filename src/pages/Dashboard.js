import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getMonthlyBill, getCatIcon, TARIFFS, calcEnergy } from '../utils/electricity';
import { generatePDF } from '../utils/generatePDF';
import AnomalyDetector from '../components/AnomalyDetector';
import CountUp from '../components/CountUp';
import { FileDown } from 'lucide-react';

function StatCard({ label, value, sub, color, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 flex flex-col gap-1 border border-white/15 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/20 ${className}`}>
      {/* top sheen — light catching the glass edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <span className="text-xs text-white/40 uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</span>
      {sub && <span className="text-xs text-white/30">{sub}</span>}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning! 🌅';
  if (hour < 17) return 'Good afternoon! ☀️';
  if (hour < 21) return 'Good evening! 🌆';
  return 'Good night! 🌙';
}

function Dashboard() {
  const { appliances, state } = useApp();
  const tariff = TARIFFS[state] || TARIFFS['odisha'];

  let username = 'User';
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('username');
    if (raw) {
      const parsed = JSON.parse(raw);
      username = parsed.name || parsed.username || parsed.email || 'User';
    }
  } catch {
    username = localStorage.getItem('username') || 'User';
  }

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const daily = appliances.reduce((s, a) => s + calcEnergy(a, 1), 0);
  const monthly = appliances.reduce((s, a) => s + calcEnergy(a, 30), 0);
  const bill = getMonthlyBill(monthly, tariff);

  const sorted = [...appliances].sort((a, b) =>
    (b.wattage * b.hoursPerDay) - (a.wattage * a.hoursPerDay)
  );
  const maxU = Math.max(...appliances.map(a => calcEnergy(a, 1)), 0.01);

  const tips = [];
  const top = sorted[0];
  if (top && top.hoursPerDay > 4)
    tips.push({
      icon: '⚡',
      text: `Reduce ${top.name} by 1 hr/day`,
      save: `Save ~${(top.wattage / 1000 * 30).toFixed(1)} kWh/month`
    });
  const ac = appliances.find(a => a.category === 'AC' && a.wattage > 500);
  if (ac)
    tips.push({ icon: '🌡️', text: `Set ${ac.name} to 24°C`, save: 'Saves up to 25% AC energy' });
  const tv = appliances.find(a => a.category === 'Entertainment');
  if (tv && tv.hoursPerDay > 3)
    tips.push({
      icon: '📺',
      text: `Limit ${tv.name} by 2 hrs`,
      save: `Save ~₹${Math.round((tv.wattage * 2 / 1000) * 30 * 6)}/month`
    });
  tips.push({ icon: '🌙', text: 'Unplug standby devices at night', save: 'Saves 5-10% passively' });

  return (
    <div className="px-4 py-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-6 animate-in">
        <h1 className="text-2xl font-bold tracking-tight">{getGreeting()} 👋</h1>
        <p className="text-white/40 text-sm mt-1">Here's your energy overview</p>
        {/* Date and Time */}
        <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between backdrop-blur-xl">
          <div>
            <p className="text-white/60 text-xs">{dateStr}</p>
          </div>
          <div>
            <p className="text-blue-400 text-sm font-semibold font-mono">{timeStr}</p>
          </div>
        </div>

        {/* Export PDF Button */}
        <button
          onClick={() => generatePDF({ appliances, state, username })}
          disabled={appliances.length === 0}
          className="mt-3 flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm px-4 py-2 rounded-full hover:bg-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Today's Usage" value={<CountUp end={daily} decimals={2} suffix=" kWh" duration={2000} />} color="text-blue-400" className="animate-in delay-1" />
        <StatCard label="Monthly Units" value={<CountUp end={monthly} suffix=" kWh" duration={2000} />} color="text-yellow-400" className="animate-in delay-2" />
        <StatCard label="Est. Monthly Bill" value={<CountUp end={bill} prefix="₹" duration={2000} />} color="text-red-400" sub="incl. fixed charges" className="animate-in delay-3" />
        <StatCard label="Appliances" value={<CountUp end={appliances.length} duration={2000} />} color="text-green-400" sub="being tracked" className="animate-in delay-4" />
      </div>

      <div className="relative overflow-hidden bg-white/5 border border-white/15 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-lg shadow-black/20 animate-in delay-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
          Appliance Usage Today
        </h2>
        {appliances.map(a => {
          const u = calcEnergy(a, 1);
          const pct = Math.round((u / maxU) * 100);
          return (
            <div key={a._id} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{getCatIcon(a.category)} {a.name}</span>
                <span className="text-white/40">{u.toFixed(3)} kWh</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative overflow-hidden bg-white/5 border border-white/15 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-lg shadow-black/20 animate-in delay-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
          Smart Tips
        </h2>
        {tips.map((tip, i) => (
          <div key={i} className="flex gap-3 items-start mb-3 last:mb-0">
            <span className="text-xl">{tip.icon}</span>
            <div>
              <p className="text-sm font-medium">{tip.text}</p>
              <p className="text-xs text-green-400 mt-0.5">{tip.save}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Anomaly Detector */}
      <div className="animate-in delay-7">
        <AnomalyDetector />
      </div>
    </div>
  );
}

export default Dashboard;