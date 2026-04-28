import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  ShoppingCart, Plus, Minus, UtensilsCrossed, X, Clock, Star, Bell,
  Droplets, Receipt, Search, ChevronRight, ArrowLeft, Grid2X2, List,
  BookOpen, Home, ChefHat
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_COLORS = {
  primary: '#004d40',
  primaryLight: '#00695c',
  accent: '#e53935',
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#333333',
  textLight: '#757575',
  border: '#e0e0e0'
};

const FONT_MAP = {
  Inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  Poppins: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
  Roboto: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
  Arial: "Arial, sans-serif",
  Georgia: "Georgia, serif"
};

const QRMenu = () => {
  const { tableId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [view, setView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gridView, setGridView] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, [tableId]);

  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${API}/menu/${tableId}`);
      setRestaurant(res.data.restaurant);
      setTable(res.data.table);
      setCategories(res.data.categories);
      setItems(res.data.items);
    } catch (error) {
      toast.error('Menu yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    ...DEFAULT_COLORS,
    primary: restaurant?.theme_color || DEFAULT_COLORS.primary,
    primaryLight: restaurant?.theme_color || DEFAULT_COLORS.primaryLight,
    accent: restaurant?.accent_color || DEFAULT_COLORS.accent
  };

  const APP_FONT = FONT_MAP[restaurant?.font_style] || FONT_MAP.Inter;
  const logoSrc = restaurant?.logo_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80";
  const coverSrc = restaurant?.cover_image_url || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80";

  const addToCart = (item) => {
    const existing = cart.find(i => i.menu_item_id === item.id);
    if (existing) {
      setCart(cart.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([
        ...cart,
        {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          preparation_time_minutes: item.preparation_time_minutes || 10
        }
      ]);
    }
    toast.success(item.name + ' eklendi', { duration: 1500 });
  };

  const getCartQty = (itemId) => {
    const c = cart.find(i => i.menu_item_id === itemId);
    return c ? c.quantity : 0;
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => setCart(cart.filter(i => i.menu_item_id !== itemId));
  const getTotalAmount = () => cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const getTotalItems = () => cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz bos');
      return;
    }
    setCheckoutDialog(true);
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/orders`, {
        table_id: tableId,
        items: cart,
        payment_method: paymentMethod
      });
      toast.success('Siparisiniz alindi!');
      setPlacedOrder(res.data);
      setOrderPlaced(true);
      setCart([]);
      setCheckoutDialog(false);
    } catch (e) {
      toast.error('Siparis gonderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallWaiter = async (callType = 'waiter') => {
    const labels = {
      waiter: 'Garson cagirildi!',
      bill: 'Hesap istegi gonderildi!',
      water: 'Su istegi gonderildi!'
    };
    try {
      await axios.post(`${API}/waiter-call`, { table_id: tableId, call_type: callType });
      toast.success(labels[callType]);
    } catch (e) {
      toast.error('Islem basarisiz');
    }
  };

  const handleSubmitReview = async () => {
    try {
      await axios.post(`${API}/reviews`, {
        restaurant_id: restaurant.id,
        order_id: placedOrder ? placedOrder.id : null,
        rating,
        comment: reviewComment
      });
      toast.success('Degerlendirmeniz icin tesekkurler!');
      setReviewDialog(false);
      setRating(5);
      setReviewComment('');
    } catch (e) {
      toast.error('Degerlendirme gonderilemedi');
    }
  };

  const getCategoryItems = (catId) => {
    let filtered = items.filter(i => i.category_id === catId);
    if (searchQuery) {
      filtered = filtered.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const openCategories = () => {
    setView('categories');
    window.scrollTo(0, 0);
  };

  const openCategory = (cat) => {
    setSelectedCategory(cat);
    setView('category');
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedItem(null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const goCategory = () => {
    setView('category');
    setSelectedItem(null);
    window.scrollTo(0, 0);
  };

  const cartCount = getTotalItems();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, fontFamily: APP_FONT }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ backgroundColor: COLORS.primary }}>
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-400 text-sm">Menu yukleniyor...</p>
      </div>
    </div>
  );

  if (!restaurant || !table) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background, fontFamily: APP_FONT }}>
      <div className="text-center px-6">
        <UtensilsCrossed className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-800 font-semibold text-lg mb-1">Masa bulunamadi</p>
        <p className="text-gray-400 text-sm">QR kodu tekrar okutun</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: COLORS.background, fontFamily: APP_FONT }}>
      {view === 'home' && (
        <div className="relative h-screen flex flex-col">
          <div className="flex-1 relative">
            <img
              src={coverSrc}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

            <div className="absolute top-8 left-0 right-0 flex justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                <img
                  src={logoSrc}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="absolute bottom-24 left-6 right-6">
              <h1 className="text-white text-3xl font-light mb-1">{restaurant.name}</h1>
              <p className="text-white/80 text-sm">Masanız hazır, menünüz burada.</p>
            </div>
          </div>
        </div>
      )}

      {view === 'categories' && (
        <>
          <div className="sticky top-0 z-20 shadow-md" style={{ backgroundColor: COLORS.primary }}>
            <div className="flex items-center justify-center px-4 py-4 relative">
              <button
                onClick={goHome}
                className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={logoSrc}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-6">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat, idx) => {
                const count = items.filter(i => i.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => openCategory(cat)}
                    className="relative rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform"
                    style={{ aspectRatio: '1/1' }}
                  >
                    <img
                      src={cat.image_url || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80&idx=${idx}`}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm leading-tight">{cat.name}</p>
                      <p className="text-white/60 text-xs">{count} urun</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setReviewDialog(true)}
              className="w-full mt-6 py-4 rounded-xl text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform"
              style={{ backgroundColor: COLORS.primary }}
            >
              Memnuniyet Anketi
            </button>
          </div>
        </>
      )}

      {view === 'category' && selectedCategory && (
        <>
          <div className="sticky top-0 z-20 shadow-md" style={{ backgroundColor: COLORS.primary }}>
            <div className="flex items-center justify-center px-4 py-4 relative">
              <button
                onClick={openCategories}
                className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={logoSrc}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold" style={{ color: COLORS.text }}>{selectedCategory.name}</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setGridView(true)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${gridView ? 'text-white shadow-md' : 'bg-white text-gray-400 border'}`}
                  style={gridView ? { backgroundColor: COLORS.primary } : { borderColor: COLORS.border }}
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView(false)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${!gridView ? 'text-white shadow-md' : 'bg-white text-gray-400 border'}`}
                  style={!gridView ? { backgroundColor: COLORS.primary } : { borderColor: COLORS.border }}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs mb-4" style={{ color: COLORS.textLight }}>
              <button onClick={openCategories} className="hover:underline flex items-center gap-1">
                <Home className="w-3 h-3" /> Menu
              </button>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: COLORS.text }}>{selectedCategory.name}</span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.textLight }} />
              <input
                type="text"
                placeholder="Ne aramistiniz?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition shadow-sm"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              />
            </div>
          </div>

          <div className="px-4 pb-4">
            {gridView ? (
              <div className="grid grid-cols-2 gap-3">
                {getCategoryItems(selectedCategory.id).map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onTap={() => openDetail(item)}
                    addToCart={addToCart}
                    qty={getCartQty(item.id)}
                    updateQuantity={updateQuantity}
                    colors={COLORS}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {getCategoryItems(selectedCategory.id).map(item => (
                  <ProductListItem
                    key={item.id}
                    item={item}
                    onTap={() => openDetail(item)}
                    addToCart={addToCart}
                    qty={getCartQty(item.id)}
                    updateQuantity={updateQuantity}
                    colors={COLORS}
                  />
                ))}
              </div>
            )}
            {getCategoryItems(selectedCategory.id).length === 0 && (
              <div className="text-center py-16">
                <p style={{ color: COLORS.textLight }} className="text-sm">Bu kategoride urun bulunamadi</p>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'detail' && selectedItem && (
        <>
          <div className="sticky top-0 z-20 shadow-md" style={{ backgroundColor: COLORS.primary }}>
            <div className="flex items-center justify-center px-4 py-4 relative">
              <button
                onClick={goCategory}
                className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={logoSrc}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square overflow-hidden">
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#e8f5e9' }}>
                  <UtensilsCrossed className="w-20 h-20" style={{ color: COLORS.primaryLight }} />
                </div>
              )}
            </div>
          </div>

          <div className="px-4 -mt-4 relative z-10">
            <div className="bg-white rounded-t-3xl pt-6 px-2">
              <div className="flex items-center justify-center gap-1 text-xs mb-4" style={{ color: COLORS.textLight }}>
                <button onClick={openCategories} className="hover:underline flex items-center gap-1">
                  <Home className="w-3 h-3" /> Menu
                </button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={goCategory} className="hover:underline">{selectedCategory?.name}</button>
                <ChevronRight className="w-3 h-3" />
                <span className="truncate max-w-[100px]" style={{ color: COLORS.text }}>{selectedItem.name}</span>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-16" style={{ backgroundColor: COLORS.border }} />
                <div className="w-2 h-2 rotate-45" style={{ backgroundColor: COLORS.primary }} />
                <div className="h-px w-16" style={{ backgroundColor: COLORS.border }} />
              </div>

              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>{selectedItem.name}</h2>
                <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                  {selectedItem.price.toFixed(2).replace('.', ',')} <span className="text-base font-normal">TL</span>
                </p>
              </div>

              <div className="flex justify-center mb-6">
                {getCartQty(selectedItem.id) > 0 ? (
                  <div className="flex items-center gap-3 bg-white rounded-full px-2 py-1 shadow-lg border" style={{ borderColor: COLORS.border }}>
                    <button
                      onClick={() => updateQuantity(selectedItem.id, -1)}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition"
                      style={{ backgroundColor: '#f5f5f5' }}
                    >
                      <Minus className="w-4 h-4" style={{ color: COLORS.text }} />
                    </button>
                    <span className="font-bold text-lg w-8 text-center" style={{ color: COLORS.text }}>{getCartQty(selectedItem.id)}</span>
                    <button
                      onClick={() => updateQuantity(selectedItem.id, 1)}
                      className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md transition"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(selectedItem)}
                    className="flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-full shadow-lg active:scale-95 transition"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Siparis Listeme Ekle
                  </button>
                )}
              </div>

              {selectedItem.description && (
                <p className="text-center text-sm leading-relaxed mb-5 px-4" style={{ color: COLORS.textLight }}>
                  {selectedItem.description}
                </p>
              )}

              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white shadow-sm border" style={{ borderColor: COLORS.border }}>
                  <Clock className="w-4 h-4" style={{ color: COLORS.primary }} />
                  <span className="text-sm font-medium" style={{ color: COLORS.text }}>{selectedItem.preparation_time_minutes || 10} Dakika</span>
                </div>
              </div>

              {(() => {
                const similar = items.filter(i => i.category_id === selectedItem.category_id && i.id !== selectedItem.id).slice(0, 4);
                if (similar.length === 0) return null;
                return (
                  <div className="mb-6">
                    <h3 className="text-center font-semibold mb-4" style={{ color: COLORS.text }}>Benzer Urunler</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {similar.map(s => (
                        <ProductCard
                          key={s.id}
                          item={s}
                          onTap={() => { setSelectedItem(s); window.scrollTo(0, 0); }}
                          addToCart={addToCart}
                          qty={getCartQty(s.id)}
                          updateQuantity={updateQuantity}
                          colors={COLORS}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="relative h-20">
          <svg viewBox="0 0 375 80" className="absolute bottom-0 w-full h-20" preserveAspectRatio="none">
            <path
              d="M0,20 Q140,20 150,10 Q160,0 187.5,0 Q215,0 225,10 Q235,20 375,20 L375,80 L0,80 Z"
              fill="white"
              stroke="#e0e0e0"
              strokeWidth="0.5"
            />
          </svg>

          <div className="absolute inset-0 flex items-end pb-2 px-6">
            <button onClick={handleCheckout} className="flex-1 flex flex-col items-center gap-0.5 pb-2">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" style={{ color: cartCount > 0 ? COLORS.accent : COLORS.textLight }} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.accent }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium" style={{ color: cartCount > 0 ? COLORS.accent : COLORS.textLight }}>Siparis</span>
            </button>

            <div className="flex flex-col items-center -mt-6 mx-4">
              <button
                onClick={openCategories}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition"
                style={{ backgroundColor: COLORS.primary }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </button>
              <span className="text-[10px] font-medium mt-1" style={{ color: COLORS.text }}>Menu</span>
            </div>

            <button onClick={() => handleCallWaiter('waiter')} className="flex-1 flex flex-col items-center gap-0.5 pb-2">
              <Bell className="w-5 h-5" style={{ color: COLORS.textLight }} />
              <span className="text-[10px] font-medium" style={{ color: COLORS.textLight }}>Garson</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center" style={{ color: COLORS.text }}>Sepetiniz</DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Sepetiniz bos</p>
            </div>
          ) : (
            <div className="space-y-5 mt-2">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.menu_item_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: COLORS.background }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: COLORS.text }}>{item.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textLight }}>{item.price.toFixed(2)} TL x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.menu_item_id, -1)} className="w-7 h-7 rounded-lg border flex items-center justify-center" style={{ borderColor: COLORS.border }}>
                        <Minus className="w-3 h-3" style={{ color: COLORS.text }} />
                      </button>
                      <span className="font-bold text-sm w-6 text-center" style={{ color: COLORS.text }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menu_item_id, 1)} className="w-7 h-7 rounded-lg text-white flex items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(item.menu_item_id)} className="w-7 h-7 rounded-lg flex items-center justify-center ml-1 hover:bg-red-50">
                        <X className="w-3.5 h-3.5" style={{ color: COLORS.accent }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4" style={{ borderColor: COLORS.border }}>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-semibold" style={{ color: COLORS.textLight }}>Toplam</span>
                  <span className="text-xl font-bold" style={{ color: COLORS.primary }}>
                    {getTotalAmount().toFixed(2)} TL
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-semibold" style={{ color: COLORS.text }}>Odeme Yontemi</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-3 rounded-xl border" style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}>
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer text-sm">Nakit</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-xl border" style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}>
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer text-sm">Kredi Karti</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleCallWaiter('water')}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}
                  >
                    <Droplets className="w-3 h-3" /> Su
                  </button>
                  <button
                    onClick={() => handleCallWaiter('bill')}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}
                  >
                    <Receipt className="w-3 h-3" /> Hesap
                  </button>
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full h-12 font-bold rounded-xl text-white"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {submitting ? 'Gonderiliyor...' : 'Siparisi Onayla'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {orderPlaced && placedOrder && (
        <Dialog open={orderPlaced} onOpenChange={setOrderPlaced}>
          <DialogContent className="max-w-md rounded-2xl">
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: '#e8f5e9' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#4caf50' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>Siparisiniz Alindi!</h3>
                <p className="text-sm" style={{ color: COLORS.textLight }}>Mutfagimiz hazirlaniyor</p>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: '#e8f5e9' }}>
                <div className="flex items-center justify-center gap-2 mb-1" style={{ color: '#4caf50' }}>
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">Tahmini Sure</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#4caf50' }}>~{placedOrder.estimated_completion_minutes} dk</p>
              </div>
              <p className="text-xs" style={{ color: COLORS.textLight }}>Siparis No: {placedOrder.id.slice(0, 8).toUpperCase()}</p>
              <div className="flex gap-2">
                <Button onClick={() => setReviewDialog(true)} variant="outline" className="flex-1 gap-1 rounded-xl text-xs h-10" style={{ borderColor: COLORS.border }}>
                  <Star className="w-3.5 h-3.5" /> Degerlendir
                </Button>
                <Button onClick={() => window.open('/track/' + placedOrder.id, '_blank')} className="flex-1 gap-1 rounded-xl text-xs h-10 text-white" style={{ backgroundColor: COLORS.primary }}>
                  <Clock className="w-3.5 h-3.5" /> Takip Et
                </Button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCallWaiter('waiter')} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#fff3e0', color: '#e65100' }}>
                  Garson
                </button>
                <button onClick={() => handleCallWaiter('water')} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                  Su
                </button>
                <button onClick={() => handleCallWaiter('bill')} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>
                  Hesap
                </button>
              </div>
              <Button onClick={() => setOrderPlaced(false)} className="w-full rounded-xl h-10 text-sm font-semibold text-white" style={{ backgroundColor: COLORS.text }}>
                Tamam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center" style={{ color: COLORS.text }}>Deneyiminizi Degerlendirin</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="focus:outline-none transition-transform active:scale-110">
                  <Star className={`w-9 h-9 transition ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Deneyiminizi bizimle paylasin..."
              rows={3}
              className="rounded-xl"
              style={{ borderColor: COLORS.border }}
            />
            <Button onClick={handleSubmitReview} className="w-full rounded-xl h-10 font-semibold text-sm text-white" style={{ backgroundColor: COLORS.primary }}>
              Gonder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ProductCard = ({ item, onTap, addToCart, qty, updateQuantity, colors }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <button onClick={onTap} className="w-full text-left">
        <div className="aspect-square overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
              <UtensilsCrossed className="w-10 h-10" style={{ color: colors.primary }} />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          <p className="mt-2 font-bold" style={{ color: colors.primary }}>{item.price?.toFixed(2)} TL</p>
        </div>
      </button>

      <div className="px-3 pb-3">
        {qty > 0 ? (
          <div className="flex items-center justify-between rounded-xl border px-2 py-2" style={{ borderColor: colors.border }}>
            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold">{qty}</span>
            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: colors.primary }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={() => addToCart(item)} className="w-full rounded-xl py-2 text-sm font-semibold text-white" style={{ backgroundColor: colors.primary }}>
            Ekle
          </button>
        )}
      </div>
    </div>
  );
};

const ProductListItem = ({ item, onTap, addToCart, qty, updateQuantity, colors }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-3 items-center">
      <button onClick={onTap} className="flex gap-3 items-center flex-1 text-left min-w-0">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <UtensilsCrossed className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          <p className="mt-2 font-bold" style={{ color: colors.primary }}>{item.price?.toFixed(2)} TL</p>
        </div>
      </button>

      {qty > 0 ? (
        <div className="flex flex-col gap-2">
          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: colors.primary }}>
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-center font-semibold text-sm">{qty}</span>
          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
            <Minus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button onClick={() => addToCart(item)} className="rounded-xl px-4 py-2 text-sm font-semibold text-white flex-shrink-0" style={{ backgroundColor: colors.primary }}>
          Ekle
        </button>
      )}
    </div>
  );
};

export default QRMenu;
