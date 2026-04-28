import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { LogOut, ChefHat, Clock, Volume2, VolumeX } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KitchenDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownPendingIdsRef = useRef(new Set());

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(820, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(1080, audioContext.currentTime + 0.12);
      oscillator.frequency.linearRampToValueAtTime(820, audioContext.currentTime + 0.24);
      oscillator.frequency.linearRampToValueAtTime(1240, audioContext.currentTime + 0.36);

      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.28, audioContext.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.log('Audio error', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/kitchen/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedOrders = response.data || [];
      const pendingOrders = fetchedOrders.filter(o => o.status === 'pending');
      const pendingIds = new Set(pendingOrders.map(o => o.id));

      const newPendingOrders = pendingOrders.filter(o => !knownPendingIdsRef.current.has(o.id));
      if (newPendingOrders.length > 0) {
        const latestOrder = newPendingOrders[0];
        setNewOrderAlert(latestOrder);
        playNotificationSound();
        toast.success(`Yeni sipariş! Masa ${latestOrder.table_number}`, {
          duration: 5000
        });
      }

      knownPendingIdsRef.current = pendingIds;
      setOrders(fetchedOrders);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setNewOrderAlert(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/kitchen/orders/${orderId}/status`,
        { status: 'preparing' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (error) {
      console.error(error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/kitchen/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Sipariş durumu güncellendi');
      fetchOrders();
    } catch (error) {
      toast.error('Durum güncellenemedi');
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now - created) / 60000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-800 text-white">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mutfak Paneli</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`text-gray-300 hover:text-white ${soundEnabled ? '' : 'text-red-400'}`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2 border-slate-600 text-white hover:bg-slate-700">
              <LogOut className="w-4 h-4" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Aktif Siparişler</h2>
          <div className="bg-orange-500/20 border border-orange-500 text-orange-300 px-4 py-2 rounded-full font-medium">
            {orders.length} Sipariş
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const elapsed = getElapsedTime(order.created_at);
            const isUrgent = elapsed > 10;

            return (
              <Card
                key={order.id}
                className={`shadow-lg border-l-4 ${
                  order.status === 'pending'
                    ? isUrgent ? 'border-l-red-500 bg-red-50 dark:bg-red-950' : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                    : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950'
                } dark:border-slate-700`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                      Masa {order.table_number}
                    </CardTitle>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {elapsed} dk
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(order.created_at).toLocaleTimeString('tr-TR')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg">
                        <div>
                          <p className="font-semibold text-lg text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Adet: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2">
                    {order.status === 'pending' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 text-base"
                      >
                        Hazırlamaya Başla
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-base"
                      >
                        Hazır
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-400">Bekleyen sipariş yok</p>
          </div>
        )}
      </main>

      {newOrderAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-pulse">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-12 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 animate-bounce">
            <div className="text-center space-y-6">
              <div className="text-8xl animate-ping">🔔</div>
              <h2 className="text-5xl font-bold text-white">YENİ SİPARİŞ!</h2>
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                <p className="text-4xl font-bold text-white mb-4">MASA {newOrderAlert.table_number}</p>
                <div className="space-y-2 text-white text-xl">
                  {newOrderAlert.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} ₺</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t-2 border-white/50">
                  <p className="text-3xl font-bold text-white">Toplam: {newOrderAlert.total_amount.toFixed(2)} ₺</p>
                </div>
              </div>
              <Button
                onClick={() => handleAcceptOrder(newOrderAlert.id)}
                className="w-full h-20 text-3xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg"
              >
                ✓ KABUL ET VE HAZIRLA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
