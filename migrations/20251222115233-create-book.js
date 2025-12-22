'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Books', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      author: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
      await queryInterface.createTable('PersonalLibraries', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
        bookId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Books',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
        status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'to-read'
      },
        currentPage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
        rating: {
        type: Sequelize.INTEGER,
        allowNull: true//default
      },
        visibility: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'private'
      },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PersonalLibraries');
    await queryInterface.dropTable('Books');
  }
};