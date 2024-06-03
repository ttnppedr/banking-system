const prismaClient = require('../prisma/client')

const TYPE = {
  DEPOSIT: 1,
  WITHDRAW: 2,
  TRANSFER: 3,
};

const deposit = ({ userId, amount }) => {
  return prismaClient.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: { increment: amount }
      }
    });

    return await tx.transaction.create({
      data: {
        type: TYPE.DEPOSIT,
        amount,
        userId,
      },
    });
  });
};

const getTransactionById = async ({ id }) => {
  return await prismaClient.transaction.findUnique({
    where: { id },
    include: {
      user: true,
      from: true,
      to: true,
    },
  });
};

module.exports = { deposit, getTransactionById, TYPE };
