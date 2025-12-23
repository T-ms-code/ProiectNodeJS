'use strict';

const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

const generatedHash = (myPlaintextPassword) =>
  bcrypt.hashSync(myPlaintextPassword, 3);

function createRandomUser() {
  return {
    name: faker.name.firstName() + " " + faker.name.lastName(),
    password: generatedHash(faker.internet.password()),
    email: faker.internet.email(),
    age: faker.datatype.number({ min: 18, max: 80 }),
    country: faker.address.country(),
    bio: faker.lorem.sentence(),
    role: 'reader',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

module.exports = {
  async up(queryInterface) {
    const manualUser = {
      name: 'Mike Tyson',
      password: generatedHash('password'),
      email: 'miket@gmail.com',
      age: 355,
      country: 'USA',
      bio: 'Boxing reader.',
      role: 'reader',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const users = Array.from({ length: 49 }, () => createRandomUser());
  //Just readers. Admins will be added separately with a specific migration
    await queryInterface.bulkInsert('Users', [manualUser,...users], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
