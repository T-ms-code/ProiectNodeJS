'use strict';

const { faker } = require('@faker-js/faker');
function createRandomNotification() {
  return {
    userId: faker.datatype.number({ min: 1, max: 50 }),
    message: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const notifications = Array.from({ length: 23 }, createRandomNotification); 
    await queryInterface.bulkInsert('Notifications', notifications, {});
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Notifications', null, {})
  }
};
