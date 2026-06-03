import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Please fill all fields');
    if (!isLogin && !name) return setError('Please enter your name');

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-5 relative">
      {/* Aurora background for the login screen */}
      <div className="bg-aurora" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 animate-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold">AmperAI</h1>
          <p className="text-white/40 text-sm mt-1">Smart Energy Manager</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-6 backdrop-blur-xl animate-in delay-1">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${isLogin ? 'bg-blue-500 text-white' : 'text-white/40'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!isLogin ? 'bg-blue-500 text-white' : 'text-white/40'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <GlassCard className="p-5 space-y-4 animate-in delay-2">
          {!isLogin && (
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Anshuman"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              type="email"
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest block mb-1">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </GlassCard>

        <p className="text-white/30 text-xs text-center mt-4 animate-in delay-3">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-400 underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
