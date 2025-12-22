'use strict';

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const { faker } = require('@faker-js/faker');
function createRandomReadingCircle() {
  const wordCount = faker.datatype.number({ min: 2, max: 25 });
  const words = faker.lorem.words(wordCount).split(' ');
  words[0] = capitalizeFirst(words[0]);
    return {
    name: words.join(' '),
    description: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const readingCircles = Array.from({ length: 20 }, createRandomReadingCircle); 
    await queryInterface.bulkInsert('ReadingCircles', readingCircles, {});
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ReadingCircles', null, {})
  }   
};