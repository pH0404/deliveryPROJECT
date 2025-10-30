const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
const validator = require('validator');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;


    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword, role: role || 'customer', profile: { name, phone } });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, 'your-secret-key', { expiresIn: '7d' });

    res.status(201).json({ success: true, token, user: { id: user._id, email, role: user.role, profile: user.profile } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

});
await LoginLog.create({
  user: user?._id,
  email,
  success: isPasswordValid,
  ip: req.ip,
  userAgent: req.get('User-Agent')
});
const checkRoles = require('../middleware/roles');

router.get('/logs', auth, checkRoles(['admin']), async (req, res) => {
  const logs = await LoginLog.find().populate('user', 'email profile role').sort({ timestamp: -1 });
  res.json({ success: true, total: logs.length, logs });
});
const checkRoles = require('./middleware/roles');

module.exports = { auth, requireRole };
