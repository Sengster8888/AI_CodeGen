'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Chat, { foreignKey: 'user_id', as: 'chats' });
      User.hasMany(models.SavedSnippet, { foreignKey: 'user_id', as: 'snippets' });
    }
  }
  User.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    display_name: DataTypes.STRING,
    plan_type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};