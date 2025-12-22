'use strict';

const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

const generatedHash = (myPlaintextPassword) =>
  bcrypt.hashSync(myPlaintextPassword, 3);

function createRandomUser(role = 'reader') {
  return {
    name: faker.name.firstName() + " " + faker.name.lastName(),
    password: generatedHash(faker.internet.password()),
    email: faker.internet.email(),
    age: faker.datatype.number({ min: 18, max: 80 }),
    country: faker.address.country(),
    bio: faker.lorem.sentence(),
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

module.exports = {
  async up(queryInterface) {

    // I wanted to make sure there's at least one admin user
    const adminUser = createRandomUser('admin');

  //Others users
    const users = Array.from({ length: 48 }, () => createRandomUser(faker.helpers.arrayElement(['reader', 'admin'])));

    const mikeUser = {
      name: 'Mike Johnson',
      password: generatedHash('MikePassword123'),
      email: 'mike.johnson@gmail.com',
      age: 30,
      country: 'USA',
      bio: 'A passionate reader and book club member.',
      role: 'reader',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await queryInterface.bulkInsert('Users', [mikeUser, adminUser, ...users], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
