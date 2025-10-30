import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import OrderList from './components/OrderList';
import CreateOrder from './components/CreateOrder';
import OrderDetails from './components/OrderDetails';
import CourierOrders from './components/CourierOrders';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
              <Route path="/create-order" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
              <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute><CourierOrders /></ProtectedRoute>} />
            </Routes>
          </main>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

export default App;