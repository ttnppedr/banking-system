const prismaClient = require('../prisma/client')
const InsufficientBalanceError = require('../errors/InsufficientBalanceError')
const DEFAULT_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

const TYPE = {
  DEPOSIT: 1,
  WITHDRAW: 2,
  TRANSFER: 3,
};

const TYPE_LABEL = {
  1: 'DEPOSIT',
  2: 'WITHDRAW',
  3: 'TRANSFER',
};

const getTypeLabel = (type) => TYPE_LABEL[type];

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

const getTransactionsList = async (query = {}, metaCondition = { perPage: DEFAULT_PER_PAGE, page: DEFAULT_PAGE }) => {
  const { perPage, page } = metaCondition;

  return await prismaClient.transaction.findMany({
    take: perPage,
    skip: (page - 1) * perPage,
    where: query
  });
};

module.exports = { deposit, getTransactionById, withdraw, transfer, getTypeLabel, getTransactionsList, TYPE, TYPE_LABEL };
