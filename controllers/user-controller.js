const { z } = require('zod')
const { badRequest, ok, unprocessableEntity, internalServerError, notFound } = require('../utils/responses')
const { createUser, getUserByName, getUserById } = require('../models/user')

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

const show = async (req, res) => {
  const id = Number(req.params.id);

  try {
    z.object({
      id: z.number().int(),
    }).parse({id});

    const user = await getUserById({ id });

    if (user === null) {
      return notFound(res);
    }

    return ok(res, user);
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return unprocessableEntity(res, error.errors)
    }

    return internalServerError(res);
  }
}

module.exports = { store, show }
