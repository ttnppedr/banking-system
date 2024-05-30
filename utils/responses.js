const { z } = require('zod')

const badRequest = (res, column, message) => {
  return res.status(400).json({ error: [{ path:[column], message: message }] });
}

const unprocessableEntity = (res, errors) =>  {
  const resContent = errors.reduce((accumulator, { path, message }) => [...accumulator, { path, message }], []);

  return res.status(422).json({ error: resContent });
}

const internalServerError = (res) => {
  return res.status(500).json({ error: [ { path:[], message: 'Something went wrong' }] });
}

const ok = (res, data) => {
  return res.status(200).json({ data: data });
}

module.exports = { badRequest, unprocessableEntity, internalServerError, ok }
