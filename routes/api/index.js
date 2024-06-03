const Express = require('express')
const Router = Express.Router()
const UserRoutes = require('./user-routes');
const TransactionRoutes = require('./transaction-routes');

Router.use("/users", UserRoutes)
Router.use("/transactions", TransactionRoutes)

module.exports = Router
