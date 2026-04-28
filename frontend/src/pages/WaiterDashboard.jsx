import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { LogOut, Bell, Droplets, Receipt, CheckCircle2, Clock, Volume2, VolumeX, UserCheck, Coffee, Smartphone } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [activeCalls, setActiveCalls] = useState([]);
  const [completedCalls, setCompletedCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const lastCallIdsRef = useRef(new Set());

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio error');
    }
  };

  const vibrateDevice = () => {
    if (!vibrationEnabled) return;
    if (navigator.vibrate) {
      navigator.vibrate([250, 120, 250, 120, 350]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchCalls();
    const interval = setInterval(fetchCalls, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchCalls = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/waiter/calls`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const active = res.data.active || [];
      const completed = res.data.completed || [];
      const currentIds = new Set(active.map(call => call.id));
      const newCalls = active.filter(call => !lastCallIdsRef.current.has(call.id));

      if (newCalls.length > 0 && isActive) {
        playNotificationSound();
        vibrateDevice();
        toast.success('Yeni çağrı var!', { duration: 4000 });
      }

      lastCallIdsRef.current = currentIds;
      setActiveCalls(active);
      setCompletedCalls(completed);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (callId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/waiter/calls/${callId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(status === 'accepted' ? 'Çağrı kabul edildi' : 'Çağrı tamamlandı');
      fetchCalls();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getCallTypeIcon = (type) => {
    switch (type) {
      case 'bill': return <Receipt className="w-5 h-5" />;
      case 'water': return <Droplets className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getCallTypeLabel = (type) => {
    switch (type) {
      case 'bill': return 'Hesap İsteği';
      case 'water': return 'Su İsteği';
      default: return 'Garson Çağrı';
    }
  };

  const getCallTypeColor = (type) => {
    switch (type) {
      case 'bill': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'water': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0f1419] flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <header className="bg-[#1a1f2e] border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Garson Paneli</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} className={`text-gray-400 hover:text-white ${soundEnabled ? '' : 'text-red-400'}`}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setVibrationEnabled(!vibrationEnabled)} className={`text-gray-400 hover:text-white ${vibrationEnabled ? '' : 'text-red-400'}`}>
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setIsActive(!isActive)}
              className={`rounded-full text-xs font-semibold px-4 ${isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'}`}
            >
              {isActive ? 'Aktif' : 'Pasif'}
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-1">
              <LogOut className="w-4 h-4" /> Çıkış
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Aktif Çağrılar</h2>
            <div className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full text-sm font-medium">
              {activeCalls.length} Çağrı
            </div>
          </div>

          {!isActive && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-center">
              <p className="text-red-300 text-sm">Pasif moddasınız. Çağrı almak için aktif olun.</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCalls.map((call) => (
              <Card key={call.id} className="bg-[#1a1f2e] border-white/5 text-white animate-in fade-in-0 slide-in-from-bottom-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg border ${getCallTypeColor(call.call_type)}`}>
                        {getCallTypeIcon(call.call_type)}
                      </div>
                      <div>
                        <p className="font-bold text-lg">Masa {call.table_number}</p>
                        <p className="text-xs text-gray-500">{getCallTypeLabel(call.call_type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(call.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {call.status === 'pending' && (
                      <Button size="sm" className="flex-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 rounded-lg text-xs" onClick={() => handleUpdateStatus(call.id, 'accepted')}>
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Gidildi
                      </Button>
                    )}
                    <Button size="sm" className="flex-1 bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 rounded-lg text-xs" onClick={() => handleUpdateStatus(call.id, 'completed')}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Tamamlandı
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {activeCalls.length === 0 && isActive && (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Aktif çağrı yok</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-400">Tamamlanan Çağrılar</h2>
          <div className="space-y-2">
            {completedCalls.slice(0, 10).map((call) => (
              <div key={call.id} className="bg-[#1a1f2e]/50 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-gray-600">{getCallTypeIcon(call.call_type)}</div>
                  <div>
                    <span className="text-sm font-medium text-gray-400">Masa {call.table_number}</span>
                    <span className="text-xs text-gray-600 ml-2">{getCallTypeLabel(call.call_type)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50" />
                  {new Date(call.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
          {completedCalls.length === 0 && (
            <p className="text-center text-gray-600 py-6 text-sm">Henüz tamamlanan çağrı yok</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default WaiterDashboard;
