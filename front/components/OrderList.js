import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams(filters).toString();
      
      const response = await fetch(`/api/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination({
          totalPages: data.totalPages,
          currentPage: data.currentPage,
          total: data.total
        });
      } else {
        toast.error('Ошибка загрузки заказов');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setFilters({
      ...filters,
      status: e.target.value,
      page: 1
    });
  };

  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage
    });
  };

  if (loading) return <div className="loading">Загрузка заказов...</div>;

  return (
    <div className="order-list">
      <div className="page-header">
        <h1>Мои заказы</h1>
        <Link to="/create-order" className="btn-primary">
          Создать заказ
        </Link>
      </div>

      <div className="filters">
        <select value={filters.status} onChange={handleStatusChange}>
          <option value="">Все статусы</option>
          <option value="pending">Ожидание</option>
          <option value="accepted">Принят</option>
          <option value="picked_up">Забран</option>
          <option value="delivered">Доставлен</option>
        </select>
      </div>

      <div className="orders-grid">
        {orders.map(order => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <p>Заказы не найдены</p>
        </div>
      )}

      <Pagination 
        pagination={pagination} 
        onPageChange={handlePageChange} 
      />
    </div>
  );
};

const OrderCard = ({ order }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      accepted: 'blue',
      picked_up: 'purple',
      delivered: 'green'
    };
    return colors[status] || 'gray';
  };

  return (
    <Link to={`/order/${order._id}`} className="order-card">
      <div className="order-header">
        <h3>Заказ #{order._id.slice(-6)}</h3>
        <span 
          className={`status-badge status-${order.status}`}
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          {order.status}
        </span>
      </div>
      
      <div className="order-info">
        <p><strong>От:</strong> {order.pickupAddress?.address}</p>
        <p><strong>До:</strong> {order.deliveryAddress?.address}</p>
        <p><strong>Создан:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      {order.courier && (
        <div className="courier-info">
          <strong>Курьер:</strong> {order.courier.name}
        </div>
      )}
    </Link>
  );
};

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination.totalPages || pagination.totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button 
        disabled={pagination.currentPage === 1}
        onClick={() => onPageChange(pagination.currentPage - 1)}
      >
        Назад
      </button>
      
      <span>Страница {pagination.currentPage} из {pagination.totalPages}</span>
      
      <button 
        disabled={pagination.currentPage === pagination.totalPages}
        onClick={() => onPageChange(pagination.currentPage + 1)}
      >
        Вперед
      </button>
    </div>
  );
};

export default OrderList;