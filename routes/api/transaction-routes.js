const Express = require('express')
const Router = Express.Router()
const TransactionController = require('../../controllers/transaction-controller')

Router.post('/', TransactionController.store);

module.exports = Router
