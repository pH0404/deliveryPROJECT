import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateOrder = () => {
  const [formData, setFormData] = useState({
    pickupAddress: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    },
    deliveryAddress: {
      address: '',
      coordinates: { lat: 0, lng: 0 }
    },
    packageDetails: {
      size: 'small',
      weight: 1,
      description: ''
    },
    recipient: {
      name: '',
      phone: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Заказ успешно создан!');
        navigate(`/order/${data.order._id}`);
      } else {
        toast.error(data.error || 'Ошибка создания заказа');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-order">
      <h1>Создать новый заказ</h1>
      
      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-section">
          <h3>Информация о получении</h3>
          
          <div className="form-group">
            <label>Адрес получения:</label>
            <input
              type="text"
              value={formData.pickupAddress.address}
              onChange={(e) => handleChange('pickupAddress.address', e.target.value)}
              required
              placeholder="Улица, дом, квартира"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Информация о доставке</h3>
          
          <div className="form-group">
            <label>Адрес доставки:</label>
            <input
              type="text"
              value={formData.deliveryAddress.address}
              onChange={(e) => handleChange('deliveryAddress.address', e.target.value)}
              required
              placeholder="Улица, дом, квартира"
            />
          </div>

          <div className="form-group">
            <label>Имя получателя:</label>
            <input
              type="text"
              value={formData.recipient.name}
              onChange={(e) => handleChange('recipient.name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон получателя:</label>
            <input
              type="tel"
              value={formData.recipient.phone}
              onChange={(e) => handleChange('recipient.phone', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Информация о посылке</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Размер:</label>
              <select
                value={formData.packageDetails.size}
                onChange={(e) => handleChange('packageDetails.size', e.target.value)}
              >
                <option value="small">Маленький</option>
                <option value="medium">Средний</option>
                <option value="large">Большой</option>
              </select>
            </div>

            <div className="form-group">
              <label>Вес (кг):</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.packageDetails.weight}
                onChange={(e) => handleChange('packageDetails.weight', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={formData.packageDetails.description}
              onChange={(e) => handleChange('packageDetails.description', e.target.value)}
              placeholder="Описание содержимого посылки"
              rows="3"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Создание...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;