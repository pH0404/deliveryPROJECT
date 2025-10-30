import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Delivery App</Link>
      </div>
      
      <div className="nav-links">
        {user.role === 'customer' && (
          <>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              Все заказы
            </Link>
            <Link 
              to="/create-order" 
              className={location.pathname === '/create-order' ? 'active' : ''}
            >
              Создать заказ
            </Link>
          </>
        )}
        
        {user.role === 'courier' && (
          <Link 
            to="/my-orders" 
            className={location.pathname === '/my-orders' ? 'active' : ''}
          >
            Мои заказы
          </Link>
        )}

        {user.role === 'admin' && (
          <Link to="/">Все заказы</Link>
        )}
      </div>

      <div className="nav-user">
        <span>Привет, {user.name || user.email}!</span>
        <button onClick={handleLogout} className="logout-btn">
          Выйти
        </button>
      </div>
    </nav>
  );
};

export default Navbar;