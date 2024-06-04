const Express = require('express')
const Router = Express.Router()
const TransactionController = require('../../controllers/transaction-controller')

Router.post('/', TransactionController.store);
Router.get('/', TransactionController.index);

module.exports = Router
