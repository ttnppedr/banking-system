const Express = require('express')
const Router = Express.Router()
const UserRoutes = require('./user-routes');

Router.use("/users", UserRoutes)

module.exports = Router
