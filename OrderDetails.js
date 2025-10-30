import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableCouriers, setAvailableCouriers] = useState([]);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        setAvailableCouriers(data.availableCouriers || []);
      } else {
        toast.error('Ошибка загрузки заказа');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Статус обновлен');
        setOrder(data.order);
      } else {
        toast.error(data.error || 'Ошибка обновления статуса');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const assignCourier = async (courierId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courierId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Курьер назначен');
        setOrder(data.order);
      } else {
        toast.error(data.error || 'Ошибка назначения курьера');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!order) return <div className="error">Заказ не найден</div>;

  return (
    <div className="order-details">
      <div className="order-header">
        <h1>Заказ #{order._id.slice(-6)}</h1>
        <span className={`status-badge status-${order.status}`}>
          {order.status}
        </span>
      </div>

      <div className="order-layout">
        <div className="order-main">
          <OrderInfo order={order} />
          <TrackingHistory history={order.trackingHistory} />
        </div>

        <div className="order-sidebar">
          <OrderActions 
            order={order}
            onStatusUpdate={updateOrderStatus}
            onAssignCourier={assignCourier}
            availableCouriers={availableCouriers}
          />
        </div>
      </div>
    </div>
  );
};

const OrderInfo = ({ order }) => (
  <div className="info-card">
    <h3>Информация о заказе</h3>
    
    <div className="info-grid">
      <div className="info-item">
        <strong>Адрес получения:</strong>
        <span>{order.pickupAddress?.address}</span>
      </div>
      
      <div className="info-item">
        <strong>Адрес доставки:</strong>
        <span>{order.deliveryAddress?.address}</span>
      </div>
      
      <div className="info-item">
        <strong>Получатель:</strong>
        <span>{order.recipient?.name} - {order.recipient?.phone}</span>
      </div>
      
      <div className="info-item">
        <strong>Создан:</strong>
        <span>{new Date(order.createdAt).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const TrackingHistory = ({ history }) => (
  <div className="tracking-card">
    <h3>История отслеживания</h3>
    
    <div className="timeline">
      {history.map((item, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <div className="timeline-header">
              <strong>{item.status}</strong>
              <span>{new Date(item.timestamp || item.createdAt).toLocaleString()}</span>
            </div>
            <p>{item.description}</p>
            {item.location && (
              <small>Местоположение: {item.location.address}</small>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OrderActions = ({ order, onStatusUpdate, onAssignCourier, availableCouriers }) => {
  const { user } = JSON.parse(localStorage.getItem('user') || '{}');

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'accepted',
      accepted: 'picked_up',
      picked_up: 'delivered'
    };
    return statusFlow[currentStatus];
  };

  return (
    <div className="actions-card">
      <h3>Действия</h3>
      
      {user.role === 'admin' && !order.courier && availableCouriers.length > 0 && (
        <div className="action-group">
          <label>Назначить курьера:</label>
          <select onChange={(e) => onAssignCourier(e.target.value)}>
            <option value="">Выберите курьера</option>
            {availableCouriers.map(courier => (
              <option key={courier._id} value={courier._id}>
                {courier.name} - {courier.rating || 'Новый'}
              </option>
            ))}
          </select>
        </div>
      )}

      {user.role === 'courier' && order.courier === user.id && (
        <div className="action-group">
          <button 
            onClick={() => onStatusUpdate(getNextStatus(order.status))}
            className="btn-primary"
          >
            Отметить как {getNextStatus(order.status)}
          </button>
        </div>
      )}

      {order.courier && (
        <div className="courier-info">
          <h4>Назначенный курьер</h4>
          <p><strong>Имя:</strong> {order.courier.name}</p>
          <p><strong>Телефон:</strong> {order.courier.phone}</p>
          <p><strong>Рейтинг:</strong> {order.courier.rating || 'Новый'}</p>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;