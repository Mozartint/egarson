import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { LogOut, Wallet, CheckCircle2, Printer, CreditCard, Banknote, Clock, FileText } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [pendingRes, allRes, infoRes] = await Promise.all([
        axios.get(`${API}/cashier/orders`, { headers }),
        axios.get(`${API}/cashier/all-orders`, { headers }),
        axios.get(`${API}/cashier/restaurant-info`, { headers })
      ]);
      setPendingOrders(pendingRes.data);
      setAllOrders(allRes.data);
      setRestaurantInfo(infoRes.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handlePayment = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/cashier/orders/${orderId}/payment`,
        { payment_status: 'paid' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Odeme onaylandi');
      fetchData();
    } catch (error) {
      toast.error('Odeme onaylanamadi');
    }
  };

  const handlePrintReceipt = (order) => {
    setReceiptOrder(order);
    setReceiptDialog(true);
  };

  const printReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fis</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            .small { font-size: 10px; }
            h2 { margin: 4px 0; font-size: 16px; }
            p { margin: 2px 0; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
        <script>window.onload=function(){window.print();window.close();}</script>
      </html>
    `);
    printWindow.document.close();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPaymentBadge = (method) => {
    if (method === 'card') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CreditCard className="w-3 h-3" />Kart</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Banknote className="w-3 h-3" />Nakit</span>;
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-800' },
      preparing: { label: 'Hazirlaniyor', cls: 'bg-blue-100 text-blue-800' },
      ready: { label: 'Hazir', cls: 'bg-green-100 text-green-800' },
      completed: { label: 'Tamamlandi', cls: 'bg-gray-100 text-gray-800' }
    };
    const s = map[status] || map.pending;
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Yukleniyor...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="cashier-dashboard-title">Kasa Paneli</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2" data-testid="logout-button">
            <LogOut className="w-4 h-4" /> Cikis
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Bekleyen ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              Gecmis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow" data-testid="cashier-order-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">Masa {order.table_number}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleString('tr-TR')}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order.payment_method)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">{(item.price * item.quantity).toFixed(2)} TL</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-3 border-t-2 border-orange-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base font-semibold">Toplam</span>
                        <span className="text-xl font-bold text-orange-600">{order.total_amount.toFixed(2)} TL</span>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handlePayment(order.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-10 gap-1"
                          data-testid="confirm-payment-button">
                          <CheckCircle2 className="w-4 h-4" /> Onayla
                        </Button>
                        <Button onClick={() => handlePrintReceipt(order)}
                          variant="outline" className="h-10 gap-1" data-testid="print-receipt-btn">
                          <Printer className="w-4 h-4" /> Fis
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {pendingOrders.length === 0 && (
              <div className="text-center py-16">
                <Wallet className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Odeme bekleyen siparis yok</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Masa</th>
                      <th className="text-left px-4 py-3 font-medium">Tutar</th>
                      <th className="text-left px-4 py-3 font-medium">Odeme</th>
                      <th className="text-left px-4 py-3 font-medium">Durum</th>
                      <th className="text-left px-4 py-3 font-medium">Tarih</th>
                      <th className="text-left px-4 py-3 font-medium">Islem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-gray-50" data-testid="history-order-row">
                        <td className="px-4 py-3 font-medium">Masa {order.table_number}</td>
                        <td className="px-4 py-3 font-semibold text-orange-600">{order.total_amount.toFixed(2)} TL</td>
                        <td className="px-4 py-3">{getPaymentBadge(order.payment_method)}</td>
                        <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.created_at).toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => handlePrintReceipt(order)} data-testid="history-print-btn">
                            <Printer className="w-3.5 h-3.5" /> Fis
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* RECEIPT DIALOG */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Fis Onizleme
            </DialogTitle>
          </DialogHeader>
          {receiptOrder && (
            <>
              <div id="receipt-content" className="bg-white p-4 text-black font-mono text-xs">
                <div className="center">
                  <p className="bold" style={{ fontSize: '14px' }}>{restaurantInfo?.name || 'Restoran'}</p>
                  <p>{restaurantInfo?.address || ''}</p>
                  <p>Tel: {restaurantInfo?.phone || ''}</p>
                  <div className="line"></div>
                  <p className="bold">SATIS FISI</p>
                  <div className="line"></div>
                </div>
                <div className="row"><span>Masa:</span><span>{receiptOrder.table_number}</span></div>
                <div className="row"><span>Tarih:</span><span>{new Date(receiptOrder.created_at).toLocaleString('tr-TR')}</span></div>
                <div className="row"><span>Fis No:</span><span>#{receiptOrder.id.slice(0, 8).toUpperCase()}</span></div>
                <div className="line"></div>
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx} className="row">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="line"></div>
                <div className="row bold" style={{ fontSize: '14px' }}>
                  <span>TOPLAM</span><span>{receiptOrder.total_amount.toFixed(2)} TL</span>
                </div>
                <div className="row"><span>Odeme:</span><span>{receiptOrder.payment_method === 'card' ? 'Kredi Karti' : 'Nakit'}</span></div>
                <div className="line"></div>
                <div className="center">
                  <p>Bizi tercih ettiginiz icin</p>
                  <p className="bold">TESEKKUR EDERIZ</p>
                  <p className="small" style={{ marginTop: '8px' }}>E Garson ile guclendirilmistir</p>
                </div>
              </div>
              <Button onClick={printReceipt} className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="print-btn">
                <Printer className="w-4 h-4" /> Yazdir
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierDashboard;
