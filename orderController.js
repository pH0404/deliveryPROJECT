const Order = require('../models/Order');
const Courier = require('../models/Courier');
const routeOptimization = require('../services/routeOptimization');
const locationService = require('../services/locationService');

class OrderController {
  
  async createOrder(req, res) {
    try {
      const orderData = {
        ...req.body,          
        customer: req.user.id 
      };

      const order = new Order(orderData);
      await order.save();

      order.trackingHistory.push({
        status: 'pending',           
        description: 'Order created' 
      });
      await order.save();

      const nearbyCouriers = await locationService.getNearbyCouriers(
        order.pickupAddress.coordinates
      );

      res.status(201).json({
        success: true,
        order,
        availableCouriers: nearbyCouriers.length
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const filter = {};

      if (req.user.role === 'customer') {
        filter.customer = req.user.id;
      } else if (req.user.role === 'courier') {
        filter.courier = req.user.id;
      }

      if (status) filter.status = status;

      const orders = await Order.find(filter)
        .populate('customer', 'profile name email')
        .populate('courier', 'profile name')        
        .sort({ createdAt: -1 })                    
        .limit(limit * 1)                           
        .skip((page - 1) * limit);                  

      const total = await Order.countDocuments(filter);

      res.json({
        success: true,
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,                   
        total                                
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, location } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (req.user.role === 'courier' && order.courier.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      order.status = status;
      
      order.trackingHistory.push({
        status,
        location: location || order.deliveryAddress,
        description: `Status changed to ${status}` 
      });

      if (status === 'picked_up') {
        order.timeline.actualPickup = new Date();
      } else if (status === 'delivered') {
        order.timeline.actualDelivery = new Date();
        order.payment.status = 'paid';
      }

      await order.save();

      res.json({ success: true, order });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignCourier(req, res) {
    try {
      const { orderId } = req.params;
      const { courierId } = req.body;

      const order = await Order.findById(orderId);
      const courier = await Courier.findOne({ user: courierId });

      if (!order || !courier) {
        return res.status(404).json({ error: 'Order or courier not found' });
      }

      order.courier = courierId;
      order.status = 'accepted';
      
      order.trackingHistory.push({
        status: 'accepted',
        description: `Courier ${courier.user.profile.name} assigned` 
      });


      courier.status = 'busy';
      await courier.save();
      await order.save();  

      res.json({ success: true, order });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}


module.exports = new OrderController();