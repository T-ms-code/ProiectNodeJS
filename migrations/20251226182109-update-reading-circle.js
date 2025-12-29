"use strict"

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add ownerId column to ReadingCircles
    await queryInterface.addColumn("ReadingCircles", "ownerId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    })

    // Add status column to CircleMembers
    await queryInterface.addColumn("CircleMembers", "status", {
      type: Sequelize.STRING,
      defaultValue: "pending",
      allowNull: false,
    })

    await queryInterface.addColumn("CircleMembers", "requestedAt", {
      type: Sequelize.DATE,
      allowNull: true, // add nullable to avoid SQLite error
    })

    await queryInterface.addColumn("CircleMembers", "respondedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    })

    // populate requestedAt for existing rows
    await queryInterface.sequelize.query(
      "UPDATE CircleMembers SET requestedAt = datetime('now') WHERE requestedAt IS NULL;"
    )

    // populate status for existing rows (set to 'accepted' for existing members)
    await queryInterface.sequelize.query(
      "UPDATE CircleMembers SET status = 'accepted' WHERE status IS NULL;"
    )

    // add unique constraint
    await queryInterface.addConstraint("CircleMembers", {
      fields: ["circleId", "userId"],
      type: "unique",
      name: "uniq_circle_user",
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface
      .removeConstraint("CircleMembers", "uniq_circle_user")
      .catch(() => {})
    await queryInterface
      .removeColumn("CircleMembers", "respondedAt")
      .catch(() => {})
    await queryInterface
      .removeColumn("CircleMembers", "requestedAt")
      .catch(() => {})
    await queryInterface.removeColumn("CircleMembers", "status").catch(() => {})
    await queryInterface
      .removeColumn("ReadingCircles", "ownerId")
      .catch(() => {})
  },
}
