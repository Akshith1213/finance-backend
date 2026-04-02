const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const FinancialRecord = require('./FinancialRecord');

// Role 1:M User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// User 1:M FinancialRecord
User.hasMany(FinancialRecord, { foreignKey: 'userId', as: 'financialRecords' });
FinancialRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Role,
  FinancialRecord,
};
