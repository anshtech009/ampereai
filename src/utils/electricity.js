export const TARIFFS = {
  odisha:      { name: 'Odisha', slabs: [[100,3.45],[200,5.15],[300,6.05],[400,6.55],[Infinity,7.10]], fixed: 40 },
  delhi:       { name: 'Delhi', slabs: [[200,3.00],[400,4.50],[800,6.50],[Infinity,7.50]], fixed: 125 },
  maharashtra: { name: 'Maharashtra', slabs: [[100,2.37],[300,5.56],[500,6.33],[Infinity,8.07]], fixed: 80 },
  karnataka:   { name: 'Karnataka', slabs: [[30,0],[100,3.15],[200,5.00],[500,6.00],[Infinity,6.60]], fixed: 55 },
  tamilnadu:   { name: 'Tamil Nadu', slabs: [[100,0],[250,2.25],[500,3.50],[Infinity,4.60]], fixed: 30 },
  custom:      { name: 'Custom', slabs: null, fixed: 0 },
};

export const PRESETS = [
  { name: '1.5 Ton AC', watt: 1500, cat: 'AC' },
  { name: '1 Ton AC', watt: 1000, cat: 'AC' },
  { name: 'Ceiling Fan', watt: 75, cat: 'Fan' },
  { name: 'Air Cooler', watt: 200, cat: 'Fan' },
  { name: 'LED TV 43"', watt: 120, cat: 'Entertainment' },
  { name: 'LED TV 55"', watt: 150, cat: 'Entertainment' },
  { name: 'Refrigerator', watt: 60, cat: 'Refrigerator' },
  { name: 'Geyser', watt: 2000, cat: 'Kitchen' },
  { name: 'Microwave', watt: 1200, cat: 'Kitchen' },
  { name: 'Chimney', watt: 250, cat: 'Kitchen' },
  { name: 'Mixer Grinder', watt: 750, cat: 'Kitchen' },
  { name: 'Air Fryer', watt: 1500, cat: 'Kitchen' },
  { name: 'Electric Iron', watt: 1000, cat: 'Other' },
  { name: 'Washing Machine', watt: 800, cat: 'Washing Machine' },
  { name: 'LED Bulb', watt: 10, cat: 'Lighting' },
  { name: 'Tube Light', watt: 40, cat: 'Lighting' },
  { name: 'Water Pump', watt: 750, cat: 'Other' },
  { name: 'Laptop', watt: 65, cat: 'Other' },
  { name: 'Desktop PC', watt: 300, cat: 'Other' },
  { name: 'WiFi Router', watt: 10, cat: 'Other' },
];

// Called as: calcEnergy(appliance, days)
// appliance = { wattage, hoursPerDay }
export const calcEnergy = (appliance, days = 30) => {
  return (appliance.wattage * appliance.hoursPerDay * days) / 1000;
};

// Called as: getMonthlyBill(units, tariff)
// tariff = TARIFFS[state] object
export const getMonthlyBill = (units, tariff) => {
  if (!tariff || !tariff.slabs) return units * 0 + 0;
  let cost = 0, rem = units, prev = 0;
  for (const [lim, rate] of tariff.slabs) {
    const slab = Math.min(rem, lim - prev);
    if (slab <= 0) break;
    cost += slab * rate;
    rem -= slab;
    prev = lim;
    if (rem <= 0) break;
  }
  return cost + tariff.fixed;
};

export const getCatIcon = (cat) => {
  const icons = {
    AC: '❄️',
    Fan: '🌀',
    Entertainment: '📺',
    Refrigerator: '🧊',
    Kitchen: '🍳',
    Lighting: '💡',
    'Washing Machine': '🫧',
    Other: '🔌',
  };
  return icons[cat] || '🔌';
};

export const getConsumptionLevel = (monthlyKwh) => {
  if (monthlyKwh > 50) return { label: 'High', color: 'text-red-400', bg: 'bg-red-400/10' };
  if (monthlyKwh > 20) return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  return { label: 'Low', color: 'text-green-400', bg: 'bg-green-400/10' };
};