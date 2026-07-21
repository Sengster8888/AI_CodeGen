'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'refresh_token', {
      type: Sequelize.TEXT, // TEXT is safer for long JWTs
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'refresh_token');
  }
};
