const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://kr551344_db_user:8caC17YO3MqAcJ1R@krafts.a3qrjgl.mongodb.net/?appName=krafts',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  seedOnStart: String(process.env.SEED_ON_START || 'false').toLowerCase() === 'true',
};
