const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
});

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'influencer'), defaultValue: 'influencer' }
});

const Influencer = sequelize.define('Influencer', {
  referralCode: { type: DataTypes.STRING, unique: true, allowNull: false },
  commissionRate: { type: DataTypes.FLOAT, defaultValue: 0.10 }, // 10%
  status: { type: DataTypes.STRING, defaultValue: 'active' } // active or blocked
});

const Click = sequelize.define('Click', {
  ipAddress: { type: DataTypes.STRING },
  userAgent: { type: DataTypes.STRING },
  isFraudulent: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Sale = sequelize.define('Sale', {
  orderId: { type: DataTypes.STRING, unique: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  commissionAmount: { type: DataTypes.FLOAT, allowNull: false },
  productName: { type: DataTypes.STRING, defaultValue: 'Premium Product' }
});

const Payment = sequelize.define('Payment', {
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'paid'), defaultValue: 'pending' },
  payoutDate: { type: DataTypes.DATE }
});

// Relationships
User.hasOne(Influencer);
Influencer.belongsTo(User);

Influencer.hasMany(Click);
Click.belongsTo(Influencer);

Influencer.hasMany(Sale);
Sale.belongsTo(Influencer);

Influencer.hasMany(Payment);
Payment.belongsTo(Influencer);

module.exports = {
  sequelize,
  User,
  Influencer,
  Click,
  Sale,
  Payment
};
