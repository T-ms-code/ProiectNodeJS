'use strict';

const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    const personalLibraries = [];
    const usedPairs = new Set();

    const USERS_COUNT = 50;
    const BOOKS_COUNT = 250;
    const TOTAL_ENTRIES = 300;

    while (personalLibraries.length < TOTAL_ENTRIES) {
      const userId = faker.datatype.number({ min: 1, max: USERS_COUNT });
      const bookId = faker.datatype.number({ min: 1, max: BOOKS_COUNT });
      const key = `${userId}-${bookId}`;

      if (usedPairs.has(key)) continue;

      usedPairs.add(key);

      const status = faker.helpers.arrayElement(['to-read','reading','completed']);

      personalLibraries.push({
        userId,
        bookId,
        status,
        currentPage:
          status === 'to-read'
            ? 0
            : faker.datatype.number({ min: 1, max: 500 }),
        rating: faker.helpers.arrayElement([null,0,1,2,3,4,5,6,7,8,9,10]),
        visibility: faker.helpers.arrayElement(['private','public']),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('PersonalLibraries', personalLibraries, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('PersonalLibraries', null, {});
  }
};
