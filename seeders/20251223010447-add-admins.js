'use strict';


const bcrypt = require('bcrypt');
const generatedHash = (myPlaintextPassword) =>
  bcrypt.hashSync(myPlaintextPassword, 3);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const adminUser = {
      name: 'Mike Johnson',
      password: generatedHash('MikePassword123'),
      email: 'mike.johnson@gmail.com',
      age: 30,
      country: 'USA',
      bio: 'Administrator account',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await queryInterface.bulkInsert('Users', [adminUser], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { name: 'Mike Johnson' }, {});
  }
};
