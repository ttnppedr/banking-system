const prismaClient = require('../prisma/client')
const InsufficientBalanceError = require('../errors/InsufficientBalanceError')

const TYPE = {
  DEPOSIT: 1,
  WITHDRAW: 2,
  TRANSFER: 3,
};

const deposit = async ({ userId, amount }) => {
  return await prismaClient.$transaction(async (tx) => {
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

const withdraw = async ({ userId, amount }) => {
  return await prismaClient.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount }
      }
    });

    if (user.balance < 0) {
      throw new InsufficientBalanceError();
    }

    return await tx.transaction.create({
      data: {
        type: TYPE.WITHDRAW,
        amount,
        userId,
      },
    });
  });
};

const transfer = async ({ userId, toId, amount }) => {
  return await prismaClient.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: amount }
      }
    });

    if (user.balance < 0) {
      throw new InsufficientBalanceError();
    }

    await tx.user.update({
      where: { id: toId },
      data: {
        balance: { increment: amount }
      }
    });

    await tx.transaction.create({
      data: {
        type: TYPE.TRANSFER,
        amount,
        userId: toId,
        fromId: userId,
        toId,
      },
    });

    return await tx.transaction.create({
      data: {
        type: TYPE.TRANSFER,
        amount,
        userId,
        fromId: userId,
        toId,
      },
    });
  });
};

module.exports = { deposit, getTransactionById, withdraw, transfer, TYPE };
