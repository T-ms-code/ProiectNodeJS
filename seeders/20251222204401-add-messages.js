'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const circleMembers = await queryInterface.sequelize.query(
      'SELECT userId, circleId FROM "CircleMembers"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const chats = await queryInterface.sequelize.query(
      'SELECT id, circleId FROM "Chats"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const messages = [];
    const MESSAGES_PER_CHAT = 20;

    for (const chat of chats) {
      const members = circleMembers.filter(
        cm => cm.circleId === chat.circleId
      );

      if (members.length === 0) continue;

      for (let i = 0; i < MESSAGES_PER_CHAT; i++) {
        const sender = faker.helpers.arrayElement(members);

        messages.push({
          chatId: chat.id,
          memberId: sender.userId,
          content: faker.lorem.sentence(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert('Messages', messages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', null, {});
  }
};
