import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { LogOut, Plus, Trash2, QrCode, UtensilsCrossed, Table as TableIcon, ShoppingBag, Download, TrendingUp, DollarSign, Clock, Award, Palette, Upload, Pencil } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_CUSTOMIZATION = {
  logo_url: '',
  cover_image_url: '',
  theme_color: '#004d40',
  accent_color: '#e53935',
  font_style: 'Inter'
};

const fontPreviewMap = {
  Inter: "'Inter', sans-serif",
  Poppins: "'Poppins', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Arial: "Arial, sans-serif",
  Georgia: "Georgia, serif"
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [tableDialog, setTableDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  
  const [categoryForm, setCategoryForm] = useState({ name: '', order: 0 });
  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    available: true
  });
  const [tableForm, setTableForm] = useState({ table_number: '' });
  const [customizationForm, setCustomizationForm] = useState(DEFAULT_CUSTOMIZATION);
  const [customizationLoading, setCustomizationLoading] = useState(false);
  const [savingCustomization, setSavingCustomization] = useState(false);

  const resetItemForm = () => {
    setItemForm({
      category_id: '',
      name: '',
      description: '',
      price: '',
      image_url: '',
      available: true
    });
    setEditingItemId(null);
    setIsEditingItem(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [activeTab]);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'overview') {
        const statsRes = await axios.get(`${API}/owner/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsRes.data);
      }
      
      if (activeTab === 'menu') {
        const [categoriesRes, itemsRes] = await Promise.all([
          axios.get(`${API}/owner/menu/categories`, { headers: authHeaders() }),
          axios.get(`${API}/owner/menu/items`, { headers: authHeaders() })
        ]);
        setCategories(categoriesRes.data);
        setMenuItems(itemsRes.data);
      } else if (activeTab === 'tables') {
        const res = await axios.get(`${API}/owner/tables`, { headers: authHeaders() });
        setTables(res.data);
      } else if (activeTab === 'orders') {
        const res = await axios.get(`${API}/owner/orders`, { headers: authHeaders() });
        setOrders(res.data);
      } else if (activeTab === 'customization') {
        await fetchCustomization();
      }
    } catch (error) {
      toast.error('Veri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64Item = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleItemImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen görsel dosyası seç');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ürün görseli en fazla 5 MB olabilir');
      return;
    }

    try {
      const base64 = await fileToBase64Item(file);
      setItemForm((prev) => ({ ...prev, image_url: base64 }));
      toast.success('Ürün görseli hazırlandı');
    } catch (error) {
      toast.error('Ürün görseli okunamadı');
      console.error(error);
    }
  };

  const clearItemImage = () => {
    setItemForm((prev) => ({ ...prev, image_url: '' }));
    toast.success('Ürün görseli kaldırıldı');
  };

  const fetchCustomization = async () => {
    try {
      setCustomizationLoading(true);
      const res = await axios.get(`${API}/owner/restaurant`, {
        headers: authHeaders()
      });
      setCustomizationForm({
        logo_url: res.data.logo_url || '',
        cover_image_url: res.data.cover_image_url || '',
        theme_color: res.data.theme_color || '#004d40',
        accent_color: res.data.accent_color || '#e53935',
        font_style: res.data.font_style || 'Inter'
      });
    } catch (error) {
      toast.error('Tasarım ayarları yüklenemedi');
      console.error(error);
    } finally {
      setCustomizationLoading(false);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleCustomizationFile = async (event, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen görsel dosyası seç');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Görsel en fazla 5 MB olabilir');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setCustomizationForm((prev) => ({ ...prev, [fieldName]: base64 }));
      toast.success('Görsel hazırlandı');
    } catch (error) {
      toast.error('Görsel okunamadı');
      console.error(error);
    }
  };

  const handleSaveCustomization = async () => {
    try {
      setSavingCustomization(true);
      await axios.put(`${API}/owner/restaurant/customize`, customizationForm, {
        headers: authHeaders()
      });
      toast.success('Menü tasarımı kaydedildi');
      await fetchCustomization();
    } catch (error) {
      toast.error('Tasarım kaydedilemedi');
      console.error(error);
    } finally {
      setSavingCustomization(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/menu/categories`, categoryForm, {
        headers: authHeaders()
      });
      toast.success('Kategori eklendi');
      setCategoryDialog(false);
      setCategoryForm({ name: '', order: 0 });
      fetchData();
    } catch (error) {
      toast.error('Kategori eklenemedi');
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API}/owner/menu/categories/${id}`, {
        headers: authHeaders()
      });
      toast.success('Kategori silindi');
      fetchData();
    } catch (error) {
      toast.error('Kategori silinemedi');
      console.error(error);
    }
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        price: parseFloat(itemForm.price)
      };

      if (isEditingItem && editingItemId) {
        await axios.put(`${API}/owner/menu/items/${editingItemId}`, payload, {
          headers: authHeaders()
        });
        toast.success('Ürün güncellendi');
      } else {
        await axios.post(`${API}/owner/menu/items`, payload, {
          headers: authHeaders()
        });
        toast.success('Ürün eklendi');
      }

      setItemDialog(false);
      resetItemForm();
      fetchData();
    } catch (error) {
      toast.error(isEditingItem ? 'Ürün güncellenemedi' : 'Ürün eklenemedi');
      console.error(error);
    }
  };

  const handleEditMenuItem = (item) => {
    setItemForm({
      category_id: item.category_id || '',
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString?.() || '',
      image_url: item.image_url || '',
      available: item.available ?? true
    });
    setEditingItemId(item.id);
    setIsEditingItem(true);
    setItemDialog(true);
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API}/owner/menu/items/${id}`, {
        headers: authHeaders()
      });
      toast.success('Ürün silindi');
      fetchData();
    } catch (error) {
      toast.error('Ürün silinemedi');
      console.error(error);
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/tables`, tableForm, {
        headers: authHeaders()
      });
      toast.success('Masa eklendi ve QR kod oluşturuldu');
      setTableDialog(false);
      setTableForm({ table_number: '' });
      fetchData();
    } catch (error) {
      toast.error('Masa eklenemedi');
      console.error(error);
    }
  };

  const handleDeleteTable = async (id) => {
    if (!window.confirm('Bu masayı silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API}/owner/tables/${id}`, {
        headers: authHeaders()
      });
      toast.success('Masa silindi');
      fetchData();
    } catch (error) {
      toast.error('Masa silinemedi');
      console.error(error);
    }
  };

  const downloadQRCode = (qrCode, tableName) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `masa-${tableName}-qr.png`;
    link.click();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getItemsByCategory = (categoryId) => {
    return menuItems.filter(item => item.category_id === categoryId);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="owner-dashboard-title">Restoran Yönetimi</h1>
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
            <TabsTrigger value="menu" className="gap-2" data-testid="menu-tab">
              <UtensilsCrossed className="w-4 h-4" />
              Menü
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2" data-testid="tables-tab">
              <TableIcon className="w-4 h-4" />
              Masalar
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2" data-testid="orders-tab">
              <ShoppingBag className="w-4 h-4" />
              Siparişler
            </TabsTrigger>
            <TabsTrigger value="customization" className="gap-2" data-testid="customization-tab">
              <Palette className="w-4 h-4" />
              Menü Tasarımı
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Bugünkü Siparişler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.today.orders}</div>
                        <ShoppingBag className="w-8 h-8 text-orange-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Bugün</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Bugünkü Gelir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.today.revenue.toFixed(0)} ₺</div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Bugün</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Haftalık Siparişler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.week.orders}</div>
                        <Clock className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Son 7 gün</p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Haftalık Gelir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-gray-900">{stats.week.revenue.toFixed(0)} ₺</div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Son 7 gün</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Son 7 Gün Performans</CardTitle>
                      <CardDescription>Sipariş ve gelir trendi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.daily_stats}>
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
                      <CardTitle>Sipariş Durumu Dağılımı</CardTitle>
                      <CardDescription>Mevcut sipariş durumları</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Bekliyor', value: stats.status_distribution.pending, color: '#fbbf24' },
                              { name: 'Hazırlanıyor', value: stats.status_distribution.preparing, color: '#3b82f6' },
                              { name: 'Hazır', value: stats.status_distribution.ready, color: '#22c55e' },
                              { name: 'Tamamlandı', value: stats.status_distribution.completed, color: '#6b7280' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Bekliyor', value: stats.status_distribution.pending, color: '#fbbf24' },
                              { name: 'Hazırlanıyor', value: stats.status_distribution.preparing, color: '#3b82f6' },
                              { name: 'Hazır', value: stats.status_distribution.ready, color: '#22c55e' },
                              { name: 'Tamamlandı', value: stats.status_distribution.completed, color: '#6b7280' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-500" />
                      En Popüler Ürünler
                    </CardTitle>
                    <CardDescription>En çok sipariş edilen menü öğeleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.popular_items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-600">{item.count} adet</p>
                            <p className="text-xs text-gray-500">Sipariş edildi</p>
                          </div>
                        </div>
                      ))}
                      {stats.popular_items.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Henüz sipariş yok</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Kategoriler</h2>
                <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-full gap-2" data-testid="add-category-button">
                      <Plus className="w-4 h-4" />
                      Kategori Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Kategori</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateCategory} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="cat-name">Kategori Adı</Label>
                        <Input
                          id="cat-name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          required
                          data-testid="category-name-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cat-order">Sıralama</Label>
                        <Input
                          id="cat-order"
                          type="number"
                          value={categoryForm.order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" data-testid="submit-category-button">
                        Ekle
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <Card key={cat.id} className="shadow-sm" data-testid="category-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-600"
                        data-testid="delete-category-button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500">{getItemsByCategory(cat.id).length} ürün</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center mt-8">
                <h2 className="text-xl font-semibold">Menü Ürünleri</h2>
                <Dialog open={itemDialog} onOpenChange={(open) => {
                  setItemDialog(open);
                  if (!open) resetItemForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-full gap-2" data-testid="add-item-button">
                      <Plus className="w-4 h-4" />
                      Ürün Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{isEditingItem ? "Ürünü Düzenle" : "Yeni Ürün"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateMenuItem} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="item-category">Kategori</Label>
                        <Select
                          value={itemForm.category_id}
                          onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}
                        >
                          <SelectTrigger data-testid="item-category-select">
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-name">Ürün Adı</Label>
                        <Input
                          id="item-name"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                          required
                          data-testid="item-name-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-desc">Açıklama</Label>
                        <Textarea
                          id="item-desc"
                          value={itemForm.description}
                          onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-price">Fiyat (₺)</Label>
                        <Input
                          id="item-price"
                          type="number"
                          step="0.01"
                          value={itemForm.price}
                          onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                          required
                          data-testid="item-price-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Ürün Görseli</Label>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-50">
                            <Upload className="w-4 h-4" />
                            Görsel Yükle
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleItemImageUpload}
                            />
                          </label>

                          {itemForm.image_url && (
                            <Button type="button" variant="outline" onClick={clearItemImage}>
                              Görseli Kaldır
                            </Button>
                          )}
                        </div>

                        {itemForm.image_url && (
                          <img
                            src={itemForm.image_url}
                            alt="Ürün önizleme"
                            className="w-full h-40 rounded-xl object-cover border"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={itemForm.available}
                          onCheckedChange={(checked) => setItemForm({ ...itemForm, available: checked })}
                        />
                        <Label>Stokta var</Label>
                      </div>
                      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" data-testid="submit-item-button">
                        {isEditingItem ? 'Güncelle' : 'Ekle'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden" data-testid="menu-item-card">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover" />
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMenuItem(item)}
                            className="text-blue-500 hover:text-blue-600"
                            data-testid="edit-item-button"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="text-red-500 hover:text-red-600"
                            data-testid="delete-item-button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-semibold text-orange-600">{item.price} ₺</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.available ? 'Stokta' : 'Tükendi'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tables">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Masalar ve QR Kodlar</h2>
                <Dialog open={tableDialog} onOpenChange={setTableDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 rounded-full gap-2" data-testid="add-table-button">
                      <Plus className="w-4 h-4" />
                      Masa Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Masa</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTable} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="table-number">Masa Numarası</Label>
                        <Input
                          id="table-number"
                          value={tableForm.table_number}
                          onChange={(e) => setTableForm({ table_number: e.target.value })}
                          required
                          placeholder="Örn: 1, A1, VIP-1"
                          data-testid="table-number-input"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" data-testid="submit-table-button">
                        Oluştur (QR otomatik oluşturulacak)
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <Card key={table.id} className="shadow-sm" data-testid="table-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Masa {table.table_number}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-red-500 hover:text-red-600"
                          data-testid="delete-table-button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <img src={table.qr_code} alt={`QR Masa ${table.table_number}`} className="w-48 h-48" />
                      </div>
                      <Button
                        onClick={() => downloadQRCode(table.qr_code, table.table_number)}
                        variant="outline"
                        className="w-full gap-2"
                        data-testid="download-qr-button"
                      >
                        <Download className="w-4 h-4" />
                        QR Kodu İndir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {tables.length === 0 && (
                <div className="text-center py-12">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz masa eklenmemiş</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Tüm Siparişler</h2>
              
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-sm" data-testid="order-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">Masa {order.table_number}</CardTitle>
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
                ))}
              </div>

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz sipariş yok</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="customization">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-orange-500" />
                    Menü Tasarımı
                  </CardTitle>
                  <CardDescription>Logo, kapak görseli ve renkleri buradan değiştir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {customizationLoading ? (
                    <div className="py-8 text-center text-gray-500">Ayarlar yükleniyor...</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <Label>Logo Görseli</Label>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-50">
                            <Upload className="w-4 h-4" />
                            Logo Seç
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCustomizationFile(e, 'logo_url')}
                            />
                          </label>
                          {customizationForm.logo_url && <span className="text-xs text-green-600">Logo hazır</span>}
                        </div>
                        {customizationForm.logo_url && (
                          <img src={customizationForm.logo_url} alt="Logo önizleme" className="w-24 h-24 rounded-full object-cover border" />
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label>Kapak Görseli</Label>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-50">
                            <Upload className="w-4 h-4" />
                            Kapak Seç
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleCustomizationFile(e, 'cover_image_url')}
                            />
                          </label>
                          {customizationForm.cover_image_url && <span className="text-xs text-green-600">Kapak hazır</span>}
                        </div>
                        {customizationForm.cover_image_url && (
                          <img src={customizationForm.cover_image_url} alt="Kapak önizleme" className="w-full h-40 rounded-xl object-cover border" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="theme-color">Ana Renk</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="theme-color"
                              type="color"
                              value={customizationForm.theme_color}
                              onChange={(e) => setCustomizationForm((prev) => ({ ...prev, theme_color: e.target.value }))}
                              className="h-11 w-20 p-1"
                            />
                            <Input
                              value={customizationForm.theme_color}
                              onChange={(e) => setCustomizationForm((prev) => ({ ...prev, theme_color: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="accent-color">Vurgu Rengi</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="accent-color"
                              type="color"
                              value={customizationForm.accent_color}
                              onChange={(e) => setCustomizationForm((prev) => ({ ...prev, accent_color: e.target.value }))}
                              className="h-11 w-20 p-1"
                            />
                            <Input
                              value={customizationForm.accent_color}
                              onChange={(e) => setCustomizationForm((prev) => ({ ...prev, accent_color: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Yazı Tipi</Label>
                        <Select
                          value={customizationForm.font_style}
                          onValueChange={(value) => setCustomizationForm((prev) => ({ ...prev, font_style: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Yazı tipi seç" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-3">
                        <Button type="button" onClick={handleSaveCustomization} disabled={savingCustomization} className="bg-orange-500 hover:bg-orange-600">
                          {savingCustomization ? 'Kaydediliyor...' : 'Tasarımı Kaydet'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setCustomizationForm(DEFAULT_CUSTOMIZATION)}>
                          Sıfırla
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle>Canlı Önizleme</CardTitle>
                  <CardDescription>Müşterinin menü açıldığında göreceği havaya yakın önizleme.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-3xl overflow-hidden border shadow-sm bg-white"
                    style={{ fontFamily: fontPreviewMap[customizationForm.font_style] || fontPreviewMap.Inter }}
                  >
                    <div className="relative h-64">
                      {customizationForm.cover_image_url ? (
                        <img src={customizationForm.cover_image_url} alt="Kapak" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: customizationForm.theme_color }} />
                      )}
                      <div className="absolute inset-0 bg-black/35" />
                      <div className="absolute top-6 left-1/2 -translate-x-1/2">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 bg-white shadow-lg">
                          {customizationForm.logo_url ? (
                            <img src={customizationForm.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Logo</div>
                          )}
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6 text-white">
                        <h3 className="text-3xl font-semibold mb-1">Merhaba</h3>
                        <p className="text-sm text-white/90">Menünüz artık daha karakterli görünecek.</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4 bg-[#f8f8f8]">
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((item) => (
                          <div key={item} className="rounded-2xl overflow-hidden bg-white shadow-sm border">
                            <div className="h-24" style={{ backgroundColor: customizationForm.theme_color }} />
                            <div className="p-3">
                              <p className="font-semibold text-sm text-gray-900">Kategori {item}</p>
                              <p className="text-xs text-gray-500">6 ürün</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl text-white text-center py-3 font-semibold" style={{ backgroundColor: customizationForm.theme_color }}>
                        Menü Butonu
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 border">
                        <span className="text-sm text-gray-600">Sepet Rozeti</span>
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                          style={{ backgroundColor: customizationForm.accent_color }}
                        >
                          3
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;