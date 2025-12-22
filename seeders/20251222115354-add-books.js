'use strict';
const { faker } = require('@faker-js/faker');

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createRandomBook() {
  const wordCount = faker.datatype.number({ min: 2, max: 6 });
  const words = faker.lorem.words(wordCount).split(' ');
  words[0] = capitalizeFirst(words[0]);
  return {
    title: words.join(' '),
    author: faker.name.firstName()+" "+faker.name.lastName(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const books = Array.from({ length: 250 }, createRandomBook); 
    await queryInterface.bulkInsert('Books', books, {});
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Books', null, {})
  }
}


