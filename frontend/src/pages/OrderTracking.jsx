import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock, CheckCircle2, ChefHat, Truck, UtensilsCrossed, Package } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderTracking = () => {
  const { orderId } = useParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}/track`);
      setTrackingData(res.data);
      setError(null);
    } catch (err) {
      setError('Siparis bulunamadi');
    } finally {
      setLoading(false);
    }
  };

  const stepIcons = [
    <Package className="w-5 h-5" />,
    <ChefHat className="w-5 h-5" />,
    <UtensilsCrossed className="w-5 h-5" />,
    <Truck className="w-5 h-5" />,
    <CheckCircle2 className="w-5 h-5" />
  ];

  const stepLabels = ['Siparis Alindi', 'Hazirlaniyor', 'Hazir', 'Masaya Goturuluyor', 'Tamamlandi'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-white animate-pulse">Yukleniyor...</div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{error || 'Siparis bulunamadi'}</p>
        </div>
      </div>
    );
  }

  const { order, restaurant_name, current_step, estimated_minutes } = trackingData;
  const progressPercent = Math.min(((current_step + 1) / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-500/10 to-transparent">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed className="w-6 h-6 text-orange-400" />
          </div>
          <h1 className="text-lg font-bold mb-1" data-testid="tracking-title">{restaurant_name}</h1>
          <p className="text-sm text-gray-400">Siparis #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Status Message */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 mb-6 text-center">
          <p className="text-2xl font-bold mb-1" data-testid="tracking-status">{stepLabels[current_step]}</p>
          {current_step < 4 && (
            <div className="flex items-center justify-center gap-1 text-sm text-gray-400 mt-2">
              <Clock className="w-4 h-4 text-orange-400" />
              Tahmini sure: ~{estimated_minutes} dakika
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-white/5 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
              data-testid="tracking-progress"
            />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {stepLabels.map((label, i) => {
              const isCompleted = i <= current_step;
              const isCurrent = i === current_step;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isCurrent ? 'bg-orange-500/10 border border-orange-500/20' :
                    isCompleted ? 'bg-white/[0.02]' : 'opacity-40'
                  }`}
                  data-testid={`tracking-step-${i}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-600'
                  }`}>
                    {stepIcons[i]}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-white' : 'text-gray-600'}`}>{label}</p>
                    {isCurrent && current_step < 4 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        <span className="text-xs text-orange-400">Devam ediyor</span>
                      </div>
                    )}
                  </div>
                  {isCompleted && (
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isCurrent ? 'text-orange-400' : 'text-green-500/50'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm text-gray-400">Siparis Detayi</h3>
          <div className="space-y-2 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.quantity}x {item.name}</span>
                <span className="text-gray-400">{(item.price * item.quantity).toFixed(2)} TL</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between">
            <span className="font-semibold">Toplam</span>
            <span className="font-bold text-orange-400">{order.total_amount.toFixed(2)} TL</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-gray-500">
            <span>Masa {order.table_number}</span>
            <span>{new Date(order.created_at).toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
