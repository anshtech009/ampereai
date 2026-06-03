import React, { useState } from 'react';
import { TARIFFS } from '../utils/electricity';
import { useApp } from '../context/AppContext';
import GlassCard from '../components/GlassCard';

function calcBill(units, tariff, customRate = 0) {
  if (!tariff || !tariff.slabs) return units * customRate;
  let cost = 0, rem = units, prev = 0;
  for (const [lim, rate] of tariff.slabs) {
    const slab = Math.min(rem, lim - prev);
    if (slab <= 0) break;
    cost += slab * rate;
    rem -= slab;
    prev = lim;
    if (rem <= 0) break;
  }
  return cost;
}

function BillCalculator() {
  const { state, setState } = useApp();
  const [units, setUnits] = useState('');
  const [customRate, setCustomRate] = useState('');

  const tariff = TARIFFS[state];
  const parsedUnits = parseFloat(units) || 0;
  const parsedCustomRate = parseFloat(customRate) || 0;

  const energyCost = parsedUnits > 0 ? Math.round(calcBill(parsedUnits, tariff, parsedCustomRate)) : 0;
  const total = parsedUnits > 0 ? energyCost + (tariff?.fixed || 0) : 0;

  const getSlabBreakdown = () => {
    if (!units || state === 'custom' || !tariff?.slabs) return [];
    let rows = [], rem = parsedUnits, prev = 0;
    for (const [lim, rate] of tariff.slabs) {
      const slab = Math.min(rem, lim - prev);
      if (slab <= 0) break;
      rows.push({
        range: `${prev + 1}–${Math.min(parsedUnits, lim)} units`,
        rate: rate.toFixed(2),
        amount: Math.round(slab * rate),
      });
      rem -= slab;
      prev = lim;
      if (rem <= 0) break;
    }
    return rows;
  };

  return (
    <div className="px-4 py-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-6 animate-in">
        <h1 className="text-2xl font-bold tracking-tight">Bill Calculator 🧾</h1>
        <p className="text-white/40 text-sm mt-1">Calculate your exact electricity bill</p>
      </div>

      <GlassCard className="p-4 mb-4 animate-in delay-1">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Settings</h2>

        <div className="mb-3">
          <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">State / Tariff</label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
          >
            <option value="odisha">Odisha (TPCODL/NESCO)</option>
            <option value="delhi">Delhi (BSES/BYPL)</option>
            <option value="maharashtra">Maharashtra (MSEDCL)</option>
            <option value="karnataka">Karnataka (BESCOM)</option>
            <option value="tamilnadu">Tamil Nadu (TANGEDCO)</option>
            <option value="custom">Custom Rate</option>
          </select>
        </div>

        {state === 'custom' && (
          <div className="mb-3">
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Rate (₹ per unit)</label>
            <input
              value={customRate}
              onChange={e => setCustomRate(e.target.value)}
              type="number"
              placeholder="e.g. 6.50"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
            />
          </div>
        )}

        <div>
          <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Units Consumed (kWh)</label>
          <input
            value={units}
            onChange={e => setUnits(e.target.value)}
            type="number"
            placeholder="e.g. 200"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
          />
        </div>
      </GlassCard>

      {state !== 'custom' && tariff?.slabs && (
        <GlassCard className="p-4 mb-4 animate-in delay-2">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">
            Tariff Slabs — {tariff.name}
          </h2>
          {tariff.slabs.map(([lim, rate], i) => {
            const prev = i === 0 ? 0 : tariff.slabs[i - 1][0];
            return (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <span className="text-white/60">
                  {lim === Infinity ? `Above ${prev} units` : `${prev + 1}–${lim} units`}
                </span>
                <span className="text-blue-400 font-medium">₹{rate.toFixed(2)}/unit</span>
              </div>
            );
          })}
          <div className="flex justify-between text-sm py-2">
            <span className="text-white/60">Fixed Charge</span>
            <span className="text-blue-400 font-medium">₹{tariff.fixed}/month</span>
          </div>
        </GlassCard>
      )}

      {parsedUnits > 0 && (
        <GlassCard className="p-4 mb-4 animate-in delay-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Bill Breakdown</h2>
          {getSlabBreakdown().map((row, i) => (
            <div key={i} className="flex justify-between text-sm py-2 border-b border-white/5">
              <span className="text-white/60">{row.range}</span>
              <span className="text-white/40">₹{row.rate}/unit</span>
              <span className="text-white font-medium">₹{row.amount}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-2 border-b border-white/5">
            <span className="text-white/60">Fixed Charges</span>
            <span></span>
            <span className="text-white font-medium">₹{tariff?.fixed || 0}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="font-bold">Total</span>
            <span></span>
            <span className="font-bold text-blue-400 text-lg">₹{total}</span>
          </div>
        </GlassCard>
      )}

      {parsedUnits > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 text-center animate-in delay-4">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Energy Cost</div>
            <div className="text-xl font-bold text-blue-400">₹{energyCost}</div>
          </GlassCard>
          <GlassCard className="p-4 text-center animate-in delay-5">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Avg per Unit</div>
            <div className="text-xl font-bold text-cyan-400">
              ₹{parsedUnits > 0 ? (total / parsedUnits).toFixed(2) : 0}
            </div>
          </GlassCard>
          <GlassCard className="p-4 text-center animate-in delay-6">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Fixed Charges</div>
            <div className="text-xl font-bold text-yellow-400">₹{tariff?.fixed || 0}</div>
          </GlassCard>
          <GlassCard className="p-4 text-center animate-in delay-7">
            <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Total Bill</div>
            <div className="text-xl font-bold text-red-400">₹{total}</div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default BillCalculator;