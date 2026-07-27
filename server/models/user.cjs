'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Chat, { foreignKey: 'user_id', as: 'chats' });
      User.hasMany(models.SavedSnippet, { foreignKey: 'user_id', as: 'snippets' });
      User.hasOne(models.UserPolicyAcceptance, { foreignKey: 'user_id', as: 'policy_acceptance' });
    }
  }
  User.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    display_name: DataTypes.STRING,
    plan_type: DataTypes.STRING,
    otp_code: DataTypes.STRING,
    otp_expires_at: DataTypes.DATE,
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    refresh_token: DataTypes.TEXT,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
    paranoid: true, // Enables soft deletes
  });
  return User;
};