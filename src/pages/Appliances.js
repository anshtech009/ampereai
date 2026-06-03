import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESETS, getCatIcon, getConsumptionLevel, calcEnergy } from '../utils/electricity';
import GlassCard from '../components/GlassCard';

function Appliances() {
  const { appliances, addAppliance, removeAppliance } = useApp();
  const [name, setName] = useState('');
  const [wattage, setWattage] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [category, setCategory] = useState('Fan');
  const [usePreset, setUsePreset] = useState(false);

  const handlePreset = (preset) => {
    setName(preset.name);
    setWattage(preset.watt);
    setCategory(preset.cat);
  };

  const handleAdd = () => {
    if (!name || !wattage || !hoursPerDay) return alert('Please fill all fields');
    addAppliance({
      name,
      wattage: parseFloat(wattage),
      hoursPerDay: parseFloat(hoursPerDay),
      category,
    });
    setName(''); setWattage(''); setHoursPerDay(''); setCategory('Fan');
  };

  return (
    <div className="px-4 py-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-6 animate-in">
        <h1 className="text-2xl font-bold tracking-tight">Appliances 🔌</h1>
        <p className="text-white/40 text-sm mt-1">Manage your home appliances</p>
      </div>

      <GlassCard className="p-4 mb-4 animate-in delay-1">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Add Appliance</h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setUsePreset(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!usePreset ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}
          >
            Manual
          </button>
          <button
            onClick={() => setUsePreset(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${usePreset ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}
          >
            From Presets
          </button>
        </div>

        {usePreset && (
          <div className="grid grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => { handlePreset(p); setUsePreset(false); }}
                className="bg-white/5 border border-white/10 rounded-xl p-2 text-left hover:border-blue-500/50 transition-all"
              >
                <div className="text-sm font-medium">{getCatIcon(p.cat)} {p.name}</div>
                <div className="text-xs text-white/40 mt-0.5">{p.watt}W</div>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. AC"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Wattage (W)</label>
            <input
              value={wattage}
              onChange={e => setWattage(e.target.value)}
              type="number"
              placeholder="e.g. 1500"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Hours/day</label>
            <input
              value={hoursPerDay}
              onChange={e => setHoursPerDay(e.target.value)}
              type="number"
              placeholder="e.g. 5"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
            >
              <option value="AC">AC</option>
              <option value="Fan">Fan</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Refrigerator">Refrigerator</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Lighting">Lighting</option>
              <option value="Washing Machine">Washing Machine</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
        >
          + Add Appliance
        </button>
      </GlassCard>

      <GlassCard className="p-4 animate-in delay-2">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
          My Appliances ({appliances.length})
        </h2>
        {appliances.length === 0 && (
          <p className="text-white/30 text-sm text-center py-4">No appliances added yet</p>
        )}
        {appliances.map(a => {
          const monthly = calcEnergy(a, 30);
          const level = getConsumptionLevel(monthly);
          return (
            <div key={a._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <div className="text-sm font-medium">{getCatIcon(a.category)} {a.name}</div>
                <div className="text-xs text-white/40 mt-0.5">
                  {a.wattage}W · {a.hoursPerDay}h/day · {monthly.toFixed(1)} kWh/month
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${level.bg} ${level.color}`}>
                  {level.label}
                </span>
                <button
                  onClick={() => removeAppliance(a._id)}
                  className="text-red-400/60 hover:text-red-400 text-lg transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </GlassCard>
    </div>
  );
}

export default Appliances;