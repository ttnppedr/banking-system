const { z } = require('zod')
const { ok, internalServerError, unprocessableEntity, badRequest, okWithMeta } = require('../utils/responses')
const { deposit, getTransactionById, withdraw, transfer, getTypeLabel, getTransactionsList, getTransactionsCount } = require('../models/transaction')
const { TYPE } = require('../models/transaction')
const { getUserById } = require('../models/user')
const InsufficientBalanceError = require('../errors/InsufficientBalanceError')
const { DEFAULT_PAGE, DEFAULT_PER_PAGE } = require('../models/transaction')

const store = async (req, res) => {
  try {
    z.object({
      userId: z.number(),
      amount: z.number().int().min(1),
      type: z.enum(Object.keys(TYPE)),
      toId: z.optional(z.number())
    })
    .refine((data) => !(data.type === getTypeLabel(TYPE.TRANSFER) && !data.toId), {
      path: ['toId'],
      message: 'toId is required for TRANSFER type'
    })
    .parse(req.body);

    const userId = Number(req.body.userId);

    const user = await getUserById({ id: userId });

    if (user === null) {
      return badRequest(res, 'userId', 'User not found');
    }

    let transaction;

    switch (TYPE[req.body.type]) {
      case TYPE.DEPOSIT:
        transaction = await deposit({ userId, amount: req.body.amount });
        break;
      case TYPE.WITHDRAW:
        transaction = await withdraw({ userId, amount: req.body.amount });
        break;
      case TYPE.TRANSFER:
        const toId = Number(req.body.toId);
        const toUser = await getUserById({ id: toId });
        if (toUser === null) {
          return badRequest(res, 'toId', 'User not found');
        }

        transaction = await transfer({ userId, toId, amount: req.body.amount });
        break;
    }

    transaction = await getTransactionById({ id: transaction.id });

    return ok(res, transaction)
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return unprocessableEntity(res, error.errors)
    }

    if (error instanceof InsufficientBalanceError) {
      return badRequest(res, 'amount', error.message)
    }

    return internalServerError(res, error)
  }
}

const index = async (req, res) => {
  try {
    z.object({
      userId: z.preprocess((x) => Number(x), z.number().int().min(1)),
      timeFrom: z.optional(z.string().datetime()),
      timeTo: z.optional(z.string().datetime()),
      page: z.optional(z.preprocess((x) => Number(x), z.number().int().min(1))),
      perPage: z.optional(z.preprocess((x) => Number(x), z.number().int().min(1))),
    }).parse(req.query);

    const userId = Number(req.query.userId);
    const page = Number(req.query.page ?? DEFAULT_PAGE);
    const perPage = Number(req.query.perPage ?? DEFAULT_PER_PAGE);
    const createdAt = {
      ...(req.query.timeFrom && {gte: req.query.timeFrom}),
      ...(req.query.timeTo && {lte: req.query.timeTo})
    };

    const query = { userId, createdAt};
    const metaCondition = { page, perPage };

    const transactionsData = await getTransactionsList(query, metaCondition);
    const transactionsCount = await getTransactionsCount(query);

    return okWithMeta(res, transactionsData, { page, perPage, total: transactionsCount });
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return unprocessableEntity(res, error.errors)
    }

    return internalServerError(res);
  }
}

module.exports = { store, index }
