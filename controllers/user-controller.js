const { z } = require('zod')
const { badRequest, ok, unprocessableEntity, internalServerError, notFound, okWithMeta } = require('../utils/responses')
const { createUser, getUserByName, getUserById, getUsersList, getUsersCount } = require('../models/user')
const { DEFAULT_PAGE, DEFAULT_PER_PAGE } = require('../models/user')

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
  try {
    z.object({
      id: z.preprocess((x) => Number(x), z.number().int().min(1)),
    }).parse(req.params);

    const user = await getUserById({ id: Number(req.params.id) });

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

const index = async (req, res) => {
  try {
    z.object({
      name: z.optional(z.string()),
      page: z.optional(z.preprocess((x) => Number(x), z.number().int().min(1))),
      perPage: z.optional(z.preprocess((x) => Number(x), z.number().int().min(1))),
    }).parse(req.query);

    const name = req.query.name
    const page = Number(req.query.page ?? DEFAULT_PAGE);
    const perPage = Number(req.query.perPage ?? DEFAULT_PER_PAGE);

    const query = { name };
    const metaCondition = { page, perPage };

    const usersData = await getUsersList(query, metaCondition);
    const usersCount = await getUsersCount(query);

    return okWithMeta(res, usersData, { page, perPage, total: usersCount });
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return unprocessableEntity(res, error.errors)
    }

    return internalServerError(res);
  }
}

module.exports = { store, show, index }
