import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import CashierDashboard from './pages/CashierDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import QRMenu from './pages/QRMenu';
import OrderTracking from './pages/OrderTracking';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/kitchen" element={<KitchenDashboard />} />
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/menu/:tableId" element={<QRMenu />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
