'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserPolicyAcceptance extends Model {
    static associate(models) {
      UserPolicyAcceptance.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  UserPolicyAcceptance.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: { type: DataTypes.UUID, allowNull: false },
    tos_accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
    privacy_accepted: { type: DataTypes.BOOLEAN, defaultValue: false },
    accepted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserPolicyAcceptance',
  });
  return UserPolicyAcceptance;
};