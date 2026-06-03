import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../config';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

const API = `${API_BASE}/api`;

export const AppProvider = ({ children }) => {
  const [appliances, setAppliances] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [state, setState] = useState('odisha');
  const [loading, setLoading] = useState(true);

  // Fetch appliances from backend
  const fetchAppliances = async () => {
    try {
      const res = await fetch(`${API}/appliances`);
      const data = await res.json();
      if (data.length === 0) {
        // Seed default appliances if empty
        const defaults = [
          { name: 'Ceiling Fan', wattage: 75, hoursPerDay: 8, category: 'Fan' },
          { name: 'LED TV', wattage: 120, hoursPerDay: 5, category: 'Entertainment' },
          { name: 'Refrigerator', wattage: 60, hoursPerDay: 24, category: 'Refrigerator' },
          { name: 'LED Lights', wattage: 40, hoursPerDay: 7, category: 'Lighting' },
          { name: 'Washing Machine', wattage: 800, hoursPerDay: 1, category: 'Washing Machine' },
        ];
        for (const a of defaults) {
          await fetch(`${API}/appliances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(a),
          });
        }
        const seeded = await fetch(`${API}/appliances`);
        const seededData = await seeded.json();
        setAppliances(seededData);
      } else {
        setAppliances(data);
      }
    } catch (err) {
      console.error('Error fetching appliances:', err);
    }
  };

  // Fetch bill history from backend
  const fetchBillHistory = async () => {
    try {
      const res = await fetch(`${API}/billhistory`);
      const data = await res.json();
      setBillHistory(data);
    } catch (err) {
      console.error('Error fetching bill history:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAppliances();
      await fetchBillHistory();
      setLoading(false);
    };
    loadData();
  }, []);

  // Add appliance to backend
  const addAppliance = async (appliance) => {
    try {
      const res = await fetch(`${API}/appliances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appliance),
      });
      const data = await res.json();
      setAppliances(prev => [...prev, data]);
    } catch (err) {
      console.error('Error adding appliance:', err);
    }
  };

  // Remove appliance from backend
  const removeAppliance = async (id) => {
    try {
      await fetch(`${API}/appliances/${id}`, { method: 'DELETE' });
      setAppliances(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      console.error('Error removing appliance:', err);
    }
  };

  // Add bill history to backend
  const addBillHistory = async (entry) => {
    try {
      const res = await fetch(`${API}/billhistory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      setBillHistory(prev => [...prev, data]);
    } catch (err) {
      console.error('Error adding bill history:', err);
    }
  };

  const getDailyKwh = () =>
    appliances.reduce((s, a) => s + (a.wattage * a.hoursPerDay) / 1000, 0);

  const getMonthlyKwh = () => getDailyKwh() * 30;

  if (loading) {
    return (
      <div style={{
        background: '#000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px'
      }}>
        ⚡ Loading AmperAI...
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      appliances, addAppliance, removeAppliance,
      billHistory, addBillHistory,
      state, setState,
      getDailyKwh, getMonthlyKwh,
    }}>
      {children}
    </AppContext.Provider>
  );
};