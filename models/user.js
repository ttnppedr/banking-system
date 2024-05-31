const { PrismaClient } = require('@prisma/client')

const prismaClient = require('../prisma/client')

const createUser = async ({ name, balance }) => {
  return await prismaClient.user.create({
    data: {
      name: name,
      balance: balance
    },
  });
};

const getUserByName = async ({ name }) => {
  return await prismaClient.user.findUnique({
    where: { name }
  })
};

module.exports = { createUser, getUserByName }
