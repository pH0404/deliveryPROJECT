import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const CourierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders?status=accepted,picked_up', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error('Ошибка загрузки заказов');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Статус обновлен');
        fetchOrders(); // Refresh the list
      } else {
        toast.error(data.error || 'Ошибка обновления статуса');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  if (loading) return <div className="loading">Загрузка заказов...</div>;

  return (
    <div className="courier-orders">
      <h1>Мои текущие заказы</h1>
      
      <div className="orders-list">
        {orders.map(order => (
          <CourierOrderCard 
            key={order._id} 
            order={order} 
            onStatusUpdate={updateStatus}
          />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <p>Нет текущих заказов</p>
        </div>
      )}
    </div>
  );
};

const CourierOrderCard = ({ order, onStatusUpdate }) => {
  const getNextAction = (currentStatus) => {
    const actions = {
      accepted: { label: 'Забрал посылку', status: 'picked_up' },
      picked_up: { label: 'Доставил', status: 'delivered' }
    };
    return actions[currentStatus];
  };

  const nextAction = getNextAction(order.status);

  return (
    <div className="courier-order-card">
      <div className="order-main-info">
        <h3>Заказ #{order._id.slice(-6)}</h3>
        <span className={`status-badge status-${order.status}`}>
          {order.status}
        </span>
      </div>

      <div className="order-route">
        <div className="route-point">
          <strong>От:</strong> {order.pickupAddress?.address}
        </div>
        <div className="route-point">
          <strong>До:</strong> {order.deliveryAddress?.address}
        </div>
      </div>

      <div className="recipient-info">
        <strong>Получатель:</strong> {order.recipient?.name} - {order}
        </div>
    </div>
    );
};