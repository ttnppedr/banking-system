const { PrismaClient } = require('@prisma/client')

const prismaClient = require('../prisma/client')
const DEFAULT_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

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

const getUsersList = async (query = {}, metaCondition = { perPage: DEFAULT_PER_PAGE, page: DEFAULT_PAGE }) => {
  const { perPage, page } = metaCondition;

  return await prismaClient.user.findMany({
    take: perPage,
    skip: (page - 1) * perPage,
    where: query
  });
};

module.exports = { createUser, getUserByName, getUserById, getUsersList }
