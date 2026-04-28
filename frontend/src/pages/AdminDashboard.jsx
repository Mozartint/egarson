import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { LogOut, Plus, Trash2, Store, TrendingUp, ShoppingBag, Users, DollarSign, Calendar, BarChart3, Star } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [packageRequests, setPackageRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffDialog, setStaffDialog] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    owner_email: '',
    owner_password: '',
    owner_full_name: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'overview') {
        const [statsRes, analyticsRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/admin/analytics`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      }
      
      const restaurantsRes = await axios.get(`${API}/admin/restaurants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurants(restaurantsRes.data);
      
      if (activeTab === 'orders') {
        const ordersRes = await axios.get(`${API}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(ordersRes.data);
      }
      
      if (activeTab === 'reviews') {
        const reviewsRes = await axios.get(`${API}/admin/reviews`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(reviewsRes.data);
      }

      if (activeTab === 'requests') {
        const reqRes = await axios.get(`${API}/admin/package-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPackageRequests(reqRes.data);
      }
    } catch (error) {
      toast.error('Veri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/restaurants`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Restoran başarıyla oluşturuldu');
      setDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        owner_email: '',
        owner_password: '',
        owner_full_name: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Restoran oluşturulamadı');
      console.error(error);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Bu restoranı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Restoran silindi');
      fetchData();
    } catch (error) {
      toast.error('Restoran silinemedi');
      console.error(error);
    }
  };

  const handleViewStaff = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/restaurants/${restaurant.id}/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
      setStaffDialog(true);
    } catch (error) {
      toast.error('Personel bilgileri yüklenemedi');
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
      preparing: { label: 'Hazırlanıyor', color: 'bg-blue-100 text-blue-800' },
      ready: { label: 'Hazır', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800' }
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      owner: { label: 'Restoran Sahibi', color: 'bg-purple-100 text-purple-800' },
      kitchen: { label: 'Mutfak', color: 'bg-blue-100 text-blue-800' },
      cashier: { label: 'Kasa', color: 'bg-green-100 text-green-800' }
    };
    const r = roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${r.color}`}>{r.label}</span>;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="admin-dashboard-title">Süper Admin Paneli</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2" data-testid="logout-button">
            <LogOut className="w-4 h-4" />
            Çıkış
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2" data-testid="overview-tab">
              <TrendingUp className="w-4 h-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-2" data-testid="restaurants-tab">
              <Store className="w-4 h-4" />
              Restoranlar
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2" data-testid="orders-tab">
              <ShoppingBag className="w-4 h-4" />
              Tüm Siparişler
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2" data-testid="reviews-tab">
              <Star className="w-4 h-4" />
              Degerlendirmeler
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2" data-testid="requests-tab">
              <Users className="w-4 h-4" />
              Talepler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {stats && analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Toplam Restoran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.total_restaurants}</div>
                        <Store className="w-8 h-8 text-orange-500" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">{stats.active_restaurants} aktif</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Toplam Sipariş</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.total_orders}</div>
                        <ShoppingBag className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">{stats.today_orders} bugün</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Toplam Gelir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.total_revenue.toFixed(0)} ₺</div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Tüm zamanlar</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Aktif Abonelik</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.active_restaurants}</div>
                        <Calendar className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Aylık abonelik</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                        Son 7 Gün Sipariş Trendi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.daily_orders}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} name="Sipariş" />
                          <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Gelir (₺)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-orange-500" />
                        En Popüler Restoranlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.restaurant_stats.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="orders" fill="#f97316" name="Sipariş" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Restoran Performansı</CardTitle>
                    <CardDescription>Toplam sipariş ve gelire göre sıralanmış</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.restaurant_stats.slice(0, 10).map((restaurant, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{restaurant.name}</p>
                              <p className="text-sm text-gray-500">{restaurant.orders} sipariş</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{restaurant.revenue.toFixed(2)} ₺</p>
                            <p className="text-xs text-gray-500">Toplam gelir</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="restaurants">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Tüm Restoranlar</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 rounded-full gap-2" data-testid="create-restaurant-button">
                    <Plus className="w-4 h-4" />
                    Yeni Restoran
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Yeni Restoran Ekle</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateRestaurant} className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="name">Restoran Adı</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="restaurant-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Adres</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_full_name">Sahip Adı Soyadı</Label>
                      <Input
                        id="owner_full_name"
                        value={formData.owner_full_name}
                        onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_email">Sahip Email</Label>
                      <Input
                        id="owner_email"
                        type="email"
                        value={formData.owner_email}
                        onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_password">Sahip Şifresi</Label>
                      <Input
                        id="owner_password"
                        type="password"
                        value={formData.owner_password}
                        onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" data-testid="submit-restaurant-button">
                      Oluştur
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="shadow-sm hover:shadow-md transition-shadow" data-testid="restaurant-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        data-testid="delete-restaurant-button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600"><span className="font-medium">Adres:</span> {restaurant.address}</p>
                      <p className="text-gray-600"><span className="font-medium">Telefon:</span> {restaurant.phone}</p>
                      <p className="text-gray-600">
                        <span className="font-medium">Abonelik Bitiş:</span> {new Date(restaurant.subscription_end_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="pt-3 border-t flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        restaurant.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.subscription_status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStaff(restaurant)}
                        className="gap-1"
                      >
                        <Users className="w-3 h-3" />
                        Personel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tüm Siparişler</h2>
              
              {orders.map((order) => {
                const restaurant = restaurants.find(r => r.id === order.restaurant_id);
                return (
                  <Card key={order.id} className="shadow-sm" data-testid="order-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {restaurant?.name || 'Bilinmeyen Restoran'} - Masa {order.table_number}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-sm text-gray-500 mt-1">
                            {order.payment_method === 'cash' ? 'Kasada Ödeme' : 'Online Ödeme'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{(item.price * item.quantity).toFixed(2)} ₺</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t flex justify-between font-semibold">
                          <span>Toplam</span>
                          <span className="text-orange-600">{order.total_amount.toFixed(2)} ₺</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz sipariş yok</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Müşteri Değerlendirmeleri</h2>
              
              {reviews.map((review) => {
                const restaurant = restaurants.find(r => r.id === review.restaurant_id);
                return (
                  <Card key={review.id} className="shadow-sm" data-testid="review-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {restaurant?.name || 'Bilinmeyen Restoran'}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(review.created_at).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-sm font-semibold">{review.rating}/5</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {review.comment && (
                        <p className="text-gray-700 italic">"{review.comment}"</p>
                      )}
                      {review.order_id && (
                        <p className="text-xs text-gray-500 mt-2">Sipariş No: {review.order_id.slice(0, 8).toUpperCase()}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {reviews.length === 0 && (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz değerlendirme yok</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Paket Talepleri</h2>
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Isletme</th>
                        <th className="text-left px-4 py-3 font-medium">Yetkili</th>
                        <th className="text-left px-4 py-3 font-medium">Telefon</th>
                        <th className="text-left px-4 py-3 font-medium">E-posta</th>
                        <th className="text-left px-4 py-3 font-medium">Sehir</th>
                        <th className="text-left px-4 py-3 font-medium">Paket</th>
                        <th className="text-left px-4 py-3 font-medium">Durum</th>
                        <th className="text-left px-4 py-3 font-medium">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packageRequests.map((req) => (
                        <tr key={req.id} className="border-t hover:bg-gray-50" data-testid="package-request-row">
                          <td className="px-4 py-3 font-medium">{req.business_name}</td>
                          <td className="px-4 py-3">{req.contact_name}</td>
                          <td className="px-4 py-3">{req.phone}</td>
                          <td className="px-4 py-3">{req.email}</td>
                          <td className="px-4 py-3">{req.city}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                              req.package_type === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                              req.package_type === 'silver' ? 'bg-gray-100 text-gray-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>{req.package_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              req.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>{req.status === 'pending' ? 'Bekliyor' : req.status === 'approved' ? 'Onaylandi' : 'Reddedildi'}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(req.created_at).toLocaleString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {packageRequests.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henuz talep yok</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={staffDialog} onOpenChange={setStaffDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRestaurant?.name} - Personel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                {getRoleBadge(member.role)}
              </div>
            ))}
            {staff.length === 0 && (
              <p className="text-center text-gray-500 py-8">Personel bulunamadı</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;