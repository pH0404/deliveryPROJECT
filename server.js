const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const loginRouter = require('./auth');
app.use('/api/auth', loginRouter)

const app = express();
const server = http.createServer(app);

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/delivery-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(' MongoDB Connected');
  } catch (error) {
    console.log(' MongoDB connection failed:', error.message);
    console.log(' Running in mock mode without database');
  }
};
connectDB();

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'courier', 'admin'], default: 'customer' },
  profile: {
    name: String,
    phone: String,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const User = require('./models/User');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  pickupAddress: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  deliveryAddress: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  packageDetails: {
    description: String,
    weight: Number,
    dimensions: { length: Number, width: Number, height: Number }
  },
  payment: {
    amount: Number,
    method: { type: String, enum: ['card', 'cash', 'online'], default: 'cash' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
  }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.orderNumber = 'ORD' + Date.now();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

app.use(cors());
app.use(express.json());

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};


app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Delivery Platform API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      password: hashedPassword,
      role: role || 'customer',
      profile: { name, phone }
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders', auth, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      customer: req.user._id
    };

    const order = new Order(orderData);
    await order.save();
    await order.populate('customer', 'profile email');

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'courier') {
      filter.courier = req.user._id;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'profile email')
      .populate('courier', 'profile email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/couriers/nearby', auth, async (req, res) => {
  try {
    const couriers = await User.find({
      role: 'courier'
    }).select('profile email');

    res.json({
      success: true,
      couriers: couriers.map(courier => ({
        id: courier._id,
        name: courier.profile.name,
        email: courier.email,
        status: 'available'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(' ====================================');
  console.log(' Delivery Platform Server Started!');
  console.log(' ====================================');
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Mock mode'}`);
  console.log('');
  console.log(' Available Endpoints:');
  console.log('   GET  /health            - Health check');
  console.log('   POST /api/auth/register - User registration');
  console.log('   POST /api/auth/login    - User login');
  console.log('   GET  /api/orders        - List orders');
  console.log('   POST /api/orders        - Create order');
  console.log('   GET  /api/couriers/nearby - Nearby couriers');
  console.log('');
  console.log(' Server is ready to accept requests!');
});
