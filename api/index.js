// Force Vercel to bundle PostgreSQL drivers (Sequelize dynamic imports)
require('pg');
require('pg-hstore');

const app = require('../backend/server.js');
module.exports = app;
