const Express = require('express')
const Router = Express.Router()
const UserController = require('../../controllers/user-controller')

Router.post('/', UserController.store);

module.exports = Router
