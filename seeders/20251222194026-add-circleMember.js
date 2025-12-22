'use strict';

const { faker } = require('@faker-js/faker');

module.exports = {
  async up(queryInterface) {
    const circleMembers = [];
    const usedPairs = new Set();

    const USERS_COUNT = 50;
    const CIRCLES_COUNT = 20;
    const TOTAL_MEMBERS = 300;

    for (let circleId = 1; circleId <= CIRCLES_COUNT; circleId++) {
      const userId = faker.datatype.number({ min: 1, max: USERS_COUNT });
      const key = `${userId}-${circleId}`;

      usedPairs.add(key);

      circleMembers.push({
        userId,
        circleId,
        circleRole: 'circleAdmin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    while (circleMembers.length < TOTAL_MEMBERS) {
      const userId = faker.datatype.number({ min: 1, max: USERS_COUNT });
      const circleId = faker.datatype.number({ min: 1, max: CIRCLES_COUNT });
      const key = `${userId}-${circleId}`;

      if (usedPairs.has(key)) continue;

      usedPairs.add(key);

      circleMembers.push({
        userId,
        circleId,
        circleRole: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }//In this way, we ensure no duplicate user-circle pairs and that each circle has one admin.

    await queryInterface.bulkInsert('CircleMembers', circleMembers, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('CircleMembers', null, {});
  }
};
