import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Appliances from './pages/Appliances';
import BillCalculator from './pages/BillCalculator';
import Predict from './pages/Predict';
import Reminders from './pages/Reminders';
import History from './pages/History';
import AIAssistant from './pages/AIAssistant';
import TariffSimulator from './pages/TariffSimulator';
import Login from './pages/Login';
import { AppProvider } from './context/AppContext';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AppProvider>
      <div className="bg-aurora" />
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/appliances" element={
            <ProtectedRoute>
              <Navbar />
              <Appliances />
            </ProtectedRoute>
          } />
          <Route path="/bill" element={
            <ProtectedRoute>
              <Navbar />
              <BillCalculator />
            </ProtectedRoute>
          } />
          <Route path="/predict" element={
            <ProtectedRoute>
              <Navbar />
              <Predict />
            </ProtectedRoute>
          } />
          <Route path="/reminders" element={
            <ProtectedRoute>
              <Navbar />
              <Reminders />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <Navbar />
              <History />
            </ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute>
              <Navbar />
              <AIAssistant />
            </ProtectedRoute>
          } />
          <Route path="/tariff" element={
            <ProtectedRoute>
              <Navbar />
              <TariffSimulator />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;