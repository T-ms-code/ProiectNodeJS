'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    for (let i = 1; i <= 20; i++) {
      await queryInterface.bulkInsert('Chats', [{
        circleId: i,
        createdAt: new Date(),
        updatedAt: new Date(),
      }], {});
    } 
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Chats', null, {});
  }
};
