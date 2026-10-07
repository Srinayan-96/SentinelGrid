import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import client from '../api/client';
import { Shield, MapPin, User, Info } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CITIZEN' | 'COMMAND' | 'RESPONDER'>('CITIZEN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAppStore(state => state.setAuth);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    state: 'Maharashtra',
    phone: '',
    email: '',
    password: '',
    force_id: ''
  });

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Ladakh", "Jammu and Kashmir"
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (activeTab === 'CITIZEN') {
        response = await client.post('/auth/citizen-login', {
          name: formData.name,
          state: formData.state,
          phone: formData.phone
        });
      } else {
        response = await client.post('/auth/login', {
          email: activeTab === 'COMMAND' ? formData.email : formData.force_id,
          password: formData.password
        });
      }

      const { user, token } = response.data;
      setAuth(user, token);

      // Redirect based on role
      if (user.role === 'CITIZEN') navigate('/citizen/sos');
      else if (user.role === 'ADMIN') navigate('/command/dashboard');
      else navigate('/responder/mission');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-cyan-400 flex items-center justify-center gap-2">
          <Shield className="w-10 h-10" /> SENTINEL GRID
        </h1>
        <p className="text-slate-400 text-sm mt-2 uppercase tracking-[0.2em]">Real-time Disaster Coordination Network</p>
      </div>

      <div className="w-full max-w-md bg-[#161C2C] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Portal Tabs */}
        <div className="flex bg-[#1F2937]/50 border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('CITIZEN')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${activeTab === 'CITIZEN' ? 'text-cyan-400 bg-[#161C2C]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <User className="w-4 h-4" /> Citizen
          </button>
          <button 
            onClick={() => setActiveTab('COMMAND')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${activeTab === 'COMMAND' ? 'text-cyan-400 bg-[#161C2C]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Shield className="w-4 h-4" /> Command
          </button>
          <button 
            onClick={() => setActiveTab('RESPONDER')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${activeTab === 'RESPONDER' ? 'text-cyan-400 bg-[#161C2C]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MapPin className="w-4 h-4" /> Responder
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-4">
          {activeTab === 'CITIZEN' && (
            <>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Full Name</label>
                <input 
                  type="text" required placeholder="Enter your name"
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Current State</label>
                <select 
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                >
                  {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Phone Number</label>
                <input 
                  type="tel" required placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </>
          )}

          {activeTab === 'COMMAND' && (
            <>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Username / Email</label>
                <input 
                  type="text" required placeholder="command@rescue.in"
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Password</label>
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1"><Info className="w-3 h-3" /> Demo: command@rescue.in / RESCUE2024</p>
            </>
          )}

          {activeTab === 'RESPONDER' && (
            <>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Force Email</label>
                <input 
                  type="text" required placeholder="ndrf1@rescue.in"
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.force_id} onChange={e => setFormData({...formData, force_id: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Access Code</label>
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1"><Info className="w-3 h-3" /> Demo: ndrf1@rescue.in / RESCUE2024</p>
            </>
          )}

          {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-xs text-center">{error}</div>}

          <button 
            type="submit" disabled={loading}
            className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:scale-95 shadow-[0_0_20px_rgba(8,145,178,0.3)]'}`}
          >
            {loading ? 'Authenticating...' : `Enter as ${activeTab}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
