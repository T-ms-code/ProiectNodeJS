const db = require("../models")

async function isCircleAdmin(userId, circleId) {
  const circle = await db.ReadingCircle.findByPk(circleId)
  if (!circle) return false
  if (circle.ownerId === userId) return true
  const membership = await db.CircleMember.findOne({
    where: { circleId, userId, circleRole: "admin", status: "accepted" },
  })
  return !!membership
}

async function notAlreadyMemberOrPending(userId, circleId) {
  const exists = await db.CircleMember.findOne({ where: { circleId, userId } })
  return !!exists
}

module.exports = { isCircleAdmin, notAlreadyMemberOrPending }
