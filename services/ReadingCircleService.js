const db = require("../models")

async function isCircleAdmin(userId, circleId) {
  const circle = await db.ReadingCircle.findByPk(circleId)
  if (!circle) return false

  console.log("DEBUG isCircleAdmin:", {
    userId,
    userIdType: typeof userId,
    ownerId: circle.ownerId,
    ownerIdType: typeof circle.ownerId,
    comparison: Number(circle.ownerId) === Number(userId),
  })

  if (Number(circle.ownerId) === Number(userId)) return true
  const membership = await db.CircleMember.findOne({
    where: { circleId, userId, circleRole: "admin", status: "accepted" },
  })
  return !!membership
}


async function isCircleModerator(userId, circleId) {
  const circle = await db.ReadingCircle.findByPk(circleId)
  if (!circle) return false

  const membership = await db.CircleMember.findOne({
    where: { circleId, userId, circleRole: "moderator", status: "accepted" },
  })
  return !!membership
}

async function notAlreadyMemberOrPending(userId, circleId) {
  const exists = await db.CircleMember.findOne({ where: { circleId, userId } })
  return !!exists
}

async function isReadingCircleMember(userId, circleId){
  const membership = await db.CircleMember.findOne(
    { where: { circleId, userId, status: "accepted" } }
  )
  return !!membership
}

module.exports = { isCircleAdmin, isCircleModerator, notAlreadyMemberOrPending, isReadingCircleMember }