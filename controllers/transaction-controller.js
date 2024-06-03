const { z } = require('zod')
const { ok, internalServerError, notFound, unprocessableEntity } = require('../utils/responses')
const { deposit, getTransactionById } = require('../models/transaction')
const { TYPE } = require('../models/transaction')
const { getUserById } = require('../models/user')

const store = async (req, res) => {
  try {
    z.object({
      userId: z.number(),
      amount: z.number().int().min(1),
      type: z.enum(Object.keys(TYPE))
    }).parse(req.body);

    const userId = Number(req.body.userId);

    const user = await getUserById({ id: userId });

    if (user === null) {
      return notFound(res);
    }

    let transaction;

    switch (TYPE[req.body.type]) {
      case TYPE.DEPOSIT:
        transaction = await deposit({ userId, amount: req.body.amount });
        break;
    }

    transaction = await getTransactionById({ id: transaction.id });

    return ok(res, transaction)
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return unprocessableEntity(res, error.errors)
    }

    return internalServerError(res, error)
  }
}

module.exports = { store }
