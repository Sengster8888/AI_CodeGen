'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SavedSnippet extends Model {
    static associate(models) {
      SavedSnippet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      SavedSnippet.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });
    }
  }
  SavedSnippet.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    user_id: DataTypes.UUID,
    message_id: DataTypes.UUID,
    title: DataTypes.STRING,
    code_content: DataTypes.TEXT,
    language: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SavedSnippet',
  });
  return SavedSnippet;
};