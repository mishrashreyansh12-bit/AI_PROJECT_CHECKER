const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, User, Influencer, Click, Sale, Payment } = require('./db');
const trackRoutes = require('./routes/track');
const adminRoutes = require("./routes/admin");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Sync Middleware for Serverless Execution
let isSynced = false;
let syncPromise = null;

const ensureDbSynced = async (req, res, next) => {
  if (isSynced) return next();
  
  if (!syncPromise) {
    syncPromise = sequelize.sync()
      .then(() => {
        isSynced = true;
        console.log('Database synced successfully');
      })
      .catch((err) => {
        syncPromise = null;
        console.error('Database sync failed:', err.message);
        throw err;
      });
  }
  
  try {
    await syncPromise;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Database synchronization failed: ' + err.message });
  }
};

app.use(ensureDbSynced);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Tracking Routes
app.use('/api/track', trackRoutes);
app.use("/api/admin", adminRoutes);

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'influencer',
    });

    if (user.role === 'influencer') {
      const referralCode =
        name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);

      await Influencer.create({
        UserId: user.id,
        referralCode,
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== INFLUENCER ROUTES ====================

app.get('/api/influencer/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: 'Access denied. Influencers only.' });
    }

    const influencer = await Influencer.findOne({
      where: { UserId: req.user.id },
      include: [Click, Sale, Payment],
    });

    if (!influencer) {
      return res.status(404).json({ error: 'Influencer profile not found' });
    }

    res.json(influencer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/dashboard', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const influencers = await Influencer.findAll({
      include: [User, Sale, Click, Payment],
    });

    const sales = await Sale.findAll({
      include: [{
        model: Influencer,
        include: [User]
      }],
      order: [['createdAt', 'DESC']]
    });
    const payments = await Payment.findAll();
    const clicks = await Click.findAll();

    res.json({
      influencers,
      sales,
      payments,
      clicks,
      summary: {
        totalInfluencers: influencers.length,
        totalSales: sales.length,
        totalClicks: clicks.length,
        totalPayments: payments.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== NEW SAAS ADMIN & INFLUENCER ENDPOINTS ====================

app.post('/api/admin/influencer/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'blocked'

    const influencer = await Influencer.findByPk(id);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    influencer.status = status;
    await influencer.save();

    res.json({ message: `Influencer status updated to ${status}`, influencer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/influencer/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    const { id } = req.params;

    const influencer = await Influencer.findByPk(id);
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    await Click.destroy({ where: { InfluencerId: id } });
    await Sale.destroy({ where: { InfluencerId: id } });
    await Payment.destroy({ where: { InfluencerId: id } });
    
    const userId = influencer.UserId;
    await influencer.destroy();
    if (userId) {
      await User.destroy({ where: { id: userId } });
    }

    res.json({ message: 'Influencer and associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/payment/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'rejected', or 'paid'

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = status;
    if (status === 'paid') {
      payment.payoutDate = new Date();
    }
    await payment.save();

    res.json({ message: `Payment status updated to ${status}`, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/influencer/withdraw', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'influencer') {
      return res.status(403).json({ error: 'Access denied. Influencers only.' });
    }
    const influencer = await Influencer.findOne({ where: { UserId: req.user.id } });
    if (!influencer) {
      return res.status(404).json({ error: 'Influencer not found' });
    }

    const updatedCount = await Payment.update(
      { status: 'paid', payoutDate: new Date() },
      { where: { InfluencerId: influencer.id, status: 'approved' } }
    );

    res.json({ message: 'Withdrawal processed successfully', processedPaymentsCount: updatedCount[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PUBLIC TRACKING ROUTE ====================

app.get('/t/:refCode', async (req, res) => {
  try {
    const { refCode } = req.params;

    const influencer = await Influencer.findOne({
      where: { referralCode: refCode },
    });

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host || '';

    if (influencer) {
      if (influencer.status === 'blocked') {
        return res.status(403).send('<h1>Access Suspended</h1><p>This affiliate account is currently suspended.</p>');
      }
      await Click.create({
        InfluencerId: influencer.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      let redirectUrl = `${protocol}://${host}/shop?ref=${refCode}`;
      if (host.includes('localhost:') || host.includes('127.0.0.1:')) {
        redirectUrl = `http://localhost:5173/shop?ref=${refCode}`;
      }
      return res.redirect(redirectUrl);
    }

    let fallbackUrl = `${protocol}://${host}/shop`;
    if (host.includes('localhost:') || host.includes('127.0.0.1:')) {
      fallbackUrl = `http://localhost:5173/shop`;
    }
    return res.redirect(fallbackUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Influencer Affiliate API is running successfully',
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  sequelize
    .sync()
    .then(() => {
      console.log('Database connected successfully');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Database connection failed:', err.message);
    });
} else {
  sequelize.sync()
    .then(() => console.log('Database synced for serverless function'))
    .catch((err) => console.error('Database sync failed for serverless:', err.message));
}

module.exports = app;
