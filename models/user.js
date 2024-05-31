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

const getUserById = async ({ id }) => {
  return await prismaClient.user.findUnique({
    where: { id }
  })
};

module.exports = { createUser, getUserByName, getUserById }
