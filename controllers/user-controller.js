const { z } = require('zod')
const { badRequest, ok, unprocessableEntity, internalServerError } = require('../utils/responses')
const { createUser, getUserByName } = require('../models/user')

const store = async (req, res) => {
  try {
    z.object({
      name: z.string(),
      balance: z.number().int().nonnegative().safe(),
    }).parse(req.body);

    const duplicationUser = await getUserByName({ name: req.body.name });

    if (duplicationUser !== null) {
      return badRequest(res, 'name', 'User already exists');
    }

    const user = await createUser({ name: req.body.name, balance: req.body.balance });

    return ok(res, user);
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return unprocessableEntity(res, error.errors)
    }

    return internalServerError(res);
  }
}

module.exports = { store }
